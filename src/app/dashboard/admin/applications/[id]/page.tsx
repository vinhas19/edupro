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
import { ApplicationDecision } from "@/components/applications/application-decision";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) redirect("/dashboard");
  const { id } = await params;

  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      course: true,
      academicYear: true,
      reviewedBy: { select: { name: true } },
      school: { select: { featureEnrollment: true } },
    },
  });
  if (!app || app.schoolId !== session.user.schoolId || !app.school.featureEnrollment) notFound();

  const classes = app.courseId
    ? await prisma.class.findMany({
        where: {
          courseId: app.courseId,
          academicYear: { active: true },
        },
        select: { id: true, name: true, _count: { select: { enrollments: true } } },
        orderBy: { name: "asc" },
      })
    : [];

  const docs = (app.documentsJson as { kind: string; name: string; url: string }[] | null) ?? [];

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/admin/applications"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-orange)] mb-0.5">
            Candidatura · {format(app.createdAt, "d 'de' MMM yyyy", { locale: pt })}
          </div>
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.022em]">{app.fullName}</h1>
          <p className="text-[12px] text-[var(--muted-foreground)]">
            {app.email}
            {app.phone && ` · ${app.phone}`}
          </p>
        </div>
      </div>

      <ApplicationDecision
        id={app.id}
        currentStatus={app.status}
        classes={classes}
      />

      <Card>
        <CardHeader><CardTitle className="text-base">Curso pretendido</CardTitle></CardHeader>
        <CardContent className="text-[13px] space-y-1">
          {app.course && <p><strong>Curso:</strong> {app.course.name} ({app.course.code})</p>}
          {app.academicYear && <p><strong>Ano lectivo:</strong> {app.academicYear.label}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Dados pessoais</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px]">
          {app.birthDate && <Row label="Data de nascimento" value={format(app.birthDate, "d MMM yyyy")} />}
          {app.citizenId && <Row label="Cartão de cidadão" value={app.citizenId} />}
          {app.vatId && <Row label="NIF" value={app.vatId} />}
          {app.address && <Row label="Morada" value={app.address} />}
          {app.postalCode && <Row label="CP" value={app.postalCode} />}
          {app.city && <Row label="Localidade" value={app.city} />}
        </CardContent>
      </Card>

      {(app.previousSchool || app.previousYear || app.previousGrade) && (
        <Card>
          <CardHeader><CardTitle className="text-base">Habilitações</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[13px]">
            {app.previousSchool && <Row label="Escola" value={app.previousSchool} />}
            {app.previousYear && <Row label="Ano" value={app.previousYear} />}
            {app.previousGrade != null && <Row label="Média" value={app.previousGrade.toString()} />}
          </CardContent>
        </Card>
      )}

      {(app.guardianName || app.guardianEmail) && (
        <Card>
          <CardHeader><CardTitle className="text-base">Encarregado de educação</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px]">
            {app.guardianName && <Row label="Nome" value={app.guardianName} />}
            {app.guardianRelation && <Row label="Parentesco" value={app.guardianRelation} />}
            {app.guardianEmail && <Row label="Email" value={app.guardianEmail} />}
            {app.guardianPhone && <Row label="Telemóvel" value={app.guardianPhone} />}
          </CardContent>
        </Card>
      )}

      {docs.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Documentos</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {docs.map((d, i) => (
                <li key={i} className="text-[13px]">
                  <a href={d.url} target="_blank" rel="noreferrer" className="text-[var(--primary)] hover:underline">
                    {d.kind}: {d.name}
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {app.notes && (
        <Card>
          <CardHeader><CardTitle className="text-base">Notas internas</CardTitle></CardHeader>
          <CardContent>
            <p className="text-[13px] whitespace-pre-wrap">{app.notes}</p>
          </CardContent>
        </Card>
      )}

      {app.reviewedBy && app.reviewedAt && (
        <p className="text-[11px] text-[var(--muted-foreground)]">
          Decidida por {app.reviewedBy.name} em {format(app.reviewedAt, "d MMM yyyy 'às' HH:mm", { locale: pt })}
          {app.status === "REJECTED" && app.rejectionReason && ` — ${app.rejectionReason}`}
        </p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.04em] text-[var(--muted-foreground)]">{label}</p>
      <p>{value}</p>
    </div>
  );
}
