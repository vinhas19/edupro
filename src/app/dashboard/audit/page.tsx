import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  "subject.update":         { label: "Disciplina alterada",         color: "var(--tint-blue)" },
  "subject.delete":         { label: "Disciplina apagada",          color: "var(--destructive)" },
  "grade.update":           { label: "Nota alterada",               color: "var(--tint-orange)" },
  "user.create":            { label: "Utilizador criado",           color: "var(--tint-green)" },
  "user.delete":            { label: "Utilizador removido",         color: "var(--destructive)" },
  "justification.create":   { label: "Justificação submetida",      color: "var(--muted-foreground)" },
  "justification.approve":  { label: "Justificação aprovada",       color: "var(--tint-green)" },
  "justification.reject":   { label: "Justificação rejeitada",      color: "var(--destructive)" },
  "school.update":          { label: "Definições da escola",        color: "var(--tint-purple)" },
  "import.users":           { label: "Importação de utilizadores",  color: "var(--tint-teal)" },
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; entity?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) redirect("/dashboard");

  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  const PAGE_SIZE = 50;

  const where = {
    schoolId: session.user.schoolId,
    ...(sp.entity ? { entity: sp.entity } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-purple)] mb-1">
          Administração
        </div>
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.022em]">Auditoria</h1>
        <p className="text-[13px] text-[var(--muted-foreground)]">
          {total} registo{total !== 1 ? "s" : ""} — quem alterou o quê.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-[var(--muted-foreground)]">
              Sem registos.
            </div>
          ) : (
            <ul className="divide-y divide-[var(--separator)]">
              {logs.map((l) => {
                const meta = ACTION_LABELS[l.action] ?? { label: l.action, color: "var(--muted-foreground)" };
                return (
                  <li key={l.id} className="px-4 py-3 flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" style={{ color: meta.color }}>{meta.label}</Badge>
                        <span className="text-[12px] text-[var(--muted-foreground)] font-mono">{l.entity}</span>
                        {l.entityId && (
                          <span className="text-[10px] text-[var(--muted-foreground)] tabular-nums">#{l.entityId.slice(0, 8)}</span>
                        )}
                      </div>
                      <p className="text-[12px] text-[var(--muted-foreground)]">
                        {l.user ? `${l.user.name} (${l.user.email})` : "Sistema"}
                      </p>
                      {l.meta != null && (
                        <pre className="text-[11px] mt-1 bg-[var(--muted)] rounded p-1.5 max-w-md whitespace-pre-wrap">
                          {JSON.stringify(l.meta, null, 0)}
                        </pre>
                      )}
                    </div>
                    <span className="text-[11px] tabular-nums text-[var(--muted-foreground)]">
                      {format(l.createdAt, "dd MMM yyyy HH:mm:ss", { locale: pt })}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-[var(--muted-foreground)]">Página {page} de {Math.ceil(total / PAGE_SIZE)}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={`/dashboard/audit?page=${page - 1}`} className="rounded-[6px] px-3 py-1.5 bg-[var(--muted)] hover:bg-[var(--secondary)]">Anterior</a>
            )}
            {page < Math.ceil(total / PAGE_SIZE) && (
              <a href={`/dashboard/audit?page=${page + 1}`} className="rounded-[6px] px-3 py-1.5 bg-[var(--muted)] hover:bg-[var(--secondary)]">Seguinte</a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
