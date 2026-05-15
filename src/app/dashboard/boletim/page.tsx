import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, BookOpen, Calendar } from "lucide-react";

export default async function BoletimPage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sp = await searchParams;

  // Resolve the student whose boletim we show
  let studentId = session.user.id;
  if (sp.studentId && sp.studentId !== session.user.id) {
    if (session.user.role === Role.GUARDIAN) {
      const link = await prisma.guardianLink.findUnique({
        where: { guardianId_studentId: { guardianId: session.user.id, studentId: sp.studentId } },
      });
      if (!link) redirect("/dashboard");
      studentId = sp.studentId;
    } else if (session.user.role === Role.STUDENT) {
      redirect("/dashboard/boletim");
    } else {
      // staff: only same school
      const target = await prisma.user.findUnique({ where: { id: sp.studentId }, select: { schoolId: true } });
      if (!target || target.schoolId !== session.user.schoolId) redirect("/dashboard");
      studentId = sp.studentId;
    }
  }

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, email: true, schoolId: true },
  });
  if (!student || student.schoolId !== session.user.schoolId) redirect("/dashboard");

  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId, status: "ACTIVE" },
    include: {
      class: {
        include: {
          course: {
            include: {
              subjects: {
                include: {
                  modules: {
                    include: {
                      studentProgress: { where: { studentId } },
                    },
                    orderBy: { number: "asc" },
                  },
                },
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
    },
  });

  // Attendance totals
  const attendance = await prisma.attendanceRecord.groupBy({
    by: ["status"],
    where: { studentId },
    _count: { _all: true },
  });
  const attCount = {
    PRESENT: 0, ABSENT: 0, JUSTIFIED: 0, LATE: 0,
  } as Record<string, number>;
  for (const a of attendance) attCount[a.status] = a._count._all;
  const totalLessons = Object.values(attCount).reduce((s, n) => s + n, 0);
  const totalAbsences = attCount.ABSENT + attCount.JUSTIFIED + attCount.LATE * 0.5;
  const attendanceRate = totalLessons > 0
    ? Math.round((attCount.PRESENT / totalLessons) * 100)
    : 0;

  // Aggregate per subject
  type SubjAgg = {
    name: string;
    moduleCount: number;
    completed: number;
    avg: number | null;
    failedModules: number;
  };
  const subjects: SubjAgg[] = (enrollment?.class.course.subjects ?? []).map((s) => {
    const grades: number[] = [];
    let completed = 0;
    let failed = 0;
    for (const m of s.modules) {
      const p = m.studentProgress[0];
      if (p) {
        if (p.grade != null) grades.push(p.grade);
        if (p.status === "APPROVED" || p.status === "COMPLETED") completed++;
        if (p.status === "FAILED") failed++;
      }
    }
    return {
      name: s.name,
      moduleCount: s.modules.length,
      completed,
      avg: grades.length ? grades.reduce((a, b) => a + b, 0) / grades.length : null,
      failedModules: failed,
    };
  });

  const overallAvg = subjects.reduce((acc, s) => acc + (s.avg ?? 0) * (s.avg != null ? 1 : 0), 0) /
    Math.max(1, subjects.filter((s) => s.avg != null).length);

  // Alerts
  const alerts: { level: "warning" | "danger"; text: string }[] = [];
  if (attendanceRate < 90 && totalLessons > 0) {
    alerts.push({
      level: attendanceRate < 80 ? "danger" : "warning",
      text: `Taxa de presença em ${attendanceRate}%. Limite legal é 10% de faltas injustificadas.`,
    });
  }
  if (attCount.ABSENT >= 6) {
    alerts.push({
      level: attCount.ABSENT >= 10 ? "danger" : "warning",
      text: `${attCount.ABSENT} faltas injustificadas — verifica se podes justificar.`,
    });
  }
  for (const s of subjects) {
    if (s.failedModules > 0) {
      alerts.push({
        level: "warning",
        text: `Módulos por recuperar em ${s.name}: ${s.failedModules}.`,
      });
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-green)] mb-1">
          Boletim
        </div>
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.022em]">
          {studentId !== session.user.id ? student.name : "O meu boletim"}
        </h1>
        {enrollment && (
          <p className="text-[13px] text-[var(--muted-foreground)]">
            {enrollment.class.course.name} · Turma {enrollment.class.name}
          </p>
        )}
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-[10px] p-3 text-[13px]"
              style={{
                background: a.level === "danger" ? "rgba(255,59,48,0.10)" : "rgba(255,149,0,0.10)",
                color: a.level === "danger" ? "var(--destructive)" : "var(--tint-orange)",
              }}
            >
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{a.text}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="Média geral"
          value={isFinite(overallAvg) && overallAvg > 0 ? overallAvg.toFixed(1) : "—"}
          icon={BookOpen}
          tint="var(--tint-blue)"
          description="valores 0–20"
        />
        <StatCard
          title="Assiduidade"
          value={`${attendanceRate}%`}
          icon={CheckCircle2}
          tint="var(--tint-green)"
          description={`${attCount.PRESENT} presenças`}
        />
        <StatCard
          title="Faltas"
          value={attCount.ABSENT}
          icon={Calendar}
          tint="var(--destructive)"
          description={`${attCount.JUSTIFIED} justificadas`}
        />
        <StatCard
          title="Atrasos"
          value={attCount.LATE}
          icon={Calendar}
          tint="var(--tint-orange)"
          description="contam 50%"
        />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Por disciplina</CardTitle></CardHeader>
        <CardContent className="p-0">
          {subjects.length === 0 ? (
            <p className="px-4 py-6 text-center text-[13px] text-[var(--muted-foreground)]">
              Sem matrícula ativa.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--separator)]">
              {subjects.map((s) => (
                <li key={s.name} className="px-4 py-3 grid grid-cols-[1fr_auto_auto] items-center gap-3">
                  <div>
                    <p className="text-[14px] font-medium">{s.name}</p>
                    <p className="text-[11px] text-[var(--muted-foreground)]">
                      {s.completed}/{s.moduleCount} módulos · {s.failedModules > 0 ? `${s.failedModules} por recuperar` : "OK"}
                    </p>
                  </div>
                  <Badge variant="outline" className="tabular-nums">
                    {s.avg != null ? s.avg.toFixed(1) : "—"}
                  </Badge>
                  <span className="text-[11px] tabular-nums text-[var(--muted-foreground)] w-12 text-right">
                    {s.moduleCount > 0 ? Math.round((s.completed / s.moduleCount) * 100) : 0}%
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
