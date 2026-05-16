import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JustificationDecision } from "@/components/attendance/justification-decision";
import { AttachmentChip } from "@/components/files/attachment-chip";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import Link from "next/link";

export default async function JustificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.CLASS_DIRECTOR)) redirect("/dashboard");

  const { status } = await searchParams;
  const filter = status === "approved" ? "APPROVED" : status === "rejected" ? "REJECTED" : "PENDING";

  const justifications = await prisma.absenceJustification.findMany({
    where: {
      status: filter,
      attendanceRecord: {
        lesson: {
          class: { course: { schoolId: session.user.schoolId } },
        },
      },
    },
    include: {
      attendanceRecord: {
        include: {
          student: { select: { id: true, name: true } },
          lesson: {
            include: {
              subject: { select: { name: true } },
              class: { select: { name: true } },
            },
          },
        },
      },
      approvedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const STATUS_OPTS = [
    { key: "pending", label: "Pendentes", value: "PENDING" },
    { key: "approved", label: "Aprovadas", value: "APPROVED" },
    { key: "rejected", label: "Rejeitadas", value: "REJECTED" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-orange)] mb-1">
          Assiduidade
        </div>
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.022em]">Justificações de faltas</h1>
      </div>

      <div className="flex gap-1.5">
        {STATUS_OPTS.map((s) => {
          const isActive = (filter === s.value);
          return (
            <Link
              key={s.key}
              href={`/dashboard/attendance/justifications${s.key === "pending" ? "" : `?status=${s.key}`}`}
              className={
                "rounded-[6px] px-3 py-1.5 text-[12px] font-medium transition-colors " +
                (isActive ? "bg-[var(--primary)] text-white" : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--secondary)]")
              }
            >
              {s.label}
            </Link>
          );
        })}
      </div>

      {justifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-[13px] text-[var(--muted-foreground)]">
            Sem justificações nesta vista.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {justifications.map((j) => (
            <Card key={j.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-[14px] font-semibold">{j.attendanceRecord.student.name}</p>
                    <p className="text-[12px] text-[var(--muted-foreground)]">
                      {j.attendanceRecord.lesson.subject.name} · {j.attendanceRecord.lesson.class.name} ·
                      {" "}
                      {format(j.attendanceRecord.lesson.date, "dd 'de' MMMM yyyy", { locale: pt })}
                      {" "}às {j.attendanceRecord.lesson.startTime}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      j.status === "PENDING"
                        ? "text-[var(--tint-orange)]"
                        : j.status === "APPROVED"
                          ? "text-[var(--tint-green)]"
                          : "text-[var(--destructive)]"
                    }
                  >
                    {j.status === "PENDING" ? "Pendente" : j.status === "APPROVED" ? "Aprovada" : "Rejeitada"}
                  </Badge>
                </div>
                <p className="text-[13px] whitespace-pre-wrap">{j.reason}</p>
                {j.documentUrl && (
                  <div className="flex flex-wrap gap-1.5">
                    <AttachmentChip name="Atestado/comprovativo" url={j.documentUrl} />
                  </div>
                )}
                {j.approvedBy && (
                  <p className="text-[11px] text-[var(--muted-foreground)]">
                    Decidido por {j.approvedBy.name}{j.approvedAt ? ` em ${format(j.approvedAt, "dd/MM/yyyy HH:mm")}` : ""}.
                  </p>
                )}
                {j.status === "PENDING" && <JustificationDecision id={j.id} />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
