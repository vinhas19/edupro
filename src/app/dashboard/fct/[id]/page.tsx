import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole, FCT_STATUS_LABELS } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Building2, Calendar, Mail, Phone, User } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { FctProgressForm } from "@/components/fct/fct-progress-form";

const STATUS_COLORS = {
  PLANNED: "bg-blue-100 text-blue-700",
  ONGOING: "bg-green-100 text-green-700",
  COMPLETED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
} as const;

export default async function FctDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const fct = await prisma.fctRecord.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, name: true, email: true } },
      class: { include: { course: { select: { name: true, code: true, schoolId: true } } } },
      documents: true,
      reports: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!fct || fct.class.course.schoolId !== session.user.schoolId) notFound();

  const isStudent = fct.studentId === session.user.id;
  const canEdit = hasRole(session.user.role, Role.CLASS_DIRECTOR);
  if (!isStudent && !canEdit) redirect("/dashboard/fct");

  const pct = Math.min(100, Math.round((fct.completedHours / fct.requiredHours) * 100));

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/fct"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">FCT — {fct.student.name}</h1>
            <Badge className={STATUS_COLORS[fct.status]}>{FCT_STATUS_LABELS[fct.status]}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {fct.class.name} · {fct.class.course.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-500" />
            {fct.companyName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Horas Realizadas</p>
              <p className="text-2xl font-bold text-blue-600">{fct.completedHours}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Horas Obrigatórias</p>
              <p className="text-2xl font-bold">{fct.requiredHours}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Concluído</p>
              <p className="text-2xl font-bold text-green-600">{pct}%</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Nota Final</p>
              <p className="text-2xl font-bold">{fct.grade ?? "—"}</p>
            </div>
          </div>

          <Progress value={pct} className="h-2" />

          <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />Início</p>
              <p className="font-medium">{format(new Date(fct.startDate), "d 'de' MMMM yyyy", { locale: pt })}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />Fim</p>
              <p className="font-medium">{format(new Date(fct.endDate), "d 'de' MMMM yyyy", { locale: pt })}</p>
            </div>
          </div>

          {(fct.supervisorName || fct.supervisorEmail || fct.supervisorPhone) && (
            <div className="rounded-lg bg-muted/40 p-3 space-y-1.5">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Supervisor</p>
              {fct.supervisorName && (
                <p className="text-sm flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground" />{fct.supervisorName}</p>
              )}
              {fct.supervisorEmail && (
                <p className="text-sm flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{fct.supervisorEmail}</p>
              )}
              {fct.supervisorPhone && (
                <p className="text-sm flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{fct.supervisorPhone}</p>
              )}
            </div>
          )}

          {fct.notes && (
            <div className="rounded-lg bg-muted/40 p-3 text-sm">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Observações</p>
              <p className="whitespace-pre-wrap">{fct.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {fct.documents.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Documentos</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {fct.documents.map((d) => (
                <li key={d.id}>
                  <a href={d.fileUrl} target="_blank" rel="noreferrer" className="block rounded border px-3 py-2 text-sm hover:bg-muted">
                    {d.title} <span className="text-xs text-muted-foreground">({d.type})</span>
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {fct.reports.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Relatórios</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {fct.reports.map((r) => (
                <li key={r.id} className="rounded border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{r.reportType}</span>
                    {r.grade != null && <Badge variant="secondary">{r.grade}/20</Badge>}
                  </div>
                  {r.content && <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{r.content}</p>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {canEdit && (
        <FctProgressForm
          id={fct.id}
          completedHours={fct.completedHours}
          requiredHours={fct.requiredHours}
          status={fct.status}
          grade={fct.grade}
          notes={fct.notes}
        />
      )}
    </div>
  );
}
