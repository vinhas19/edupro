import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { z } from "zod";

const createSchema = z.object({
  attendanceRecordId: z.string(),
  reason: z.string().min(3),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const record = await prisma.attendanceRecord.findUnique({
    where: { id: parsed.data.attendanceRecordId },
    include: { lesson: { include: { class: true } } },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (record.studentId !== session.user.id && !hasRole(session.user.role, Role.CLASS_DIRECTOR)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const justification = await prisma.absenceJustification.upsert({
    where: { attendanceRecordId: record.id },
    update: { reason: parsed.data.reason, status: "PENDING" },
    create: {
      attendanceRecordId: record.id,
      reason: parsed.data.reason,
      status: "PENDING",
    },
  });

  return NextResponse.json({ id: justification.id }, { status: 201 });
}

const decideSchema = z.object({
  justificationId: z.string(),
  decision: z.enum(["APPROVED", "REJECTED"]),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.CLASS_DIRECTOR)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = decideSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const updated = await prisma.absenceJustification.update({
    where: { id: parsed.data.justificationId },
    data: {
      status: parsed.data.decision,
      approvedAt: new Date(),
      approvedById: session.user.id,
    },
  });

  if (parsed.data.decision === "APPROVED") {
    await prisma.attendanceRecord.update({
      where: { id: updated.attendanceRecordId },
      data: { status: "JUSTIFIED" },
    });
  }

  return NextResponse.json({ ok: true });
}
