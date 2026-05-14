import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, SubstitutionStatus } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { overlaps } from "@/lib/schedule";
import { z } from "zod";

const schema = z.object({
  teacherId: z.string(),
  date: z.string(),              // yyyy-mm-dd
  startTime: z.string(),
  endTime: z.string(),
  reason: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.CLASS_DIRECTOR)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const teacher = await prisma.user.findUnique({ where: { id: parsed.data.teacherId } });
  if (!teacher || teacher.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Professor inválido" }, { status: 400 });
  }

  // Find affected schedule blocks
  const date = new Date(parsed.data.date);
  const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // JS: 0=Sun, our schema: 1=Mon..7=Sun

  const blocks = await prisma.scheduleBlock.findMany({
    where: { teacherId: parsed.data.teacherId, dayOfWeek },
    include: { class: { include: { course: true } }, subject: true },
  });
  const affected = blocks.filter((b) =>
    overlaps(parsed.data.startTime, parsed.data.endTime, b.startTime, b.endTime)
  );

  // Create absence + one Substitution per affected block (PENDING)
  const absence = await prisma.teacherAbsence.create({
    data: {
      teacherId: parsed.data.teacherId,
      date,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      reason: parsed.data.reason,
      createdById: session.user.id,
      substitutions: {
        create: affected.map((b) => ({
          scheduleBlockId: b.id,
          classId: b.classId,
          subjectId: b.subjectId,
          startTime: b.startTime,
          endTime: b.endTime,
          status: SubstitutionStatus.PENDING,
        })),
      },
    },
  });

  return NextResponse.json({ id: absence.id, affectedClasses: affected.length }, { status: 201 });
}
