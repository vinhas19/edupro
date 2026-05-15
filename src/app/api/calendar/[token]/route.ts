import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { buildICal, type ICalBlock } from "@/lib/ical";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || token.length < 16) {
    return new NextResponse("Token inválido", { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { iCalToken: token, active: true },
    select: { id: true, name: true, role: true, schoolId: true },
  });

  if (!user) return new NextResponse("Não encontrado", { status: 404 });

  let blocks: ICalBlock[] = [];

  if (user.role === Role.STUDENT) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: user.id, status: "ACTIVE" },
    });
    if (enrollment) {
      const raw = await prisma.scheduleBlock.findMany({
        where: { classId: enrollment.classId },
        include: {
          subject: { select: { name: true } },
          teacher: { select: { name: true } },
          room: { select: { name: true } },
          class: { select: { name: true } },
        },
      });
      blocks = raw.map((b) => ({
        id: b.id,
        dayOfWeek: b.dayOfWeek,
        startTime: b.startTime,
        endTime: b.endTime,
        subject: b.subject.name,
        teacher: b.teacher?.name ?? null,
        room: b.room?.name ?? null,
        className: b.class.name,
        meetingUrl: b.meetingUrl ?? null,
        validFrom: b.validFrom,
        validUntil: b.validUntil,
      }));
    }
  } else if (user.role === Role.TEACHER || user.role === Role.CLASS_DIRECTOR || user.role === Role.COURSE_DIRECTOR) {
    const raw = await prisma.scheduleBlock.findMany({
      where: { teacherId: user.id },
      include: {
        subject: { select: { name: true } },
        teacher: { select: { name: true } },
        room: { select: { name: true } },
        class: { select: { name: true } },
      },
    });
    blocks = raw.map((b) => ({
      id: b.id,
      dayOfWeek: b.dayOfWeek,
      startTime: b.startTime,
      endTime: b.endTime,
      subject: b.subject.name,
      teacher: b.teacher?.name ?? null,
      room: b.room?.name ?? null,
      className: b.class.name,
      meetingUrl: b.meetingUrl ?? null,
      validFrom: b.validFrom,
      validUntil: b.validUntil,
    }));
  } else if (user.role === Role.GUARDIAN) {
    // Aggregate wards' schedules
    const wards = await prisma.guardianLink.findMany({
      where: { guardianId: user.id },
      select: { studentId: true },
    });
    const wardIds = wards.map((w) => w.studentId);
    if (wardIds.length) {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: { in: wardIds }, status: "ACTIVE" },
        select: { classId: true },
      });
      const classIds = [...new Set(enrollments.map((e) => e.classId))];
      const raw = await prisma.scheduleBlock.findMany({
        where: { classId: { in: classIds } },
        include: {
          subject: { select: { name: true } },
          teacher: { select: { name: true } },
          room: { select: { name: true } },
          class: { select: { name: true } },
        },
      });
      blocks = raw.map((b) => ({
        id: b.id,
        dayOfWeek: b.dayOfWeek,
        startTime: b.startTime,
        endTime: b.endTime,
        subject: b.subject.name,
        teacher: b.teacher?.name ?? null,
        room: b.room?.name ?? null,
        className: b.class.name,
        meetingUrl: b.meetingUrl ?? null,
        validFrom: b.validFrom,
        validUntil: b.validUntil,
      }));
    }
  }

  const ay = await prisma.academicYear.findFirst({
    where: { schoolId: user.schoolId, active: true },
    select: { startDate: true, endDate: true },
  });

  const ics = buildICal({
    calName: `EduPro · ${user.name}`,
    blocks,
    defaultStartDate: ay?.startDate ?? new Date(),
    defaultEndDate: ay?.endDate ?? new Date(new Date().getFullYear() + 1, 6, 31),
  });

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="edupro.ics"',
      "Cache-Control": "private, max-age=300",
    },
  });
}
