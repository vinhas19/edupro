import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, RoomType } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  capacity: z.number().int().min(1).max(2000).nullable().optional(),
  type: z.enum(["CLASSROOM", "LAB", "WORKSHOP", "GYM", "AUDITORIUM", "OTHER"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const room = await prisma.room.findUnique({ where: { id } });
  if (!room || room.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.room.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name.trim() } : {}),
      ...(parsed.data.capacity !== undefined ? { capacity: parsed.data.capacity } : {}),
      ...(parsed.data.type !== undefined ? { type: parsed.data.type as RoomType } : {}),
    },
  });

  await logAudit({
    schoolId: session.user.schoolId,
    userId: session.user.id,
    action: "room.update",
    entity: "Room",
    entityId: id,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room || room.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await prisma.room.delete({ where: { id } });
  } catch {
    return NextResponse.json(
      { error: "Não é possível apagar: sala está atribuída a aulas no horário." },
      { status: 409 },
    );
  }

  await logAudit({
    schoolId: session.user.schoolId,
    userId: session.user.id,
    action: "room.delete",
    entity: "Room",
    entityId: id,
  });

  return NextResponse.json({ ok: true });
}
