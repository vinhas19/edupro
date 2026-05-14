import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { deleteObject } from "@/lib/r2";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const file = await prisma.file.findUnique({ where: { id }, include: { owner: true } });
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (file.owner.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = file.ownerId === session.user.id;
  const isAdmin = hasRole(session.user.role, Role.SCHOOL_ADMIN);
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete from R2, ignore failures
  try {
    await deleteObject(file.storageKey);
  } catch {}

  await prisma.file.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const file = await prisma.file.findUnique({ where: { id }, include: { owner: true } });
  if (!file || file.owner.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (file.ownerId !== session.user.id && !hasRole(session.user.role, Role.SCHOOL_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.file.update({
    where: { id },
    data: {
      ...(body.name ? { name: body.name } : {}),
      ...(body.visibility ? { visibility: body.visibility } : {}),
      ...(body.classId !== undefined ? { classId: body.classId } : {}),
      ...(body.subjectId !== undefined ? { subjectId: body.subjectId } : {}),
    },
  });
  return NextResponse.json(updated);
}
