import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  courseId: z.string(),
  academicYearId: z.string(),
  year: z.number().int().min(1).max(5),
  classDirectorId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const course = await prisma.course.findUnique({ where: { id: parsed.data.courseId } });
  if (!course || course.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Curso inválido" }, { status: 400 });
  }

  const cls = await prisma.class.create({
    data: parsed.data,
  });

  return NextResponse.json({ id: cls.id }, { status: 201 });
}
