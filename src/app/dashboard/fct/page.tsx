import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole, FCT_STATUS_LABELS } from "@/lib/permissions";
import Link from "next/link";
import { Plus, Briefcase, Clock, CheckCircle, AlertCircle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const STATUS_COLORS = {
  PLANNED: "bg-blue-100 text-blue-700",
  ONGOING: "bg-green-100 text-green-700",
  COMPLETED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
} as const;

export default async function FctPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: userId, role, schoolId } = session.user;

  // ─── Student View ────────────────────────────────────────────────────────
  if (!hasRole(role, Role.TEACHER)) {
    const fctRecord = await prisma.fctRecord.findFirst({
      where: { studentId: userId },
      include: { documents: true, reports: true },
      orderBy: { createdAt: "desc" },
    });

    if (!fctRecord) {
      return (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">FCT — Formação em Contexto de Trabalho</h1>
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-medium">Sem FCT atribuída</p>
              <p className="text-sm text-muted-foreground">A sua FCT ainda não foi registada.</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    const pct = Math.min(100, Math.round((fctRecord.completedHours / fctRecord.requiredHours) * 100));

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">A Minha FCT</h1>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-blue-500" />
                <div>
                  <CardTitle className="text-base">{fctRecord.companyName}</CardTitle>
                  {fctRecord.supervisorName && (
                    <p className="text-xs text-muted-foreground">Supervisor: {fctRecord.supervisorName}</p>
                  )}
                </div>
              </div>
              <Badge className={STATUS_COLORS[fctRecord.status]}>
                {FCT_STATUS_LABELS[fctRecord.status]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="rounded-lg border p-3">
                <p className="text-xl font-bold text-blue-600">{fctRecord.completedHours}</p>
                <p className="text-xs text-muted-foreground">Horas Realizadas</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xl font-bold">{fctRecord.requiredHours}</p>
                <p className="text-xs text-muted-foreground">Horas Obrigatórias</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xl font-bold text-green-600">{pct}%</p>
                <p className="text-xs text-muted-foreground">Concluído</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xl font-bold">{fctRecord.grade ?? "—"}</p>
                <p className="text-xs text-muted-foreground">Nota Final</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progresso</span>
                <span>{fctRecord.completedHours}h / {fctRecord.requiredHours}h</span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Início</p>
                <p className="font-medium">{format(new Date(fctRecord.startDate), "d MMM yyyy", { locale: pt })}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Fim</p>
                <p className="font-medium">{format(new Date(fctRecord.endDate), "d MMM yyyy", { locale: pt })}</p>
              </div>
            </div>

            {fctRecord.notes && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="text-xs font-medium text-muted-foreground mb-1">Observações</p>
                <p>{fctRecord.notes}</p>
              </div>
            )}

            {/* Documents */}
            {fctRecord.documents.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Documentos</p>
                <div className="space-y-1">
                  {fctRecord.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.fileUrl}
                      target="_blank"
                      className="flex items-center gap-2 rounded border px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                      {doc.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Staff View ───────────────────────────────────────────────────────────
  const fctRecords = await prisma.fctRecord.findMany({
    where: {
      class: { course: { schoolId } },
      ...(role === Role.CLASS_DIRECTOR ? { class: { classDirectorId: userId } } : {}),
    },
    include: {
      student: { select: { id: true, name: true } },
      class: { select: { name: true } },
      documents: { select: { id: true } },
    },
    orderBy: [{ status: "asc" }, { startDate: "desc" }],
  });

  const ongoing = fctRecords.filter((r) => r.status === "ONGOING").length;
  const completed = fctRecords.filter((r) => r.status === "COMPLETED").length;
  const planned = fctRecords.filter((r) => r.status === "PLANNED").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">FCT — Formação em Contexto de Trabalho</h1>
          <p className="text-muted-foreground">{fctRecords.length} registos</p>
        </div>
        {hasRole(role, Role.CLASS_DIRECTOR) && (
          <Button asChild>
            <Link href="/dashboard/fct/new">
              <Plus className="mr-2 h-4 w-4" />Registar FCT
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Clock className="h-6 w-6 text-green-500" />
            <div><p className="text-xl font-bold">{ongoing}</p><p className="text-xs text-muted-foreground">Em Curso</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <CheckCircle className="h-6 w-6 text-blue-500" />
            <div><p className="text-xl font-bold">{completed}</p><p className="text-xs text-muted-foreground">Concluídas</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-6 w-6 text-orange-500" />
            <div><p className="text-xl font-bold">{planned}</p><p className="text-xs text-muted-foreground">Planeadas</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        {fctRecords.map((record) => {
          const pct = Math.min(100, Math.round((record.completedHours / record.requiredHours) * 100));
          return (
            <Link key={record.id} href={`/dashboard/fct/${record.id}`}>
              <Card className="cursor-pointer hover:shadow-sm transition-shadow">
                <CardContent className="flex items-center gap-4 py-3">
                  <Building2 className="h-8 w-8 text-blue-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{record.student.name}</p>
                      <Badge variant="secondary" className="text-xs">{record.class.name}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{record.companyName}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Progress value={pct} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {record.completedHours}/{record.requiredHours}h
                      </span>
                    </div>
                  </div>
                  <Badge className={STATUS_COLORS[record.status]}>
                    {FCT_STATUS_LABELS[record.status]}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
