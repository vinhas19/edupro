import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  code: z.string().min(1),
  formationArea: z.string().min(1),
  level: z.number().int().min(1).max(5).default(4),
  totalHours: z.number().int().positive(),
  description: z.string().optional(),
  directorId: z.string().optional(),
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

  const existing = await prisma.course.findUnique({
    where: { code_schoolId: { code: parsed.data.code, schoolId: session.user.schoolId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Já existe um curso com este código" }, { status: 409 });
  }

  const course = await prisma.course.create({
    data: {
      ...parsed.data,
      schoolId: session.user.schoolId,
    },
  });

  return NextResponse.json({ id: course.id }, { status: 201 });
}
