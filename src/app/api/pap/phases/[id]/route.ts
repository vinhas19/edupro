import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, PhaseStatus } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  dueDate: z.string().nullable().optional(),
  submittedAt: z.string().nullable().optional(),
  fileUrl: z.string().nullable().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "SUBMITTED", "APPROVED", "REJECTED"]).optional(),
  notes: z.string().nullable().optional(),
  progress: z.number().int().min(0).max(100).optional(),
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

  const phase = await prisma.papPhase.findUnique({
    where: { id },
    include: { pap: { include: { class: { include: { course: true } } } } },
  });
  if (!phase || phase.pap.class.course.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.papPhase.update({
    where: { id },
    data: {
      ...(parsed.data.dueDate !== undefined ? { dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null } : {}),
      ...(parsed.data.submittedAt !== undefined ? { submittedAt: parsed.data.submittedAt ? new Date(parsed.data.submittedAt) : null } : {}),
      ...(parsed.data.fileUrl !== undefined ? { fileUrl: parsed.data.fileUrl } : {}),
      ...(parsed.data.status ? { status: parsed.data.status as PhaseStatus } : {}),
      ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
      ...(parsed.data.progress !== undefined ? { progress: parsed.data.progress } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
