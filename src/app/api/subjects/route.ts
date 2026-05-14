import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, FormationComponent } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  courseId: z.string(),
  name: z.string().min(2),
  code: z.string().optional(),
  component: z.enum(["SOCIOCULTURAL", "SCIENTIFIC", "TECHNICAL", "FCT", "PAP"]),
  totalHours: z.number().int().positive(),
  modules: z.array(z.object({
    name: z.string().min(1),
    number: z.number().int().min(1),
    hours: z.number().int().positive(),
    description: z.string().optional(),
  })).optional(),
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

  // Find next order
  const maxOrder = await prisma.subject.findFirst({
    where: { courseId: parsed.data.courseId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const subject = await prisma.subject.create({
    data: {
      courseId: parsed.data.courseId,
      name: parsed.data.name,
      code: parsed.data.code,
      component: parsed.data.component as FormationComponent,
      totalHours: parsed.data.totalHours,
      order: (maxOrder?.order ?? 0) + 1,
      ...(parsed.data.modules?.length
        ? {
            modules: {
              create: parsed.data.modules.map((m, i) => ({
                name: m.name,
                number: m.number,
                hours: m.hours,
                description: m.description,
                order: i + 1,
              })),
            },
          }
        : {}),
    },
  });

  return NextResponse.json({ id: subject.id }, { status: 201 });
}
