import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { z } from "zod";

const patchSchema = z.object({
  meetingUrl: z.string().url().nullable().optional(),
  roomId: z.string().nullable().optional(),
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

  const block = await prisma.scheduleBlock.findUnique({
    where: { id },
    include: { class: { include: { course: true } } },
  });
  if (!block || block.class.course.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.scheduleBlock.update({
    where: { id },
    data: {
      ...(parsed.data.meetingUrl !== undefined ? { meetingUrl: parsed.data.meetingUrl } : {}),
      ...(parsed.data.roomId !== undefined ? { roomId: parsed.data.roomId } : {}),
    },
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
  const block = await prisma.scheduleBlock.findUnique({
    where: { id },
    include: { class: { include: { course: true } } },
  });
  if (!block || block.class.course.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.scheduleBlock.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
