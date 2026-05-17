import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubstitutionStatus } from "@prisma/client";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

/**
 * Endpoint para o professor substituto ACEITAR ou RECUSAR uma substituição
 * que lhe foi atribuída. Não requer CLASS_DIRECTOR — basta que `substituteId`
 * coincida com o utilizador autenticado.
 */
const schema = z.object({
  decision: z.enum(["CONFIRM", "DECLINE"]),
  reason: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const sub = await prisma.substitution.findUnique({
    where: { id },
    include: {
      absence: { select: { teacher: { select: { schoolId: true, name: true } } } },
      class: { select: { name: true, course: { select: { name: true } } } },
      subject: { select: { name: true } },
    },
  });
  if (!sub || sub.absence.teacher.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }
  if (sub.substituteId !== session.user.id) {
    return NextResponse.json(
      { error: "Apenas o professor designado pode responder a esta substituição." },
      { status: 403 },
    );
  }
  if (sub.status === "CANCELLED") {
    return NextResponse.json({ error: "Substituição cancelada." }, { status: 409 });
  }
  if (sub.status === "CONFIRMED" && parsed.data.decision === "CONFIRM") {
    return NextResponse.json({ ok: true, alreadyConfirmed: true });
  }

  if (parsed.data.decision === "CONFIRM") {
    await prisma.substitution.update({
      where: { id },
      data: { status: SubstitutionStatus.CONFIRMED },
    });
  } else {
    // Decline → releases the slot back to PENDING and removes substitute
    await prisma.substitution.update({
      where: { id },
      data: {
        status: SubstitutionStatus.PENDING,
        substituteId: null,
        notes: parsed.data.reason
          ? `${sub.notes ? sub.notes + "\n" : ""}Recusado por ${session.user.name}: ${parsed.data.reason}`
          : sub.notes,
      },
    });
  }

  await logAudit({
    schoolId: session.user.schoolId,
    userId: session.user.id,
    action: parsed.data.decision === "CONFIRM" ? "substitution.confirm" : "substitution.decline",
    entity: "Substitution",
    entityId: id,
  });

  return NextResponse.json({ ok: true });
}
