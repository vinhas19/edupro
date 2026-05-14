import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, FctStatus } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { z } from "zod";

const patchSchema = z.object({
  companyName: z.string().optional(),
  supervisorName: z.string().nullable().optional(),
  supervisorEmail: z.string().nullable().optional(),
  supervisorPhone: z.string().nullable().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  requiredHours: z.number().int().positive().optional(),
  completedHours: z.number().int().min(0).optional(),
  grade: z.number().min(0).max(20).nullable().optional(),
  status: z.enum(["PLANNED", "ONGOING", "COMPLETED", "CANCELLED"]).optional(),
  notes: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.CLASS_DIRECTOR)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const existing = await prisma.fctRecord.findUnique({
    where: { id },
    include: { class: { include: { course: true } } },
  });
  if (!existing || existing.class.course.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.companyName !== undefined) data.companyName = parsed.data.companyName;
  if (parsed.data.supervisorName !== undefined) data.supervisorName = parsed.data.supervisorName;
  if (parsed.data.supervisorEmail !== undefined) data.supervisorEmail = parsed.data.supervisorEmail;
  if (parsed.data.supervisorPhone !== undefined) data.supervisorPhone = parsed.data.supervisorPhone;
  if (parsed.data.startDate) data.startDate = new Date(parsed.data.startDate);
  if (parsed.data.endDate) data.endDate = new Date(parsed.data.endDate);
  if (parsed.data.requiredHours !== undefined) data.requiredHours = parsed.data.requiredHours;
  if (parsed.data.completedHours !== undefined) data.completedHours = parsed.data.completedHours;
  if (parsed.data.grade !== undefined) data.grade = parsed.data.grade;
  if (parsed.data.status) data.status = parsed.data.status as FctStatus;
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;

  await prisma.fctRecord.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.fctRecord.findUnique({
    where: { id },
    include: { class: { include: { course: true } } },
  });
  if (!existing || existing.class.course.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.fctRecord.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
