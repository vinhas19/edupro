import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import bcrypt from "bcryptjs";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  active: z.boolean().optional(),
  role: z.enum([
    "SCHOOL_ADMIN",
    "COURSE_DIRECTOR",
    "CLASS_DIRECTOR",
    "TEACHER",
    "STUDENT",
  ]).optional(),
  newPassword: z.string().min(8).optional(),
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

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || target.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.name) data.name = parsed.data.name;
  if (parsed.data.active !== undefined) data.active = parsed.data.active;
  if (parsed.data.role) data.role = parsed.data.role as Role;
  if (parsed.data.newPassword) data.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);

  await prisma.user.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || target.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (id === session.user.id) {
    return NextResponse.json({ error: "Não pode desativar a sua própria conta" }, { status: 400 });
  }

  await prisma.user.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
