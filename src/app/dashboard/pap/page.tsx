import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole, PAP_STATUS_LABELS } from "@/lib/permissions";
import Link from "next/link";
import { Plus, Award, FileText, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const STATUS_COLORS = {
  PROPOSAL: "bg-blue-100 text-blue-700",
  DEVELOPMENT: "bg-indigo-100 text-indigo-700",
  SUBMITTED: "bg-purple-100 text-purple-700",
  PRESENTATION: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
} as const;

const PHASE_LABELS = {
  PROPOSAL: "Proposta",
  DEVELOPMENT: "Desenvolvimento",
  SUBMISSION: "Entrega",
  PRESENTATION: "Apresentação",
};

const PHASE_STATUS_COLORS = {
  PENDING: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  SUBMITTED: "bg-purple-100 text-purple-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default async function PapPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: userId, role, schoolId } = session.user;

  // ─── Student View ────────────────────────────────────────────────────────
  if (!hasRole(role, Role.TEACHER)) {
    const papRecord = await prisma.papRecord.findFirst({
      where: { studentId: userId },
      include: {
        advisor: { select: { name: true } },
        phases: { orderBy: { phase: "asc" } },
        jury: { include: { user: { select: { name: true } } } },
        evaluations: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!papRecord) {
      return (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">PAP — Prova de Aptidão Profissional</h1>
          <Card>
            <CardContent className="py-12 text-center">
              <Award className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-medium">PAP não atribuída</p>
              <p className="text-sm text-muted-foreground">A sua PAP ainda não foi registada.</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    const totalWeight = papRecord.evaluations.reduce((s, e) => s + e.weight, 0);
    const weightedGrade = totalWeight > 0
      ? papRecord.evaluations.reduce((s, e) => s + e.grade * e.weight, 0) / totalWeight
      : null;

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">A Minha PAP</h1>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{papRecord.title ?? "Tema por definir"}</CardTitle>
                {papRecord.advisor && (
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Orientador: {papRecord.advisor.name}
                  </p>
                )}
              </div>
              <Badge className={STATUS_COLORS[papRecord.status]}>
                {PAP_STATUS_LABELS[papRecord.status]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {papRecord.description && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="text-xs font-medium text-muted-foreground mb-1">Descrição</p>
                <p>{papRecord.description}</p>
              </div>
            )}

            {/* Phases */}
            <div>
              <p className="text-sm font-medium mb-3">Fases da PAP</p>
              <div className="space-y-2">
                {papRecord.phases.map((phase) => (
                  <div key={phase.id} className="flex items-center gap-3 rounded border p-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{PHASE_LABELS[phase.phase]}</p>
                      {phase.dueDate && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          Prazo: {format(new Date(phase.dueDate), "d MMM yyyy", { locale: pt })}
                        </p>
                      )}
                      {phase.submittedAt && (
                        <p className="text-xs text-green-600 mt-0.5">
                          Entregue: {format(new Date(phase.submittedAt), "d MMM yyyy", { locale: pt })}
                        </p>
                      )}
                    </div>
                    <Badge className={PHASE_STATUS_COLORS[phase.status]}>
                      {phase.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Jury */}
            {papRecord.jury.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Júri</p>
                <div className="flex flex-wrap gap-2">
                  {papRecord.jury.map((j) => (
                    <Badge key={j.id} variant="outline" className="text-xs">
                      {j.user.name} · {j.role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Evaluations */}
            {papRecord.evaluations.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Avaliação</p>
                <div className="space-y-1">
                  {papRecord.evaluations.map((e) => (
                    <div key={e.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                      <span>{e.component}</span>
                      <span className="font-mono font-semibold">{e.grade.toFixed(1)}/20</span>
                    </div>
                  ))}
                  {weightedGrade != null && (
                    <div className="flex items-center justify-between text-sm font-bold pt-2">
                      <span>Nota Final PAP</span>
                      <span className="font-mono text-lg">{Math.round(weightedGrade)}/20</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Staff View ───────────────────────────────────────────────────────────
  const papRecords = await prisma.papRecord.findMany({
    where: {
      class: { course: { schoolId } },
      ...(role === Role.TEACHER ? { advisorId: userId } : {}),
    },
    include: {
      student: { select: { id: true, name: true } },
      class: { select: { name: true } },
      advisor: { select: { name: true } },
      phases: true,
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">PAP — Prova de Aptidão Profissional</h1>
          <p className="text-muted-foreground">{papRecords.length} alunos</p>
        </div>
        {hasRole(role, Role.CLASS_DIRECTOR) && (
          <Button asChild>
            <Link href="/dashboard/pap/new">
              <Plus className="mr-2 h-4 w-4" />Registar PAP
            </Link>
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {papRecords.map((record) => (
          <Link key={record.id} href={`/dashboard/pap/${record.id}`}>
            <Card className="cursor-pointer hover:shadow-sm transition-shadow">
              <CardContent className="flex items-center gap-4 py-3">
                <Award className="h-8 w-8 text-purple-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{record.student.name}</p>
                    <Badge variant="secondary" className="text-xs">{record.class.name}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {record.title ?? "Tema por definir"}
                    {record.advisor && ` · Orientador: ${record.advisor.name}`}
                  </p>
                  <div className="flex gap-1 mt-1">
                    {record.phases.map((p) => (
                      <span
                        key={p.id}
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${PHASE_STATUS_COLORS[p.status]}`}
                      >
                        {PHASE_LABELS[p.phase]}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge className={STATUS_COLORS[record.status]}>
                    {PAP_STATUS_LABELS[record.status]}
                  </Badge>
                  {record.finalGrade != null && (
                    <span className="font-mono text-sm font-bold">{record.finalGrade}/20</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
