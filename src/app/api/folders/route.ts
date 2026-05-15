import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { canWriteToSubjectFolder } from "@/lib/docs-permissions";

const schema = z.object({
  name: z.string().min(1).max(80),
  classId: z.string(),
  subjectId: z.string().nullable().optional(),
  moduleId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const ok = await canWriteToSubjectFolder(
    session.user.id,
    session.user.role,
    session.user.schoolId,
    parsed.data.classId,
    parsed.data.subjectId ?? null,
  );
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // If parent is set, must belong to same scope
  if (parsed.data.parentId) {
    const parent = await prisma.folder.findUnique({ where: { id: parsed.data.parentId } });
    if (!parent || parent.classId !== parsed.data.classId) {
      return NextResponse.json({ error: "Pasta pai inválida" }, { status: 400 });
    }
  }

  const folder = await prisma.folder.create({
    data: {
      name: parsed.data.name.trim(),
      classId: parsed.data.classId,
      subjectId: parsed.data.subjectId ?? null,
      moduleId: parsed.data.moduleId ?? null,
      parentId: parsed.data.parentId ?? null,
      createdById: session.user.id,
    },
  });

  return NextResponse.json({ id: folder.id }, { status: 201 });
}
