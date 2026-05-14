import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  classId: z.string(),
  name: z.string().min(1).max(80),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.TEACHER)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const cls = await prisma.class.findUnique({
    where: { id: parsed.data.classId },
    include: { course: true },
  });
  if (!cls || cls.course.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const maxOrder = await prisma.classroomTopic.findFirst({
    where: { classId: parsed.data.classId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const topic = await prisma.classroomTopic.create({
    data: {
      classId: parsed.data.classId,
      name: parsed.data.name,
      order: (maxOrder?.order ?? 0) + 1,
    },
  });

  return NextResponse.json({ id: topic.id }, { status: 201 });
}
