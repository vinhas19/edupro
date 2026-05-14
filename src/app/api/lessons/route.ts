import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  subjectId: z.string(),
  classId: z.string(),
  teacherId: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  summary: z.string().optional(),
  lessonNumber: z.number().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const lesson = await prisma.lesson.create({
    data: {
      ...parsed.data,
      date: new Date(parsed.data.date),
    },
  });

  return NextResponse.json(lesson, { status: 201 });
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const date = searchParams.get("date");

  const lessons = await prisma.lesson.findMany({
    where: {
      ...(classId ? { classId } : {}),
      ...(date ? { date: new Date(date) } : {}),
      teacher: { schoolId: session.user.schoolId },
    },
    include: {
      subject: true,
      class: true,
      attendanceRecords: { include: { student: { select: { id: true, name: true } } } },
    },
    orderBy: [{ date: "desc" }, { startTime: "asc" }],
  });

  return NextResponse.json(lessons);
}
