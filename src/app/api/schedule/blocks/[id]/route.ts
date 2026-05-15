import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { z } from "zod";
import {
  notify,
  resolveClassStudentIds,
  resolveGuardianIds,
  truncateSms,
} from "@/lib/notify";
import { ScheduleChangeEmail } from "@/emails/schedule-change";

const patchSchema = z.object({
  meetingUrl: z.string().url().nullable().optional(),
  roomId: z.string().nullable().optional(),
});

const DAY_LABELS = ["", "2ª feira", "3ª feira", "4ª feira", "5ª feira", "6ª feira", "Sábado", "Domingo"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const block = await prisma.scheduleBlock.findUnique({
    where: { id },
    include: {
      class: { include: { course: { include: { school: true } } } },
      subject: true,
      room: true,
      teacher: true,
    },
  });
  if (!block || block.class.course.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const beforeRoom = block.room?.name ?? null;

  await prisma.scheduleBlock.update({
    where: { id },
    data: {
      ...(parsed.data.meetingUrl !== undefined ? { meetingUrl: parsed.data.meetingUrl } : {}),
      ...(parsed.data.roomId !== undefined ? { roomId: parsed.data.roomId } : {}),
    },
  });

  // Notificar apenas se houve mudança relevante
  const roomChanged = parsed.data.roomId !== undefined;
  if (roomChanged) {
    const newRoom = parsed.data.roomId
      ? await prisma.room.findUnique({ where: { id: parsed.data.roomId } })
      : null;

    const students = await resolveClassStudentIds(block.classId);
    const guardians = await resolveGuardianIds(students);
    const recipients = [...new Set([...students, ...guardians, ...(block.teacherId ? [block.teacherId] : [])])];

    const className = `${block.class.course.name} · ${block.class.name}`;
    const subjectName = block.subject.name;
    const day = DAY_LABELS[block.dayOfWeek] ?? "";
    const time = `${block.startTime} - ${block.endTime}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

    void notify({
      schoolId: session.user.schoolId,
      senderId: session.user.id,
      category: "SCHEDULE_CHANGE",
      title: `Sala alterada · ${subjectName}`,
      content: `${className} · ${day} ${time} · ${newRoom?.name ?? "sem sala"}`,
      type: "INFO",
      recipientType: "CLASS_STUDENTS",
      classId: block.classId,
      recipientIds: recipients,
      url: `${appUrl}/dashboard/schedule`,
      email: {
        subject: `[${block.class.course.school.name}] Sala alterada — ${subjectName}`,
        react: ScheduleChangeEmail({
          recipientName: "—",
          schoolName: block.class.course.school.name,
          className,
          subjectName,
          changeType: "ROOM_CHANGED",
          before: { day, time, room: beforeRoom ?? "—", teacher: block.teacher?.name },
          after: { day, time, room: newRoom?.name ?? "—", teacher: block.teacher?.name },
          url: `${appUrl}/dashboard/schedule`,
        }),
      },
      sms: truncateSms(
        `Sala alterada: ${subjectName} (${className}) ${day} ${time} → ${newRoom?.name ?? "sem sala"}`,
      ),
    }).catch((err) => console.error("[notify] schedule-change failed", err));
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const block = await prisma.scheduleBlock.findUnique({
    where: { id },
    include: {
      class: { include: { course: { include: { school: true } } } },
      subject: true,
      room: true,
      teacher: true,
    },
  });
  if (!block || block.class.course.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.scheduleBlock.delete({ where: { id } });

  // Notificar a turma + EE + professor
  const students = await resolveClassStudentIds(block.classId);
  const guardians = await resolveGuardianIds(students);
  const recipients = [...new Set([...students, ...guardians, ...(block.teacherId ? [block.teacherId] : [])])];

  const className = `${block.class.course.name} · ${block.class.name}`;
  const subjectName = block.subject.name;
  const day = DAY_LABELS[block.dayOfWeek] ?? "";
  const time = `${block.startTime} - ${block.endTime}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  void notify({
    schoolId: session.user.schoolId,
    senderId: session.user.id,
    category: "SCHEDULE_CHANGE",
    title: `Aula removida · ${subjectName}`,
    content: `${className} · ${day} ${time}`,
    type: "WARNING",
    recipientType: "CLASS_STUDENTS",
    classId: block.classId,
    recipientIds: recipients,
    url: `${appUrl}/dashboard/schedule`,
    email: {
      subject: `[${block.class.course.school.name}] Aula removida — ${subjectName}`,
      react: ScheduleChangeEmail({
        recipientName: "—",
        schoolName: block.class.course.school.name,
        className,
        subjectName,
        changeType: "DELETED",
        before: { day, time, room: block.room?.name, teacher: block.teacher?.name },
        url: `${appUrl}/dashboard/schedule`,
      }),
    },
    sms: truncateSms(`Aula removida: ${subjectName} (${className}) ${day} ${time}.`),
  }).catch((err) => console.error("[notify] schedule-delete failed", err));

  return NextResponse.json({ ok: true });
}
