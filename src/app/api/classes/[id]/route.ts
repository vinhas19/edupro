import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  year: z.number().int().min(1).max(5).optional(),
  classDirectorId: z.string().nullable().optional(),
  academicYearId: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const existing = await prisma.class.findUnique({
    where: { id },
    include: { course: true },
  });
  if (!existing || existing.course.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.class.update({ where: { id }, data: parsed.data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const existing = await prisma.class.findUnique({
    where: { id },
    include: { course: true, _count: { select: { enrollments: true, lessons: true } } },
  });
  if (!existing || existing.course.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing._count.enrollments > 0 || existing._count.lessons > 0) {
    return NextResponse.json(
      { error: "Não é possível apagar — a turma tem alunos matriculados ou aulas registadas" },
      { status: 400 }
    );
  }
  await prisma.class.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
