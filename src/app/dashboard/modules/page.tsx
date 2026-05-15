import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole, MODULE_STATUS_LABELS } from "@/lib/permissions";
import { StatCard } from "@/components/ui/stat-card";
import { PanelCard } from "@/components/dashboard/panel-card";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import { CheckCircle, Clock, AlertCircle, BarChart3, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const SUBJECT_TINTS = [
  "var(--tint-indigo)", "var(--tint-pink)", "var(--tint-red)",
  "var(--tint-orange)", "var(--tint-green)", "var(--tint-teal)",
  "var(--tint-purple)", "var(--tint-cyan)", "var(--tint-brown)",
];

// Color a grade by Portuguese 0-20 scale
function gradeColor(g: number | null): string {
  if (g == null) return "text-[var(--muted-foreground)]";
  if (g < 10) return "text-[var(--tint-red)]";
  if (g < 14) return "text-[var(--tint-orange)]";
  if (g < 17) return "text-[var(--tint-blue)]";
  return "text-[var(--tint-green)]";
}

const STATUS_BADGE: Record<string, string> = {
  NOT_STARTED:   "bg-[var(--muted)] text-[var(--muted-foreground)]",
  IN_PROGRESS:   "bg-[rgba(0,122,255,0.16)] text-[#0064d2]",
  COMPLETED:     "bg-[rgba(52,199,89,0.16)] text-[#1d8a3a]",
  APPROVED:      "bg-[rgba(52,199,89,0.16)] text-[#1d8a3a]",
  RECURSO:       "bg-[rgba(255,204,0,0.22)] text-[#8a6500]",
  SPECIAL_EPOCH: "bg-[rgba(255,149,0,0.18)] text-[#b86b00]",
  FAILED:        "bg-[rgba(255,59,48,0.16)] text-[#c41a13]",
};

export default async function ModulesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: userId, role, schoolId } = session.user;

  // ════════ STUDENT VIEW ════════
  if (!hasRole(role, Role.TEACHER)) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: userId, status: "ACTIVE" },
      include: {
        class: {
          include: {
            course: {
              include: {
                subjects: {
                  include: { modules: { orderBy: { order: "asc" } } },
                  orderBy: { order: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      return (
        <div className="space-y-4">
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.022em]">Notas & Módulos</h1>
          <div className="bg-[var(--card)] rounded-[12px] shadow-[var(--card-shadow)] py-12 text-center text-[13px] text-[var(--muted-foreground)]">
            Sem turma atribuída.
          </div>
        </div>
      );
    }

    const progress = await prisma.studentModuleProgress.findMany({
      where: { studentId: userId },
      include: { module: true },
    });
    const progressMap = new Map(progress.map((p) => [p.moduleId, p]));

    const course = enrollment.class.course;
    const allModules = course.subjects.flatMap((s) => s.modules);
    const totalModules = allModules.length;
    const approved = progress.filter((p) => ["APPROVED", "COMPLETED"].includes(p.status)).length;
    const inProgress = progress.filter((p) => p.status === "IN_PROGRESS").length;
    const recurso = progress.filter((p) => ["FAILED", "RECURSO"].includes(p.status)).length;
    const gradedMods = progress.filter((p) => p.grade != null);
    const avg = gradedMods.length ? gradedMods.reduce((s, p) => s + (p.grade ?? 0), 0) / gradedMods.length : null;

    return (
      <div className="space-y-5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-pink)] mb-1">
            Notas & Módulos
          </div>
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.022em]">Os meus módulos</h1>
          <p className="text-[14px] text-[var(--muted-foreground)]">{course.name}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard title="Média" value={avg != null ? avg.toFixed(1) : "—"} icon={BarChart3} tint="var(--tint-pink)" description="0-20" />
          <StatCard title="Aprovados" value={approved} icon={CheckCircle} tint="var(--tint-green)" description={`de ${totalModules}`} />
          <StatCard title="Em curso" value={inProgress} icon={Clock} tint="var(--tint-blue)" />
          <StatCard title="Em recurso" value={recurso} icon={AlertCircle} tint="var(--tint-orange)" />
        </div>

        {course.subjects.map((subject, sIdx) => {
          const subjectMods = subject.modules;
          const subjectApproved = subjectMods.filter((m) => {
            const p = progressMap.get(m.id);
            return p && ["APPROVED", "COMPLETED"].includes(p.status);
          }).length;
          const pct = subjectMods.length > 0 ? (subjectApproved / subjectMods.length) * 100 : 0;
          const tint = SUBJECT_TINTS[sIdx % SUBJECT_TINTS.length];

          return (
            <div key={subject.id} className="bg-[var(--card)] rounded-[12px] shadow-[var(--card-shadow)]">
              <header className="flex items-center gap-3 p-4 border-b border-[var(--separator)]">
                <span
                  className="h-9 w-9 rounded-[8px] flex items-center justify-center text-white shrink-0"
                  style={{ background: tint }}
                >
                  <BookOpen className="h-4 w-4" strokeWidth={2.2} />
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-semibold tracking-[-0.005em]">{subject.name}</h3>
                  <p className="text-[12px] text-[var(--muted-foreground)] tabular-nums">
                    {subjectApproved} de {subjectMods.length} módulos aprovados · {subject.totalHours}h
                  </p>
                </div>
                <ProgressRing value={pct} size={40} stroke={4} color={tint} />
              </header>
              <div className="divide-y divide-[var(--separator)]">
                {subjectMods.map((mod) => {
                  const p = progressMap.get(mod.id);
                  const status = p?.status ?? "NOT_STARTED";
                  const grade = p?.grade;
                  return (
                    <div key={mod.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="font-mono text-[12px] font-bold text-[var(--muted-foreground)] tabular-nums w-8 text-right">
                        M{mod.number}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate">{mod.name}</p>
                        <p className="text-[11px] text-[var(--muted-foreground)]">{mod.hours}h</p>
                      </div>
                      <span className={cn("text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded shrink-0", STATUS_BADGE[status])}>
                        {MODULE_STATUS_LABELS[status]}
                      </span>
                      <span className={cn("font-mono text-[14px] font-bold tabular-nums w-10 text-right", gradeColor(grade ?? null))}>
                        {grade != null ? grade.toFixed(0) : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ════════ TEACHER VIEW ════════
  const classes = await prisma.class.findMany({
    where: {
      course: { schoolId },
      academicYear: { active: true },
      ...(role === Role.TEACHER || role === Role.CLASS_DIRECTOR
        ? {
            OR: [
              { classDirectorId: userId },
              { subjectAssignments: { some: { teacherId: userId } } },
            ],
          }
        : {}),
    },
    include: {
      course: { select: { name: true } },
      subjectAssignments: {
        ...(role === Role.TEACHER ? { where: { teacherId: userId } } : {}),
        include: {
          subject: { include: { modules: { orderBy: { number: "asc" } } } },
          teacher: { select: { name: true } },
        },
      },
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              moduleProgress: { include: { module: true } },
            },
          },
        },
        orderBy: { student: { name: "asc" } },
      },
    },
    orderBy: [{ year: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-pink)] mb-1">
          Notas & Módulos
        </div>
        <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.022em]">Pauta de módulos</h1>
      </div>

      {classes.length === 0 ? (
        <div className="bg-[var(--card)] rounded-[12px] shadow-[var(--card-shadow)] py-12 text-center text-[13px] text-[var(--muted-foreground)]">
          Sem turmas atribuídas.
        </div>
      ) : (
        classes.map((cls) => {
          // Take subjects from this class taught by user (or all if admin)
          const subjects = [...new Map(cls.subjectAssignments.map((a) => [a.subject.id, a.subject])).values()];
          if (subjects.length === 0) return null;

          return subjects.map((subject) => {
            const modules = subject.modules;
            const students = cls.enrollments.map((e) => e.student);
            // Compute per-student grades for this subject
            const studentRows = students.map((s) => {
              const grades = modules.map((m) => {
                const p = s.moduleProgress.find((x) => x.moduleId === m.id);
                return { module: m, grade: p?.grade ?? null, status: p?.status ?? "NOT_STARTED" };
              });
              const valid = grades.filter((g) => g.grade != null).map((g) => g.grade!);
              const avg = valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
              return { student: s, grades, avg };
            });
            const approvedCount = studentRows.flatMap((r) => r.grades).filter((g) => g.grade != null && g.grade >= 10).length;
            const totalGrades = studentRows.flatMap((r) => r.grades).filter((g) => g.grade != null).length;
            const passRate = totalGrades > 0 ? Math.round((approvedCount / totalGrades) * 100) : 0;
            const classAvg = studentRows.filter((r) => r.avg != null).reduce((s, r) => s + (r.avg ?? 0), 0) / (studentRows.filter((r) => r.avg != null).length || 1);
            const atRisk = studentRows.filter((r) => r.avg != null && r.avg < 10).length;

            return (
              <PanelCard
                key={`${cls.id}-${subject.id}`}
                title={`${subject.name} · ${cls.name}`}
                flush
              >
                {/* Desktop/tablet: table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-[var(--separator)] text-[var(--muted-foreground)]">
                        <th className="px-4 py-2 text-left font-semibold uppercase text-[10px] tracking-wider">Aluno</th>
                        {modules.map((m) => (
                          <th key={m.id} className="px-2 py-2 text-center font-semibold uppercase text-[10px] tracking-wider min-w-[44px]">
                            M{m.number}
                          </th>
                        ))}
                        <th className="px-3 py-2 text-center font-semibold uppercase text-[10px] tracking-wider">Média</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentRows.map((row) => (
                        <tr key={row.student.id} className="border-b border-[var(--separator)] last:border-b-0 hover:bg-[var(--muted)]/40">
                          <td className="px-4 py-2 font-medium">{row.student.name}</td>
                          {row.grades.map((g) => (
                            <td key={g.module.id} className={cn("px-2 py-2 text-center font-mono font-semibold tabular-nums", gradeColor(g.grade))}>
                              {g.grade != null ? g.grade.toFixed(0) : "—"}
                            </td>
                          ))}
                          <td className={cn("px-3 py-2 text-center font-mono font-bold tabular-nums", gradeColor(row.avg))}>
                            {row.avg != null ? row.avg.toFixed(1) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile: per-student list */}
                <ul className="md:hidden">
                  {studentRows.map((row) => (
                    <li key={row.student.id} className="px-4 py-3 border-b border-[var(--separator)] last:border-b-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[13px] font-medium">{row.student.name}</p>
                        <span className={cn("font-mono text-[14px] font-bold tabular-nums", gradeColor(row.avg))}>
                          {row.avg != null ? row.avg.toFixed(1) : "—"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {row.grades.map((g) => (
                          <span
                            key={g.module.id}
                            className={cn(
                              "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold tabular-nums bg-[var(--muted)]",
                              gradeColor(g.grade)
                            )}
                          >
                            M{g.module.number}: {g.grade != null ? g.grade.toFixed(0) : "—"}
                          </span>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Footer KPIs */}
                <div className="grid grid-cols-3 gap-2 px-4 py-3 border-t border-[var(--separator)] text-center">
                  <div>
                    <div className={cn("text-[16px] font-bold tabular-nums", gradeColor(classAvg))}>
                      {classAvg ? classAvg.toFixed(1) : "—"}
                    </div>
                    <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">Média turma</div>
                  </div>
                  <div>
                    <div className="text-[16px] font-bold tabular-nums">{passRate}%</div>
                    <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">Aprovação</div>
                  </div>
                  <div>
                    <div className={cn("text-[16px] font-bold tabular-nums", atRisk > 0 ? "text-[var(--tint-red)]" : "")}>
                      {atRisk}
                    </div>
                    <div className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">Em risco</div>
                  </div>
                </div>
              </PanelCard>
            );
          });
        })
      )}
    </div>
  );
}
