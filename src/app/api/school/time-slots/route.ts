import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { z } from "zod";

const timeRegex = /^\d{2}:\d{2}$/;

const slotSchema = z.object({
  id: z.string().optional(),
  startTime: z.string().regex(timeRegex),
  endTime: z.string().regex(timeRegex),
  label: z.string().nullable().optional(),
});

const bodySchema = z.object({
  slots: z.array(slotSchema),
});

function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  // Validate each slot
  for (const s of parsed.data.slots) {
    if (toMin(s.startTime) >= toMin(s.endTime)) {
      return NextResponse.json(
        { error: `Bloco ${s.startTime}–${s.endTime} inválido: a hora de entrada tem de ser anterior à de saída.` },
        { status: 400 },
      );
    }
  }

  // Sort by startTime so order is consistent
  const sorted = [...parsed.data.slots].sort((a, b) => toMin(a.startTime) - toMin(b.startTime));

  const schoolId = session.user.schoolId;

  await prisma.$transaction(async (tx) => {
    // Two-step to avoid order unique conflicts: move existing to negative order first
    await tx.timeSlot.updateMany({
      where: { schoolId },
      data: { order: -1 },
    });
    await tx.timeSlot.deleteMany({ where: { schoolId } });

    if (sorted.length) {
      await tx.timeSlot.createMany({
        data: sorted.map((s, i) => ({
          schoolId,
          order: i + 1,
          startTime: s.startTime,
          endTime: s.endTime,
          label: s.label?.trim() || null,
        })),
      });
    }
  });

  return NextResponse.json({ ok: true });
}
