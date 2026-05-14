import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, SubstitutionStatus } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  substituteId: z.string().nullable().optional(),
  status: z.enum(["PENDING", "ASSIGNED", "CONFIRMED", "CANCELLED"]).optional(),
  notes: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.CLASS_DIRECTOR)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const sub = await prisma.substitution.findUnique({
    where: { id },
    include: { absence: { include: { teacher: true } } },
  });
  if (!sub || sub.absence.teacher.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.substitution.update({
    where: { id },
    data: {
      ...(parsed.data.substituteId !== undefined
        ? {
            substituteId: parsed.data.substituteId,
            status: parsed.data.substituteId
              ? SubstitutionStatus.ASSIGNED
              : SubstitutionStatus.PENDING,
          }
        : {}),
      ...(parsed.data.status ? { status: parsed.data.status as SubstitutionStatus } : {}),
      ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
