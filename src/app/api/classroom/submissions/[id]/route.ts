import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, SubmissionStatus, ModuleStatus, EvaluationType } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { notify, resolveGuardianIds, truncateSms } from "@/lib/notify";
import { GradePublishedEmail } from "@/emails/grade-published";

const gradeSchema = z.object({
  grade: z.number().min(0).max(20).nullable().optional(),
  feedback: z.string().optional(),
  status: z.enum(["RETURNED", "GRADED"]).optional(),
  privateComment: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.TEACHER)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = gradeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      post: {
        include: {
          class: { include: { course: true, classDirector: { select: { id: true } } } },
          subject: { select: { id: true } },
          module: { select: { id: true } },
        },
      },
    },
  });
  if (!submission || submission.post.class.course.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Apenas o professor que lecciona a disciplina, o DT da turma, ou admin podem avaliar
  const isAdmin = hasRole(session.user.role, Role.SCHOOL_ADMIN);
  const isDirector = submission.post.class.classDirectorId === session.user.id;
  let isTeachingSubject = false;
  if (submission.post.subjectId) {
    const assignment = await prisma.subjectAssignment.findFirst({
      where: {
        teacherId: session.user.id,
        classId: submission.post.classId,
        subjectId: submission.post.subjectId,
      },
    });
    isTeachingSubject = !!assignment;
  }
  if (!isAdmin && !isDirector && !isTeachingSubject) {
    return NextResponse.json({ error: "Não és professor desta disciplina." }, { status: 403 });
  }

  const status =
    parsed.data.status ??
    (parsed.data.grade != null ? SubmissionStatus.GRADED : submission.status);

  const updated = await prisma.submission.update({
    where: { id },
    data: {
      grade: parsed.data.grade,
      feedback: parsed.data.feedback,
      status,
      reviewedAt: new Date(),
      reviewerId: session.user.id,
    },
  });

  // Propagate to module evaluation if the task counts for module grade
  if (
    parsed.data.grade != null &&
    submission.post.countsForModule &&
    submission.post.moduleId
  ) {
    const moduleId = submission.post.moduleId;
    const studentId = submission.studentId;

    const progress = await prisma.studentModuleProgress.upsert({
      where: { studentId_moduleId: { studentId, moduleId } },
      create: {
        studentId,
        moduleId,
        status: parsed.data.grade >= 10 ? ModuleStatus.APPROVED : ModuleStatus.IN_PROGRESS,
        grade: parsed.data.grade,
      },
      update: {
        grade: parsed.data.grade,
        status:
          parsed.data.grade >= 10
            ? ModuleStatus.APPROVED
            : ModuleStatus.IN_PROGRESS,
      },
    });

    // Append evaluation entry tagged by the post (avoid duplicates per submission)
    await prisma.moduleEvaluation.create({
      data: {
        progressId: progress.id,
        type: EvaluationType.NORMAL,
        grade: parsed.data.grade,
        date: new Date(),
        notes: `Tarefa: ${submission.post.title ?? submission.post.id}`,
      },
    });
  }

  if (parsed.data.privateComment?.trim()) {
    await prisma.privateComment.create({
      data: {
        submissionId: id,
        senderId: session.user.id,
        content: parsed.data.privateComment.trim(),
      },
    });
  }

  await logAudit({
    schoolId: session.user.schoolId,
    userId: session.user.id,
    action: "grade.update",
    entity: "Submission",
    entityId: id,
    meta: { grade: parsed.data.grade ?? null },
  });

  // Notificar aluno + EE quando há nota nova
  if (parsed.data.grade != null && submission.studentId !== session.user.id) {
    const full = await prisma.submission.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true } },
        post: {
          include: {
            subject: { select: { name: true } },
            module: { select: { name: true } },
            class: { include: { course: { include: { school: true } } } },
          },
        },
      },
    });
    if (full) {
      const reviewer = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true },
      });
      const guardians = await resolveGuardianIds([full.studentId]);
      const recipients = [...new Set([full.studentId, ...guardians])];
      const subjectName = full.post.subject?.name ?? full.post.title ?? "Disciplina";
      const moduleName = full.post.module?.name;
      const grade = parsed.data.grade;
      const maxGrade = full.post.maxGrade ?? 20;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

      void notify({
        schoolId: session.user.schoolId,
        senderId: session.user.id,
        category: "GRADE",
        title: `Nota publicada · ${subjectName}`,
        content: `${full.student.name} · ${grade}/${maxGrade}`,
        type: "INFO",
        recipientType: "INDIVIDUAL",
        recipientIds: recipients,
        url: `${appUrl}/dashboard/boletim`,
        email: {
          subject: `[${full.post.class.course.school.name}] Nova nota — ${subjectName}`,
          react: GradePublishedEmail({
            recipientName: "—",
            schoolName: full.post.class.course.school.name,
            studentName: full.student.name,
            subjectName,
            moduleName,
            grade,
            maxGrade,
            status: full.post.countsForModule
              ? grade >= 10
                ? "APPROVED"
                : "FAILED"
              : undefined,
            evaluatorName: reviewer?.name,
            url: `${appUrl}/dashboard/boletim`,
          }),
        },
        sms: truncateSms(
          `Nota: ${full.student.name} ${grade}/${maxGrade} em ${subjectName}.`,
        ),
      }).catch((err) => console.error("[notify] grade failed", err));
    }
  }

  return NextResponse.json(updated);
}
