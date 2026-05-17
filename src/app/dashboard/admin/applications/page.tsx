import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role, ApplicationStatus } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  UNDER_REVIEW: "Em análise",
  ACCEPTED: "Aceite",
  REJECTED: "Rejeitada",
  WAITLISTED: "Lista de espera",
  WITHDRAWN: "Retirada",
};

const STATUS_TINT: Record<string, string> = {
  PENDING: "var(--tint-orange)",
  UNDER_REVIEW: "var(--tint-blue)",
  ACCEPTED: "var(--tint-green)",
  REJECTED: "var(--destructive)",
  WAITLISTED: "var(--tint-yellow)",
  WITHDRAWN: "var(--muted-foreground)",
};

export default async function ApplicationsListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) redirect("/dashboard");

  const school = await prisma.school.findUnique({
    where: { id: session.user.schoolId },
    select: { featureEnrollment: true, slug: true },
  });
  if (!school?.featureEnrollment) notFound();

  const sp = await searchParams;
  const status = sp.status?.toUpperCase();

  const applications = await prisma.application.findMany({
    where: {
      schoolId: session.user.schoolId,
      ...(status && status in STATUS_LABEL
        ? { status: status as ApplicationStatus }
        : {}),
    },
    include: {
      course: { select: { name: true, code: true } },
      academicYear: { select: { label: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const counts = await prisma.application.groupBy({
    by: ["status"],
    where: { schoolId: session.user.schoolId },
    _count: { _all: true },
  });
  const countByStatus = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/inscricao/${school.slug}`;

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-orange)] mb-1">
          Administração
        </div>
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.022em]">Candidaturas</h1>
        <p className="text-[13px] text-[var(--muted-foreground)]">
          Link público para partilhar: <Link href={`/inscricao/${school.slug}`} target="_blank" className="text-[var(--primary)] hover:underline font-mono">{publicUrl}</Link>
        </p>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {(["PENDING", "UNDER_REVIEW", "ACCEPTED", "REJECTED", "WAITLISTED"] as const).map((s) => {
          const isActive = (status ?? "PENDING") === s;
          return (
            <Link
              key={s}
              href={s === "PENDING" ? "/dashboard/admin/applications" : `/dashboard/admin/applications?status=${s.toLowerCase()}`}
              className={
                "rounded-[6px] px-3 py-1.5 text-[12px] font-medium transition-colors " +
                (isActive ? "bg-[var(--primary)] text-white" : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--secondary)]")
              }
            >
              {STATUS_LABEL[s]}
              {countByStatus[s] > 0 && <span className="ml-1.5 opacity-70 tabular-nums">{countByStatus[s]}</span>}
            </Link>
          );
        })}
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-[13px] text-[var(--muted-foreground)]">
            Sem candidaturas.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {applications.map((a) => (
            <li key={a.id}>
              <Link
                href={`/dashboard/admin/applications/${a.id}`}
                className="flex items-center gap-3 rounded-[12px] bg-[var(--card)] p-3.5 shadow-[var(--card-shadow)] hover:bg-[var(--muted)]/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold truncate">{a.fullName}</p>
                  <p className="text-[11px] text-[var(--muted-foreground)] truncate">
                    {a.email}
                    {a.course && ` · ${a.course.name}`}
                    {a.academicYear && ` · ${a.academicYear.label}`}
                  </p>
                </div>
                <Badge variant="outline" style={{ color: STATUS_TINT[a.status] }}>
                  {STATUS_LABEL[a.status]}
                </Badge>
                <span className="text-[11px] tabular-nums text-[var(--muted-foreground)] shrink-0">
                  {format(a.createdAt, "d MMM", { locale: pt })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
