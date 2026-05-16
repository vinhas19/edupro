import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { z } from "zod";

const updateSchema = z.object({
  summary: z.string().optional(),
  lessonNumber: z.number().int().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    select: { teacherId: true, class: { select: { course: { select: { schoolId: true } } } } },
  });
  if (!lesson || lesson.class.course.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Permissão: professor da aula, DT, admin ou diretor de curso
  const isOwner = lesson.teacherId === session.user.id;
  const canEdit = isOwner || hasRole(session.user.role, Role.CLASS_DIRECTOR);
  if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updated = await prisma.lesson.update({
    where: { id },
    data: {
      ...(parsed.data.summary !== undefined ? { summary: parsed.data.summary || null } : {}),
      ...(parsed.data.lessonNumber !== undefined ? { lessonNumber: parsed.data.lessonNumber } : {}),
    },
  });

  return NextResponse.json(updated);
}
