import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { findScheduleConflicts, formatConflict } from "@/lib/schedule";
import { z } from "zod";

const schema = z.object({
  classId: z.string(),
  subjectId: z.string(),
  teacherId: z.string().optional(),
  roomId: z.string().optional(),
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  meetingUrl: z.string().url().nullable().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  // Verify all references belong to this school
  const cls = await prisma.class.findUnique({
    where: { id: parsed.data.classId },
    include: { course: true },
  });
  if (!cls || cls.course.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Turma inválida" }, { status: 400 });
  }

  // Conflict check
  const conflicts = await findScheduleConflicts(parsed.data);
  if (conflicts.length > 0) {
    return NextResponse.json(
      {
        error: "Conflito de horário",
        conflicts: conflicts.map((c) => ({ kind: c.kind, message: formatConflict(c) })),
      },
      { status: 409 }
    );
  }

  const block = await prisma.scheduleBlock.create({
    data: parsed.data,
  });

  return NextResponse.json({ id: block.id }, { status: 201 });
}
