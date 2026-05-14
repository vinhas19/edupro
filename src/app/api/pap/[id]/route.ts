import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, PapStatus } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { z } from "zod";

const patchSchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  advisorId: z.string().optional(),
  status: z.enum(["PROPOSAL", "DEVELOPMENT", "SUBMITTED", "PRESENTATION", "COMPLETED", "FAILED"]).optional(),
  finalGrade: z.number().min(0).max(20).nullable().optional(),
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

  const existing = await prisma.papRecord.findUnique({
    where: { id },
    include: { class: { include: { course: true } } },
  });
  if (!existing || existing.class.course.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.description !== undefined) data.description = parsed.data.description;
  if (parsed.data.advisorId !== undefined) data.advisorId = parsed.data.advisorId;
  if (parsed.data.status) data.status = parsed.data.status as PapStatus;
  if (parsed.data.finalGrade !== undefined) data.finalGrade = parsed.data.finalGrade;

  await prisma.papRecord.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}
