import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, FormationComponent } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().nullable().optional(),
  component: z.enum(["SOCIOCULTURAL", "SCIENTIFIC", "TECHNICAL", "FCT", "PAP"]).optional(),
  totalHours: z.number().int().positive().optional(),
  modules: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    number: z.number().int().min(1),
    hours: z.number().int().positive(),
    description: z.string().nullable().optional(),
  })).optional(),
});

async function ensureAccess(id: string, schoolId: string) {
  const subject = await prisma.subject.findUnique({
    where: { id },
    include: { course: { select: { schoolId: true } } },
  });
  if (!subject) return { error: NextResponse.json({ error: "Não encontrado" }, { status: 404 }) };
  if (subject.course.schoolId !== schoolId) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { subject };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const check = await ensureAccess(id, session.user.schoolId);
  if ("error" in check) return check.error;

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const { modules, ...rest } = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.subject.update({
      where: { id },
      data: {
        ...(rest.name !== undefined ? { name: rest.name } : {}),
        ...(rest.code !== undefined ? { code: rest.code ?? null } : {}),
        ...(rest.component !== undefined ? { component: rest.component as FormationComponent } : {}),
        ...(rest.totalHours !== undefined ? { totalHours: rest.totalHours } : {}),
      },
    });

    if (modules) {
      const existing = await tx.module.findMany({ where: { subjectId: id }, select: { id: true } });
      const existingIds = new Set(existing.map((m) => m.id));
      const incomingIds = new Set(modules.filter((m) => m.id).map((m) => m.id!));

      const toDelete = [...existingIds].filter((eid) => !incomingIds.has(eid));
      if (toDelete.length) {
        await tx.module.deleteMany({ where: { id: { in: toDelete } } });
      }

      for (let i = 0; i < modules.length; i++) {
        const m = modules[i];
        if (m.id && existingIds.has(m.id)) {
          await tx.module.update({
            where: { id: m.id },
            data: {
              name: m.name,
              number: m.number,
              hours: m.hours,
              description: m.description ?? null,
              order: i + 1,
            },
          });
        } else {
          await tx.module.create({
            data: {
              subjectId: id,
              name: m.name,
              number: m.number,
              hours: m.hours,
              description: m.description ?? null,
              order: i + 1,
            },
          });
        }
      }
    }
  });

  await logAudit({
    schoolId: session.user.schoolId,
    userId: session.user.id,
    action: "subject.update",
    entity: "Subject",
    entityId: id,
    meta: { fields: Object.keys(rest) },
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
  const check = await ensureAccess(id, session.user.schoolId);
  if ("error" in check) return check.error;

  try {
    await prisma.subject.delete({ where: { id } });
  } catch {
    return NextResponse.json(
      { error: "Não é possível apagar: a disciplina tem dependências (turmas, aulas ou avaliações)." },
      { status: 409 },
    );
  }

  await logAudit({
    schoolId: session.user.schoolId,
    userId: session.user.id,
    action: "subject.delete",
    entity: "Subject",
    entityId: id,
  });

  return NextResponse.json({ ok: true });
}
