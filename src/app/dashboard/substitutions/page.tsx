import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserX } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { AbsenceForm } from "@/components/substitutions/absence-form";
import { SubstitutionRow } from "@/components/substitutions/substitution-row";
import { SubstituteActions } from "@/components/substitutions/substitute-actions";

export default async function SubstitutionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.TEACHER)) redirect("/dashboard");

  const isManager = hasRole(session.user.role, Role.CLASS_DIRECTOR);
  const { schoolId, id: userId } = session.user;

  // Convites pessoais (substituições atribuídas ao próprio utilizador)
  const myAssignments = await prisma.substitution.findMany({
    where: {
      substituteId: userId,
      status: { in: ["ASSIGNED", "CONFIRMED"] },
      absence: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    },
    include: {
      absence: { include: { teacher: { select: { name: true } } } },
      class: { select: { name: true, course: { select: { name: true } } } },
      subject: { select: { name: true } },
    },
    orderBy: { absence: { date: "asc" } },
  });

  const teachers = isManager
    ? await prisma.user.findMany({
        where: {
          schoolId,
          active: true,
          role: { in: [Role.TEACHER, Role.CLASS_DIRECTOR, Role.COURSE_DIRECTOR] },
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  // Active and upcoming absences (today onward) — só para gestores
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const absences = isManager
    ? await prisma.teacherAbsence.findMany({
        where: { teacher: { schoolId }, date: { gte: today } },
        include: {
          teacher: { select: { id: true, name: true } },
          substitutions: {
            include: {
              subject: { select: { id: true, name: true } },
              class: { select: { name: true } },
              substitute: { select: { id: true, name: true } },
              scheduleBlock: { select: { dayOfWeek: true } },
            },
          },
        },
        orderBy: { date: "asc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.022em]">Substituições</h1>
          <p className="text-muted-foreground text-sm">
            {isManager ? "Gerir ausências de professores e atribuir substitutos." : "Convites para substituir colegas."}
          </p>
        </div>
        {isManager && <AbsenceForm teachers={teachers} />}
      </div>

      {myAssignments.length > 0 && (
        <Card>
          <CardContent className="pt-5 space-y-3">
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--muted-foreground)]">
              Convites para mim
            </h2>
            <ul className="space-y-2">
              {myAssignments.map((s) => (
                <li
                  key={s.id}
                  className="rounded-[10px] border border-[var(--separator)] p-3 flex items-start justify-between gap-3 flex-wrap"
                >
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold">
                      {s.subject.name} · {s.class.name}
                    </p>
                    <p className="text-[12px] text-[var(--muted-foreground)]">
                      {format(new Date(s.absence.date), "EEEE, d 'de' MMMM yyyy", { locale: pt })}
                      {" · "}{s.startTime}–{s.endTime}
                      {" · "}substitui {s.absence.teacher.name}
                    </p>
                  </div>
                  <SubstituteActions substitutionId={s.id} status={s.status} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {!isManager && myAssignments.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-[13px] text-[var(--muted-foreground)]">
            Sem convites de substituição.
          </CardContent>
        </Card>
      )}

      {isManager && absences.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserX className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-medium">Sem ausências registadas</p>
            <p className="text-sm text-muted-foreground">
              Marque uma ausência para começar a atribuir substitutos.
            </p>
          </CardContent>
        </Card>
      ) : isManager ? (
        absences.map((abs) => {
          const dayOfWeek = new Date(abs.date).getDay() === 0 ? 7 : new Date(abs.date).getDay();
          return (
            <Card key={abs.id}>
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{abs.teacher.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(abs.date), "EEEE, d 'de' MMMM yyyy", { locale: pt })} · {abs.startTime}–{abs.endTime}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {abs.substitutions.length} aula(s) afectada(s)
                  </Badge>
                </div>
                {abs.reason && (
                  <p className="text-xs italic text-muted-foreground">"{abs.reason}"</p>
                )}

                {abs.substitutions.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    Sem aulas no horário desta ausência.
                  </p>
                ) : (
                  <div className="space-y-2 pt-1">
                    {abs.substitutions.map((s) => (
                      <SubstitutionRow
                        key={s.id}
                        id={s.id}
                        subject={s.subject}
                        className={s.class.name}
                        startTime={s.startTime}
                        endTime={s.endTime}
                        dayOfWeek={s.scheduleBlock?.dayOfWeek ?? dayOfWeek}
                        status={s.status}
                        substitute={s.substitute}
                        excludeTeacherId={abs.teacher.id}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      ) : null}
    </div>
  );
}
