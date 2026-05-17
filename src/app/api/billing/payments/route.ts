import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, InvoiceStatus, PaymentMethod } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  invoiceId: z.string(),
  amount: z.number().positive(),
  method: z.enum(["CASH", "BANK_TRANSFER", "MULTIBANCO", "MBWAY", "CARD", "CHECK", "OTHER"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const inv = await prisma.invoice.findUnique({
    where: { id: parsed.data.invoiceId },
    include: { payments: true },
  });
  if (!inv || inv.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Fatura inválida." }, { status: 404 });
  }
  if (inv.status === "CANCELLED") {
    return NextResponse.json({ error: "Fatura cancelada." }, { status: 409 });
  }

  await prisma.payment.create({
    data: {
      invoiceId: inv.id,
      amount: parsed.data.amount,
      method: parsed.data.method as PaymentMethod,
      reference: parsed.data.reference,
      notes: parsed.data.notes,
      recordedById: session.user.id,
    },
  });

  // Verifica se ficou totalmente pago
  const totalPaid =
    inv.payments.reduce((s, p) => s + Number(p.amount), 0) + parsed.data.amount;
  const invTotal = Number(inv.total);
  if (totalPaid + 0.01 >= invTotal) {
    await prisma.invoice.update({
      where: { id: inv.id },
      data: { status: InvoiceStatus.PAID, paidAt: new Date() },
    });
  }

  await logAudit({
    schoolId: session.user.schoolId,
    userId: session.user.id,
    action: "payment.create",
    entity: "Invoice",
    entityId: inv.id,
    meta: { amount: parsed.data.amount, method: parsed.data.method },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
