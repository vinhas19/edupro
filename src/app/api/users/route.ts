import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum([
    "SCHOOL_ADMIN",
    "COURSE_DIRECTOR",
    "CLASS_DIRECTOR",
    "TEACHER",
    "STUDENT",
    "GUARDIAN",
  ]),
  password: z.string().min(8),
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

  const { name, email, role, password } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email_schoolId: { email, schoolId: session.user.schoolId } },
  });
  if (existing) {
    return NextResponse.json({ error: "Já existe um utilizador com este email" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      role: role as Role,
      passwordHash,
      schoolId: session.user.schoolId,
    },
  });

  return NextResponse.json({ id: user.id }, { status: 201 });
}
