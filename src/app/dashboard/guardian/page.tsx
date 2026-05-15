import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function GuardianPortal() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== Role.GUARDIAN) redirect("/dashboard");

  const wards = await prisma.guardianLink.findMany({
    where: { guardianId: session.user.id },
    include: {
      student: {
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            include: {
              class: { include: { course: { select: { name: true, code: true } } } },
            },
            take: 1,
          },
        },
      },
    },
  });

  const wardIds = wards.map((w) => w.studentId);

  // Recent absences across all wards
  const recentAbsences = wardIds.length
    ? await prisma.attendanceRecord.findMany({
        where: {
          studentId: { in: wardIds },
          status: { in: ["ABSENT", "JUSTIFIED", "LATE"] },
        },
        include: {
          student: { select: { id: true, name: true } },
          lesson: {
            include: {
              subject: { select: { name: true } },
              class: { select: { name: true } },
            },
          },
          justification: { select: { status: true } },
        },
        orderBy: { lesson: { date: "desc" } },
        take: 10,
      })
    : [];

  // Upcoming assignments
  const upcoming = wardIds.length
    ? await prisma.classroomPost.findMany({
        where: {
          type: "ASSIGNMENT",
          dueDate: { gte: new Date() },
          class: { enrollments: { some: { studentId: { in: wardIds }, status: "ACTIVE" } } },
        },
        include: {
          class: { select: { name: true } },
          subject: { select: { name: true } },
        },
        orderBy: { dueDate: "asc" },
        take: 8,
      })
    : [];

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-indigo)] mb-1">
          Encarregado de educação
        </div>
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.022em]">Portal do EE</h1>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {wards.map((w) => {
          const enr = w.student.enrollments[0];
          return (
            <Card key={w.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{w.student.name}</CardTitle>
                    {enr && (
                      <p className="text-[12px] text-[var(--muted-foreground)] mt-0.5">
                        {enr.class.course.name} · Turma {enr.class.name}
                      </p>
                    )}
                  </div>
                  {w.kind && <Badge variant="outline" className="shrink-0 text-[11px]">{w.kind}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link
                  href={`/dashboard/boletim?studentId=${w.student.id}`}
                  className="block rounded-[8px] px-3 py-2 bg-[var(--muted)] hover:bg-[var(--secondary)] text-[13px] font-medium"
                >
                  📋 Boletim digital
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Faltas recentes</CardTitle></CardHeader>
        <CardContent className="p-0">
          {recentAbsences.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-[var(--muted-foreground)]">Sem faltas recentes.</p>
          ) : (
            <ul className="divide-y divide-[var(--separator)]">
              {recentAbsences.map((a) => (
                <li key={a.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-medium">{a.student.name}</p>
                    <p className="text-[11px] text-[var(--muted-foreground)]">
                      {a.lesson.subject.name} · {new Date(a.lesson.date).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      a.status === "JUSTIFIED"
                        ? "text-[var(--tint-green)]"
                        : a.status === "LATE"
                          ? "text-[var(--tint-orange)]"
                          : "text-[var(--destructive)]"
                    }
                  >
                    {a.status === "JUSTIFIED" ? "Justificada" : a.status === "LATE" ? "Atraso" : a.justification?.status === "PENDING" ? "Pendente" : "Falta"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Trabalhos por entregar</CardTitle></CardHeader>
        <CardContent className="p-0">
          {upcoming.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-[var(--muted-foreground)]">Sem trabalhos pendentes.</p>
          ) : (
            <ul className="divide-y divide-[var(--separator)]">
              {upcoming.map((p) => (
                <li key={p.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-medium">{p.title}</p>
                    <p className="text-[11px] text-[var(--muted-foreground)]">
                      {p.subject?.name ?? ""} · {p.class.name}
                    </p>
                  </div>
                  <span className="text-[11px] tabular-nums text-[var(--muted-foreground)]">
                    {p.dueDate?.toLocaleDateString("pt-PT")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
