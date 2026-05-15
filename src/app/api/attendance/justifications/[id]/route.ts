import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { notify, resolveGuardianIds, truncateSms } from "@/lib/notify";
import { JustificationStatusEmail } from "@/emails/justification-status";

const decisionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  comment: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.CLASS_DIRECTOR)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const just = await prisma.absenceJustification.findUnique({
    where: { id },
    include: {
      attendanceRecord: {
        include: {
          lesson: {
            include: {
              class: { include: { course: { include: { school: true } } } },
              subject: true,
            },
          },
          student: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!just) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  if (just.attendanceRecord.lesson.class.course.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.absenceJustification.update({
      where: { id },
      data: {
        status: parsed.data.decision,
        approvedById: session.user.id,
        approvedAt: new Date(),
      },
    }),
    ...(parsed.data.decision === "APPROVED"
      ? [
          prisma.attendanceRecord.update({
            where: { id: just.attendanceRecordId },
            data: { status: "JUSTIFIED" },
          }),
        ]
      : []),
  ]);

  await logAudit({
    schoolId: session.user.schoolId,
    userId: session.user.id,
    action: parsed.data.decision === "APPROVED" ? "justification.approve" : "justification.reject",
    entity: "AbsenceJustification",
    entityId: id,
    meta: parsed.data.comment ? { comment: parsed.data.comment } : undefined,
  });

  // Notificar aluno + EE
  const approver = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  });

  const student = just.attendanceRecord.student;
  const guardians = await resolveGuardianIds([student.id]);
  const recipients = [...new Set([student.id, ...guardians])];

  const lesson = just.attendanceRecord.lesson;
  const lessonDate = new Date(lesson.date).toLocaleDateString("pt-PT");
  const subjectName = lesson.subject.name;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  void notify({
    schoolId: session.user.schoolId,
    senderId: session.user.id,
    category: "JUSTIFICATION",
    title:
      parsed.data.decision === "APPROVED"
        ? `Justificação aprovada · ${subjectName}`
        : `Justificação rejeitada · ${subjectName}`,
    content: `${student.name} · ${lessonDate}`,
    type: parsed.data.decision === "APPROVED" ? "INFO" : "WARNING",
    recipientType: "INDIVIDUAL",
    recipientIds: recipients,
    url: `${appUrl}/dashboard/attendance/justifications`,
    email: {
      subject:
        parsed.data.decision === "APPROVED"
          ? `[${lesson.class.course.school.name}] Justificação aprovada — ${subjectName}`
          : `[${lesson.class.course.school.name}] Justificação rejeitada — ${subjectName}`,
      react: JustificationStatusEmail({
        recipientName: "—",
        schoolName: lesson.class.course.school.name,
        studentName: student.name,
        subjectName,
        lessonDate,
        decision: parsed.data.decision,
        approverName: approver?.name ?? "Diretor de turma",
        comment: parsed.data.comment,
        url: `${appUrl}/dashboard/attendance/justifications`,
      }),
    },
    sms: truncateSms(
      `Justificação ${parsed.data.decision === "APPROVED" ? "aprovada" : "rejeitada"} para ${student.name} (${subjectName}, ${lessonDate}).`,
    ),
  }).catch((err) => console.error("[notify] justification-status failed", err));

  return NextResponse.json({ ok: true });
}
