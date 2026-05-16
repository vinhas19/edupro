import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole, PAP_STATUS_LABELS } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Award, User } from "lucide-react";
import Link from "next/link";
import { PhaseRow } from "@/components/pap/phase-row";
import { PapStatusForm } from "@/components/pap/pap-status-form";
import { AdvisorPicker } from "@/components/pap/advisor-picker";

const STATUS_COLORS = {
  PROPOSAL: "bg-blue-100 text-blue-700",
  DEVELOPMENT: "bg-indigo-100 text-indigo-700",
  SUBMITTED: "bg-purple-100 text-purple-700",
  PRESENTATION: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
} as const;

export default async function PapDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const pap = await prisma.papRecord.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, name: true, email: true } },
      class: { include: { course: { select: { name: true, code: true, schoolId: true } } } },
      advisor: { select: { id: true, name: true } },
      phases: { orderBy: { phase: "asc" } },
      jury: { include: { user: { select: { name: true } } } },
      evaluations: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!pap || pap.class.course.schoolId !== session.user.schoolId) notFound();

  const isStudent = pap.studentId === session.user.id;
  const isAdvisor = pap.advisorId === session.user.id;
  const canEdit = hasRole(session.user.role, Role.CLASS_DIRECTOR);
  if (!isStudent && !isAdvisor && !canEdit) redirect("/dashboard/pap");

  // Lista de professores disponíveis para orientador (DT é também professor)
  const teachers = canEdit
    ? await prisma.user.findMany({
        where: {
          schoolId: session.user.schoolId,
          active: true,
          role: { in: [Role.TEACHER, Role.CLASS_DIRECTOR, Role.COURSE_DIRECTOR] },
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  const totalWeight = pap.evaluations.reduce((s, e) => s + e.weight, 0);
  const weighted = totalWeight > 0
    ? pap.evaluations.reduce((s, e) => s + e.grade * e.weight, 0) / totalWeight
    : null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/pap"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">PAP — {pap.student.name}</h1>
            <Badge className={STATUS_COLORS[pap.status]}>{PAP_STATUS_LABELS[pap.status]}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {pap.class.name} · {pap.class.course.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4 text-purple-500" />
            {pap.title ?? "Tema por definir"}
          </CardTitle>
          <div className="pt-1">
            <AdvisorPicker
              papId={pap.id}
              currentAdvisorId={pap.advisorId}
              currentAdvisorName={pap.advisor?.name ?? null}
              teachers={teachers}
              canEdit={canEdit}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {pap.description && (
            <div className="rounded-lg bg-muted/40 p-3 text-sm">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Descrição</p>
              <p className="whitespace-pre-wrap">{pap.description}</p>
            </div>
          )}
          {pap.finalGrade != null && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
              <p className="text-xs text-muted-foreground">Nota Final</p>
              <p className="text-3xl font-bold text-green-700">{pap.finalGrade}/20</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Fases</CardTitle>
            {pap.phases.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--muted-foreground)]">Total</span>
                <span className="text-[13px] font-semibold tabular-nums">
                  {Math.round(pap.phases.reduce((s, p) => s + p.progress, 0) / pap.phases.length)}%
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {pap.phases.map((p) => (
            <PhaseRow
              key={p.id}
              id={p.id}
              phase={p.phase}
              dueDate={p.dueDate}
              submittedAt={p.submittedAt}
              status={p.status}
              progress={p.progress}
              canEdit={canEdit || isAdvisor}
            />
          ))}
        </CardContent>
      </Card>

      {pap.jury.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Júri</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {pap.jury.map((j) => (
                <Badge key={j.id} variant="outline">
                  {j.user.name} · {j.role}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {pap.evaluations.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Avaliação por Componentes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {pap.evaluations.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                  <div>
                    <span className="font-medium">{e.component}</span>
                    <span className="text-xs text-muted-foreground ml-2">peso {e.weight}</span>
                  </div>
                  <span className="font-mono font-semibold">{e.grade.toFixed(1)}/20</span>
                </div>
              ))}
              {weighted != null && (
                <div className="flex items-center justify-between text-base font-bold pt-3 border-t-2">
                  <span>Média Ponderada</span>
                  <span className="font-mono">{weighted.toFixed(1)}/20</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {canEdit && (
        <PapStatusForm id={pap.id} status={pap.status} finalGrade={pap.finalGrade} />
      )}
    </div>
  );
}
