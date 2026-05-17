import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { NewPaymentButton } from "@/components/billing/new-payment-button";

const METHOD_LABEL: Record<string, string> = {
  CASH: "Numerário",
  BANK_TRANSFER: "Transferência",
  MULTIBANCO: "Multibanco",
  MBWAY: "MB WAY",
  CARD: "Cartão",
  CHECK: "Cheque",
  OTHER: "Outro",
};

export default async function InvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) redirect("/dashboard");
  const { id } = await params;

  const inv = await prisma.invoice.findUnique({
    where: { id },
    include: {
      student: { select: { name: true, email: true } },
      payments: { include: { recordedBy: { select: { name: true } } }, orderBy: { paidAt: "desc" } },
      school: { select: { billingCurrency: true, billingVatId: true, billingAddress: true, name: true, featureBilling: true } },
    },
  });
  if (!inv || inv.schoolId !== session.user.schoolId || !inv.school.featureBilling) notFound();

  const fmt = (n: number) =>
    new Intl.NumberFormat("pt-PT", { style: "currency", currency: inv.school.billingCurrency }).format(n);
  const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
  const remaining = Number(inv.total) - paid;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/admin/billing"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-green)] mb-0.5">
            Faturação · {inv.school.name}
          </div>
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.022em] font-mono">{inv.number}</h1>
          <p className="text-[12px] text-[var(--muted-foreground)]">{inv.description}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-2 gap-3 text-[13px]">
          <div>
            <p className="text-[11px] uppercase tracking-[0.04em] text-[var(--muted-foreground)]">Aluno</p>
            <p className="font-medium">{inv.student.name}</p>
            <p className="text-[11px] text-[var(--muted-foreground)]">{inv.student.email}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.04em] text-[var(--muted-foreground)]">Estado</p>
            <Badge variant="outline">{inv.status}</Badge>
            {inv.paidAt && (
              <p className="text-[11px] text-[var(--tint-green)] mt-1">
                Pago em {format(inv.paidAt, "d 'de' MMM yyyy", { locale: pt })}
              </p>
            )}
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.04em] text-[var(--muted-foreground)]">Emissão</p>
            <p className="tabular-nums">{format(inv.issueDate, "d 'de' MMMM yyyy", { locale: pt })}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.04em] text-[var(--muted-foreground)]">Vencimento</p>
            <p className="tabular-nums">{format(inv.dueDate, "d 'de' MMMM yyyy", { locale: pt })}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-2 text-[13px]">
          <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">{fmt(Number(inv.amount))}</span></div>
          <div className="flex justify-between">
            <span>IVA ({Number(inv.vatRate)}%)</span>
            <span className="tabular-nums">{fmt(Number(inv.vatAmount))}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-[var(--separator)] font-semibold text-[16px]">
            <span>Total</span><span className="tabular-nums">{fmt(Number(inv.total))}</span>
          </div>
          {paid > 0 && (
            <>
              <div className="flex justify-between text-[var(--tint-green)]">
                <span>Pago</span><span className="tabular-nums">{fmt(paid)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Falta receber</span>
                <span className="tabular-nums" style={{ color: remaining > 0 ? "var(--tint-orange)" : "var(--tint-green)" }}>
                  {fmt(Math.max(0, remaining))}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div>
        {inv.status !== "PAID" && inv.status !== "CANCELLED" && (
          <NewPaymentButton invoiceId={inv.id} remaining={remaining} currency={inv.school.billingCurrency} />
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Pagamentos</CardTitle></CardHeader>
        <CardContent className="p-0">
          {inv.payments.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-[var(--muted-foreground)]">Sem pagamentos registados.</p>
          ) : (
            <ul className="divide-y divide-[var(--separator)]">
              {inv.payments.map((p) => (
                <li key={p.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-medium tabular-nums">{fmt(Number(p.amount))}</p>
                    <p className="text-[11px] text-[var(--muted-foreground)]">
                      {METHOD_LABEL[p.method] ?? p.method}
                      {p.reference && ` · ${p.reference}`}
                      {p.recordedBy && ` · registado por ${p.recordedBy.name}`}
                    </p>
                  </div>
                  <span className="text-[11px] tabular-nums text-[var(--muted-foreground)]">
                    {format(p.paidAt, "d MMM yyyy", { locale: pt })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
