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

export default async function SubstitutionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.CLASS_DIRECTOR)) redirect("/dashboard");

  const { schoolId } = session.user;

  const teachers = await prisma.user.findMany({
    where: {
      schoolId,
      active: true,
      role: { in: [Role.TEACHER, Role.CLASS_DIRECTOR, Role.COURSE_DIRECTOR] },
    },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // Active and upcoming absences (today onward)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const absences = await prisma.teacherAbsence.findMany({
    where: {
      teacher: { schoolId },
      date: { gte: today },
    },
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
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Substituições</h1>
          <p className="text-muted-foreground">Gerir ausências de professores e atribuir substitutos</p>
        </div>
        <AbsenceForm teachers={teachers} />
      </div>

      {absences.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserX className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-medium">Sem ausências registadas</p>
            <p className="text-sm text-muted-foreground">
              Marque uma ausência para começar a atribuir substitutos.
            </p>
          </CardContent>
        </Card>
      ) : (
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
      )}
    </div>
  );
}
