import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role, InvoiceStatus } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { StatCard } from "@/components/ui/stat-card";
import { Receipt, Wallet, Clock, AlertTriangle } from "lucide-react";
import { NewInvoiceButton } from "@/components/billing/new-invoice-button";

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

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) redirect("/dashboard");

  const school = await prisma.school.findUnique({
    where: { id: session.user.schoolId },
    select: { featureBilling: true, billingCurrency: true },
  });
  if (!school?.featureBilling) notFound();

  const sp = await searchParams;
  const status = sp.status?.toUpperCase();

  // Mark OVERDUE invoices on read
  await prisma.invoice.updateMany({
    where: {
      schoolId: session.user.schoolId,
      status: "PENDING",
      dueDate: { lt: new Date() },
    },
    data: { status: "OVERDUE" },
  });

  const [invoices, classes, totals] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        schoolId: session.user.schoolId,
        ...(status && status in STATUS_LABEL
          ? { status: status as InvoiceStatus }
          : {}),
      },
      include: { student: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.class.findMany({
      where: {
        course: { schoolId: session.user.schoolId },
        academicYear: { active: true },
      },
      select: { id: true, name: true, course: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.invoice.groupBy({
      by: ["status"],
      where: { schoolId: session.user.schoolId },
      _sum: { total: true },
      _count: { _all: true },
    }),
  ]);

  const sumByStatus = Object.fromEntries(
    totals.map((t) => [t.status, { count: t._count._all, sum: Number(t._sum.total ?? 0) }]),
  );
  const fmt = (n: number) =>
    new Intl.NumberFormat("pt-PT", { style: "currency", currency: school.billingCurrency }).format(n);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-green)] mb-1">
            Administração
          </div>
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.022em]">Faturação</h1>
          <p className="text-[13px] text-[var(--muted-foreground)]">
            Propinas e outros pagamentos dos alunos.
          </p>
        </div>
        <NewInvoiceButton classes={classes} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="Pago"
          value={fmt(sumByStatus.PAID?.sum ?? 0)}
          icon={Wallet}
          tint="var(--tint-green)"
          description={`${sumByStatus.PAID?.count ?? 0} faturas`}
        />
        <StatCard
          title="Pendente"
          value={fmt(sumByStatus.PENDING?.sum ?? 0)}
          icon={Clock}
          tint="var(--tint-orange)"
          description={`${sumByStatus.PENDING?.count ?? 0} faturas`}
        />
        <StatCard
          title="Em atraso"
          value={fmt(sumByStatus.OVERDUE?.sum ?? 0)}
          icon={AlertTriangle}
          tint="var(--destructive)"
          description={`${sumByStatus.OVERDUE?.count ?? 0} faturas`}
        />
        <StatCard
          title="Total emitido"
          value={fmt((sumByStatus.PAID?.sum ?? 0) + (sumByStatus.PENDING?.sum ?? 0) + (sumByStatus.OVERDUE?.sum ?? 0))}
          icon={Receipt}
          tint="var(--tint-blue)"
        />
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {(["PENDING", "OVERDUE", "PAID", "CANCELLED"] as const).map((s) => {
          const isActive = (status ?? "PENDING") === s;
          return (
            <Link
              key={s}
              href={s === "PENDING" ? "/dashboard/admin/billing" : `/dashboard/admin/billing?status=${s.toLowerCase()}`}
              className={
                "rounded-[6px] px-3 py-1.5 text-[12px] font-medium transition-colors " +
                (isActive ? "bg-[var(--primary)] text-white" : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--secondary)]")
              }
            >
              {STATUS_LABEL[s]}
              {sumByStatus[s]?.count > 0 && <span className="ml-1.5 opacity-70 tabular-nums">{sumByStatus[s].count}</span>}
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Faturas recentes</CardTitle></CardHeader>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[var(--muted-foreground)]">Sem faturas.</p>
          ) : (
            <ul className="divide-y divide-[var(--separator)]">
              {invoices.map((inv) => (
                <li key={inv.id}>
                  <Link
                    href={`/dashboard/admin/billing/${inv.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--muted)]/40"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate">{inv.student.name}</p>
                      <p className="text-[11px] text-[var(--muted-foreground)] truncate">
                        <span className="font-mono">{inv.number}</span> · {inv.description}
                      </p>
                    </div>
                    <span className="text-[13px] tabular-nums font-semibold">{fmt(Number(inv.total))}</span>
                    <span className="text-[11px] tabular-nums text-[var(--muted-foreground)] w-20 text-right">
                      {format(inv.dueDate, "d MMM", { locale: pt })}
                    </span>
                    <Badge variant="outline" style={{ color: STATUS_TINT[inv.status] }}>
                      {STATUS_LABEL[inv.status]}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
