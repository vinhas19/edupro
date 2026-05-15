import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canWriteToSubjectFolder } from "@/lib/docs-permissions";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const folder = await prisma.folder.findUnique({ where: { id }, include: { _count: { select: { files: true, children: true } } } });
  if (!folder) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ok = await canWriteToSubjectFolder(
    session.user.id,
    session.user.role,
    session.user.schoolId,
    folder.classId,
    folder.subjectId,
  );
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (folder._count.files > 0 || folder._count.children > 0) {
    return NextResponse.json({ error: "Pasta não está vazia." }, { status: 409 });
  }

  await prisma.folder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
