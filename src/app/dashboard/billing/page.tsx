import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Receipt } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Paga",
  OVERDUE: "Em atraso",
  CANCELLED: "Cancelada",
};
const STATUS_TINT: Record<string, string> = {
  PENDING: "var(--tint-orange)",
  PAID: "var(--tint-green)",
  OVERDUE: "var(--destructive)",
  CANCELLED: "var(--muted-foreground)",
};

export default async function StudentBillingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const school = await prisma.school.findUnique({
    where: { id: session.user.schoolId },
    select: { featureBilling: true, billingCurrency: true, name: true },
  });
  if (!school?.featureBilling) notFound();

  const invoices = await prisma.invoice.findMany({
    where: { studentId: session.user.id },
    include: { payments: true },
    orderBy: { issueDate: "desc" },
  });

  const fmt = (n: number) =>
    new Intl.NumberFormat("pt-PT", { style: "currency", currency: school.billingCurrency }).format(n);

  const totalPending = invoices
    .filter((i) => i.status === "PENDING" || i.status === "OVERDUE")
    .reduce((s, i) => s + Number(i.total) - i.payments.reduce((p, x) => p + Number(x.amount), 0), 0);

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-green)] mb-1">
          Finanças
        </div>
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.022em]">As minhas faturas</h1>
        {totalPending > 0 && (
          <p className="text-[13px] text-[var(--destructive)] mt-1">
            Tens <strong>{fmt(totalPending)}</strong> por pagar. Contacta a secretaria da {school.name}.
          </p>
        )}
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-[13px] text-[var(--muted-foreground)]">
            <Receipt className="h-10 w-10 mx-auto mb-2 opacity-30" />
            Sem faturas emitidas.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-[var(--separator)]">
              {invoices.map((inv) => {
                const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
                const remaining = Number(inv.total) - paid;
                return (
                  <li key={inv.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium">{inv.description}</p>
                      <p className="text-[11px] text-[var(--muted-foreground)]">
                        <span className="font-mono">{inv.number}</span> · vencimento {format(inv.dueDate, "d MMM yyyy", { locale: pt })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[14px] font-semibold tabular-nums">{fmt(Number(inv.total))}</p>
                      {remaining > 0 && remaining < Number(inv.total) && (
                        <p className="text-[10px] text-[var(--muted-foreground)] tabular-nums">Falta {fmt(remaining)}</p>
                      )}
                    </div>
                    <Badge variant="outline" style={{ color: STATUS_TINT[inv.status] }}>
                      {STATUS_LABEL[inv.status]}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
