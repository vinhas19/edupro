import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, SubstitutionStatus } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { z } from "zod";
import {
  notify,
  resolveClassStudentIds,
  resolveGuardianIds,
  truncateSms,
} from "@/lib/notify";
import { SubstitutionAssignedEmail } from "@/emails/substitution-assigned";

const schema = z.object({
  substituteId: z.string().nullable().optional(),
  status: z.enum(["PENDING", "ASSIGNED", "CONFIRMED", "CANCELLED"]).optional(),
  notes: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.CLASS_DIRECTOR)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const sub = await prisma.substitution.findUnique({
    where: { id },
    include: {
      absence: { include: { teacher: { include: { school: true } } } },
      class: { include: { course: true } },
      subject: true,
    },
  });
  if (!sub || sub.absence.teacher.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const beforeSubstituteId = sub.substituteId;
  const beforeStatus = sub.status;

  await prisma.substitution.update({
    where: { id },
    data: {
      ...(parsed.data.substituteId !== undefined
        ? {
            substituteId: parsed.data.substituteId,
            status: parsed.data.substituteId
              ? SubstitutionStatus.ASSIGNED
              : SubstitutionStatus.PENDING,
          }
        : {}),
      ...(parsed.data.status ? { status: parsed.data.status as SubstitutionStatus } : {}),
      ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
    },
  });

  // Detetar transições que justifiquem notificação
  const newStatus = (parsed.data.status as SubstitutionStatus | undefined) ??
    (parsed.data.substituteId
      ? SubstitutionStatus.ASSIGNED
      : parsed.data.substituteId === null
        ? SubstitutionStatus.PENDING
        : beforeStatus);
  const newSubstituteId = parsed.data.substituteId !== undefined
    ? parsed.data.substituteId
    : beforeSubstituteId;

  const substituteChanged = parsed.data.substituteId !== undefined && parsed.data.substituteId !== beforeSubstituteId;
  const statusChanged = parsed.data.status && parsed.data.status !== beforeStatus;
  const isCancelled = newStatus === "CANCELLED";

  if (substituteChanged || statusChanged) {
    const substitute = newSubstituteId
      ? await prisma.user.findUnique({
          where: { id: newSubstituteId },
          select: { id: true, name: true },
        })
      : null;

    const lessonDate = new Date(sub.absence.date).toLocaleDateString("pt-PT");
    const lessonTime = `${sub.startTime} - ${sub.endTime}`;
    const className = `${sub.class.course.name} · ${sub.class.name}`;
    const subjectName = sub.subject.name;
    const absentTeacherName = sub.absence.teacher.name;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

    // Notificar substituto (se foi atribuído agora)
    if (substituteChanged && substitute) {
      void notify({
        schoolId: session.user.schoolId,
        senderId: session.user.id,
        category: "SUBSTITUTION",
        title: `Substituição atribuída · ${subjectName}`,
        content: `${className} · ${lessonDate} ${lessonTime}`,
        type: "INFO",
        recipientType: "INDIVIDUAL",
        recipientIds: [substitute.id],
        url: `${appUrl}/dashboard/substitutions`,
        email: {
          subject: `[${sub.absence.teacher.school.name}] Foste atribuído a uma substituição`,
          react: SubstitutionAssignedEmail({
            recipientName: substitute.name,
            schoolName: sub.absence.teacher.school.name,
            audience: "TEACHER",
            className,
            subjectName,
            date: lessonDate,
            time: lessonTime,
            absentTeacherName,
            substituteTeacherName: substitute.name,
            status: "ASSIGNED",
            url: `${appUrl}/dashboard/substitutions`,
          }),
        },
        sms: truncateSms(
          `Substituição: ${subjectName} (${className}) ${lessonDate} ${lessonTime}. Substitui ${absentTeacherName}.`,
        ),
      }).catch((err) => console.error("[notify] substitution to teacher failed", err));
    }

    // Notificar turma + EE em caso de cancelamento OU mudança de substituto/estado relevante
    if (isCancelled || substituteChanged) {
      const students = await resolveClassStudentIds(sub.classId);
      const guardians = await resolveGuardianIds(students);
      const recipients = [...new Set([...students, ...guardians])];

      void notify({
        schoolId: session.user.schoolId,
        senderId: session.user.id,
        category: isCancelled ? "LESSON_CANCELLED" : "SUBSTITUTION",
        title: isCancelled
          ? `Aula cancelada · ${subjectName}`
          : `Alteração na aula · ${subjectName}`,
        content: `${className} · ${lessonDate} ${lessonTime}`,
        type: isCancelled ? "ALERT" : "INFO",
        recipientType: "CLASS_STUDENTS",
        classId: sub.classId,
        recipientIds: recipients,
        url: `${appUrl}/dashboard/schedule`,
        urgentBypassQuietHours: isCancelled, // cancelamentos passam quiet hours
        email: {
          subject: isCancelled
            ? `[${sub.absence.teacher.school.name}] Aula cancelada — ${subjectName}`
            : `[${sub.absence.teacher.school.name}] Substituição — ${subjectName}`,
          react: SubstitutionAssignedEmail({
            recipientName: "—",
            schoolName: sub.absence.teacher.school.name,
            audience: "STUDENT",
            className,
            subjectName,
            date: lessonDate,
            time: lessonTime,
            absentTeacherName,
            substituteTeacherName: substitute?.name,
            status: newStatus,
            url: `${appUrl}/dashboard/schedule`,
          }),
        },
        sms: truncateSms(
          isCancelled
            ? `Aula CANCELADA: ${subjectName} (${className}) ${lessonDate} ${lessonTime}.`
            : `Substituição: ${subjectName} (${className}) ${lessonDate} ${lessonTime} → ${substitute?.name ?? "—"}.`,
        ),
      }).catch((err) => console.error("[notify] substitution to class failed", err));
    }
  }

  return NextResponse.json({ ok: true });
}
