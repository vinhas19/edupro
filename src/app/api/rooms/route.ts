import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, RoomType } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  capacity: z.number().int().min(1).max(2000).nullable().optional(),
  type: z.enum(["CLASSROOM", "LAB", "WORKSHOP", "GYM", "AUDITORIUM", "OTHER"]).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const room = await prisma.room.create({
    data: {
      schoolId: session.user.schoolId,
      name: parsed.data.name.trim(),
      capacity: parsed.data.capacity ?? null,
      type: (parsed.data.type ?? "CLASSROOM") as RoomType,
    },
  });

  await logAudit({
    schoolId: session.user.schoolId,
    userId: session.user.id,
    action: "room.create",
    entity: "Room",
    entityId: room.id,
  });

  return NextResponse.json({ id: room.id }, { status: 201 });
}
