import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const createSchema = z.object({
  attendanceRecordId: z.string(),
  reason: z.string().min(5),
  documentUrl: z.string().url().nullable().optional(),
});

// Student/Guardian creates a justification request for an absence.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const record = await prisma.attendanceRecord.findUnique({
    where: { id: parsed.data.attendanceRecordId },
    include: { lesson: { select: { classId: true } } },
  });
  if (!record) return NextResponse.json({ error: "Falta não encontrada" }, { status: 404 });

  // Permission: student themselves, their guardian, or staff
  const isOwnerStudent = record.studentId === session.user.id;
  let isGuardian = false;
  if (!isOwnerStudent && session.user.role === Role.GUARDIAN) {
    const link = await prisma.guardianLink.findUnique({
      where: { guardianId_studentId: { guardianId: session.user.id, studentId: record.studentId } },
    });
    isGuardian = !!link;
  }
  if (!isOwnerStudent && !isGuardian && session.user.role === Role.STUDENT) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Upsert: replace any previous pending request
  const existing = await prisma.absenceJustification.findUnique({
    where: { attendanceRecordId: record.id },
  });

  let saved;
  if (existing) {
    saved = await prisma.absenceJustification.update({
      where: { id: existing.id },
      data: {
        reason: parsed.data.reason,
        documentUrl: parsed.data.documentUrl ?? null,
        status: "PENDING",
        approvedById: null,
        approvedAt: null,
      },
    });
  } else {
    saved = await prisma.absenceJustification.create({
      data: {
        attendanceRecordId: record.id,
        reason: parsed.data.reason,
        documentUrl: parsed.data.documentUrl ?? null,
      },
    });
  }

  await logAudit({
    schoolId: session.user.schoolId,
    userId: session.user.id,
    action: "justification.create",
    entity: "AbsenceJustification",
    entityId: saved.id,
  });

  return NextResponse.json({ id: saved.id }, { status: 201 });
}
