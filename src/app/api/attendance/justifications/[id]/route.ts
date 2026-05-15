import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

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
    include: { attendanceRecord: { include: { lesson: { include: { class: { include: { course: true } } } } } } },
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
    // If approved, flip the attendance status to JUSTIFIED
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

  return NextResponse.json({ ok: true });
}
