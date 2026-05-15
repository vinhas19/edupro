import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  guardianId: z.string(),
  studentId: z.string(),
  kind: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const [guardian, student] = await Promise.all([
    prisma.user.findUnique({ where: { id: parsed.data.guardianId } }),
    prisma.user.findUnique({ where: { id: parsed.data.studentId } }),
  ]);
  if (!guardian || !student) return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });
  if (guardian.schoolId !== session.user.schoolId || student.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (guardian.role !== Role.GUARDIAN) {
    return NextResponse.json({ error: "O utilizador escolhido como EE não tem o perfil 'Encarregado'." }, { status: 400 });
  }
  if (student.role !== Role.STUDENT) {
    return NextResponse.json({ error: "O educando escolhido não é um aluno." }, { status: 400 });
  }

  const link = await prisma.guardianLink.upsert({
    where: { guardianId_studentId: { guardianId: guardian.id, studentId: student.id } },
    create: { guardianId: guardian.id, studentId: student.id, kind: parsed.data.kind ?? null },
    update: { kind: parsed.data.kind ?? null },
  });

  await logAudit({
    schoolId: session.user.schoolId,
    userId: session.user.id,
    action: "guardian_link.create",
    entity: "GuardianLink",
    entityId: link.id,
  });

  return NextResponse.json({ id: link.id }, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  if (typeof body.id !== "string") return NextResponse.json({ error: "id missing" }, { status: 400 });

  const link = await prisma.guardianLink.findUnique({
    where: { id: body.id },
    include: { student: { select: { schoolId: true } } },
  });
  if (!link || link.student.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await prisma.guardianLink.delete({ where: { id: body.id } });

  await logAudit({
    schoolId: session.user.schoolId,
    userId: session.user.id,
    action: "guardian_link.delete",
    entity: "GuardianLink",
    entityId: body.id,
  });

  return NextResponse.json({ ok: true });
}
