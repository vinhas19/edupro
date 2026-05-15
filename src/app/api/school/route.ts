import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  dayStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  dayEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  blockMinutes: z.number().int().min(20).max(120).optional(),
  breakMinutes: z.number().int().min(0).max(60).optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  if (parsed.data.dayStart && parsed.data.dayEnd) {
    const [sh, sm] = parsed.data.dayStart.split(":").map(Number);
    const [eh, em] = parsed.data.dayEnd.split(":").map(Number);
    if (sh * 60 + sm >= eh * 60 + em) {
      return NextResponse.json({ error: "Hora de início tem de ser anterior à de fim" }, { status: 400 });
    }
  }

  await prisma.school.update({
    where: { id: session.user.schoolId },
    data: parsed.data,
  });

  await logAudit({
    schoolId: session.user.schoolId,
    userId: session.user.id,
    action: "school.update",
    entity: "School",
    entityId: session.user.schoolId,
    meta: { fields: Object.keys(parsed.data) },
  });

  return NextResponse.json({ ok: true });
}
