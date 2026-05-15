import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, SubmissionStatus, ModuleStatus, EvaluationType } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

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

  return NextResponse.json(updated);
}
