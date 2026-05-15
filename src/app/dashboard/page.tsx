import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole, ROLE_LABELS, MODULE_STATUS_LABELS, MODULE_STATUS_COLORS } from "@/lib/permissions";
import { StatCard } from "@/components/ui/stat-card";
import { PanelCard } from "@/components/dashboard/panel-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import {
  Users, GraduationCap, BookOpen, ClipboardList, AlertCircle, CheckCircle,
  Calendar, TrendingUp, MessageSquare, Bell, FileText, BarChart3,
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: userId, role, schoolId, name } = session.user;
  if (role === Role.GUARDIAN) redirect("/dashboard/guardian");
  const firstName = name.split(" ")[0];
  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: pt });

  const Header = (
    <div className="mb-5 sm:mb-6">
      <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-blue)] mb-1">
        Painel · {ROLE_LABELS[role]}
      </div>
      <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.022em]">
        Olá, {firstName}
      </h1>
      <p className="text-[14px] text-[var(--muted-foreground)] capitalize">{today}</p>
    </div>
  );

  // ════════ STUDENT ════════
  if (role === Role.STUDENT) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: userId, status: "ACTIVE" },
      include: { class: { include: { course: { include: { subjects: { include: { modules: true } } } } } } },
    });
    const [moduleProgress, recentAttendance, notifications, fct] = await Promise.all([
      prisma.studentModuleProgress.findMany({
        where: { studentId: userId },
        include: { module: { include: { subject: true } } },
      }),
      prisma.attendanceRecord.findMany({
        where: { studentId: userId },
        take: 30,
        orderBy: { lesson: { date: "desc" } },
      }),
      prisma.notificationRecipient.findMany({
        where: { recipientId: userId },
        include: { notification: { include: { sender: { select: { name: true } } } } },
        orderBy: { notification: { createdAt: "desc" } },
        take: 4,
      }),
      prisma.fctRecord.findFirst({
        where: { studentId: userId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const totalMods = enrollment?.class.course.subjects.reduce((s, x) => s + x.modules.length, 0) ?? 0;
    const approved = moduleProgress.filter((p) => ["APPROVED", "COMPLETED"].includes(p.status)).length;
    const absences = recentAttendance.filter((r) => r.status === "ABSENT").length;
    const gradedMods = moduleProgress.filter((p) => p.grade != null);
    const avg = gradedMods.length ? gradedMods.reduce((s, p) => s + (p.grade ?? 0), 0) / gradedMods.length : null;
    const fctPct = fct ? Math.round((fct.completedHours / fct.requiredHours) * 100) : 0;

    return (
      <div className="space-y-5 sm:space-y-6">
        {Header}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard title="Módulos" value={`${approved}/${totalMods}`} icon={CheckCircle} tint="var(--tint-green)" description="aprovados" />
          <StatCard title="Média" value={avg != null ? avg.toFixed(1) : "—"} icon={BarChart3} tint="var(--tint-pink)" description={avg != null ? `${gradedMods.length} módulos` : "sem notas"} />
          <StatCard title="Faltas" value={absences} icon={AlertCircle} tint="var(--tint-red)" description="últimas 30 aulas" />
          <StatCard title="FCT" value={`${fctPct}%`} icon={TrendingUp} tint="var(--tint-teal)" description={fct ? "em curso" : "sem registo"} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          <PanelCard title="Progresso nos Módulos">
            <div className="flex items-center gap-4 mb-3">
              <ProgressRing
                value={totalMods > 0 ? (approved / totalMods) * 100 : 0}
                size={64}
                color="var(--tint-green)"
              />
              <div>
                <div className="text-[22px] font-bold tracking-[-0.022em] tabular-nums">
                  {approved}<span className="text-[var(--muted-foreground)] text-[15px] font-medium">/{totalMods}</span>
                </div>
                <div className="text-[12px] text-[var(--muted-foreground)]">módulos concluídos</div>
              </div>
            </div>
            {moduleProgress.length === 0 ? (
              <p className="text-[13px] text-[var(--muted-foreground)]">Sem progresso registado.</p>
            ) : (
              <ul className="space-y-1.5">
                {moduleProgress.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-[13px] py-1">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium truncate">{p.module.subject.name}</span>
                      <span className="text-[var(--muted-foreground)]"> · M{p.module.number}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {p.grade != null && (
                        <span className="font-mono text-[12px] font-semibold tabular-nums">{p.grade.toFixed(0)}/20</span>
                      )}
                      <span
                        className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${MODULE_STATUS_COLORS[p.status]}`}
                      >
                        {MODULE_STATUS_LABELS[p.status]}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </PanelCard>

          <PanelCard title="Atalhos">
            <QuickActions
              actions={[
                { label: "Ver horário",     href: "/dashboard/schedule",    icon: Calendar,      tint: "var(--tint-red)"    },
                { label: "Justificar falta",href: "/dashboard/attendance",  icon: CheckCircle,   tint: "var(--tint-green)"  },
                { label: "Notas & Módulos", href: "/dashboard/modules",     icon: BarChart3,     tint: "var(--tint-pink)"   },
                { label: "Mensagens",       href: "/dashboard/messages",    icon: MessageSquare, tint: "var(--tint-green)"  },
              ]}
            />
          </PanelCard>
        </div>

        <PanelCard title="Comunicações recentes">
          {notifications.length === 0 ? (
            <p className="text-[13px] text-[var(--muted-foreground)]">Sem avisos.</p>
          ) : (
            <ul className="space-y-2.5">
              {notifications.map((r) => (
                <li key={r.id} className="flex items-start gap-3 text-[13px]">
                  <span
                    className="h-7 w-7 rounded-[7px] flex items-center justify-center text-white shrink-0 mt-0.5"
                    style={{
                      background:
                        r.notification.type === "ALERT" ? "var(--tint-red)"
                        : r.notification.type === "WARNING" ? "var(--tint-orange)"
                        : r.notification.type === "DEADLINE" ? "var(--tint-purple)"
                        : "var(--tint-blue)",
                    }}
                  >
                    <Bell className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`font-medium ${!r.readAt ? "" : "text-[var(--muted-foreground)]"}`}>
                      {r.notification.title}
                    </p>
                    <p className="text-[12px] text-[var(--muted-foreground)] line-clamp-1">
                      {r.notification.content}
                    </p>
                  </div>
                  <span className="text-[11px] text-[var(--muted-foreground)] shrink-0 tabular-nums">
                    {format(new Date(r.notification.createdAt), "d MMM", { locale: pt })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </PanelCard>
      </div>
    );
  }

  // ════════ ADMIN ════════
  if (hasRole(role, Role.SCHOOL_ADMIN)) {
    const [students, teachers, classes, courses, weekLessons] = await Promise.all([
      prisma.user.count({ where: { schoolId, role: Role.STUDENT, active: true } }),
      prisma.user.count({ where: { schoolId, role: { in: [Role.TEACHER, Role.CLASS_DIRECTOR, Role.COURSE_DIRECTOR] }, active: true } }),
      prisma.class.count({ where: { course: { schoolId }, academicYear: { active: true } } }),
      prisma.course.findMany({
        where: { schoolId, active: true },
        include: { classes: { include: { enrollments: { where: { status: "ACTIVE" } } } } },
        orderBy: { name: "asc" },
        take: 5,
      }),
      prisma.lesson.groupBy({
        by: ["date"],
        where: {
          teacher: { schoolId },
          date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        _count: { _all: true },
      }),
    ]);

    const attendance = await prisma.attendanceRecord.findMany({
      where: { lesson: { teacher: { schoolId } } },
      select: { status: true },
    });
    const presentCount = attendance.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
    const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 100;

    const chartData = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      const dayData = weekLessons.find(
        (d) => new Date(d.date).toDateString() === date.toDateString()
      );
      return {
        label: format(date, "EE", { locale: pt }).slice(0, 3),
        value: dayData?._count._all ?? 0,
        isToday: date.toDateString() === new Date().toDateString(),
      };
    });

    return (
      <div className="space-y-5 sm:space-y-6">
        {Header}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard title="Alunos" value={students} icon={Users} tint="var(--tint-blue)" description="ativos" />
          <StatCard title="Professores" value={teachers} icon={GraduationCap} tint="var(--tint-indigo)" description="ativos" />
          <StatCard title="Turmas" value={classes} icon={BookOpen} tint="var(--tint-orange)" description="ano letivo" />
          <StatCard title="Assiduidade" value={`${attendanceRate}%`} icon={TrendingUp} tint="var(--tint-green)" description="média geral" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          <PanelCard title="Atividade desta semana">
            <ActivityChart data={chartData} height={160} />
            <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-[var(--separator)] mt-2">
              <div>
                <div className="text-[18px] font-bold tabular-nums">{weekLessons.reduce((s, d) => s + d._count._all, 0)}</div>
                <div className="text-[11px] text-[var(--muted-foreground)]">Aulas</div>
              </div>
              <div>
                <div className="text-[18px] font-bold tabular-nums">{attendanceRate}%</div>
                <div className="text-[11px] text-[var(--muted-foreground)]">Presenças</div>
              </div>
              <div>
                <div className="text-[18px] font-bold tabular-nums">{classes}</div>
                <div className="text-[11px] text-[var(--muted-foreground)]">Turmas</div>
              </div>
            </div>
          </PanelCard>

          <PanelCard title="Cursos · resultados">
            {courses.length === 0 ? (
              <p className="text-[13px] text-[var(--muted-foreground)]">Sem cursos.</p>
            ) : (
              <ul className="space-y-2">
                {courses.map((c) => {
                  const total = c.classes.reduce((s, cl) => s + cl.enrollments.length, 0);
                  return (
                    <li key={c.id}>
                      <Link
                        href={`/dashboard/courses/${c.id}`}
                        className="flex items-center justify-between text-[13px] py-1.5 rounded hover:bg-[var(--muted)] px-1 -mx-1"
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">{c.name}</p>
                          <p className="text-[11px] text-[var(--muted-foreground)]">
                            {c.code} · {total} alunos
                          </p>
                        </div>
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-[var(--muted)] shrink-0">
                          Nível {c.level}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </PanelCard>
        </div>

        <PanelCard title="Atalhos administrativos">
          <QuickActions
            actions={[
              { label: "Novo utilizador", href: "/dashboard/users/new",     icon: Users,         tint: "var(--tint-cyan)"   },
              { label: "Novo curso",      href: "/dashboard/courses/new",   icon: GraduationCap, tint: "var(--tint-orange)" },
              { label: "Editar horário",  href: "/dashboard/schedule/edit", icon: Calendar,      tint: "var(--tint-red)"    },
              { label: "Definições",      href: "/dashboard/settings",      icon: BarChart3,     tint: "var(--tint-gray)"   },
            ]}
          />
        </PanelCard>
      </div>
    );
  }

  // ════════ TEACHER ════════
  const [pendingLessons, todayLessons, pendingJustifications, recentLessons] = await Promise.all([
    prisma.lesson.count({ where: { teacherId: userId, summary: null } }),
    prisma.lesson.findMany({
      where: {
        teacherId: userId,
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
      include: { subject: true, class: true, attendanceRecords: { select: { id: true } } },
      orderBy: { startTime: "asc" },
    }),
    hasRole(role, Role.CLASS_DIRECTOR)
      ? prisma.absenceJustification.count({
          where: {
            status: "PENDING",
            attendanceRecord: { lesson: { class: { classDirectorId: userId } } },
          },
        })
      : Promise.resolve(0),
    prisma.lesson.findMany({
      where: { teacherId: userId },
      orderBy: { date: "desc" },
      take: 5,
      include: { subject: true, class: true },
    }),
  ]);

  const myClassIds = await prisma.subjectAssignment.findMany({
    where: { teacherId: userId, class: { academicYear: { active: true } } },
    select: { classId: true },
  });
  const uniqueClassIds = [...new Set(myClassIds.map((a) => a.classId))];
  const myStudents = await prisma.enrollment.count({
    where: { classId: { in: uniqueClassIds }, status: "ACTIVE" },
  });

  const teacherAttendance = await prisma.attendanceRecord.findMany({
    where: { lesson: { teacherId: userId } },
    select: { status: true },
  });
  const teacherPresent = teacherAttendance.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
  const teacherRate = teacherAttendance.length > 0 ? Math.round((teacherPresent / teacherAttendance.length) * 100) : 100;

  return (
    <div className="space-y-5 sm:space-y-6">
      {Header}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Alunos" value={myStudents} icon={Users} tint="var(--tint-blue)" description="que lecciono" />
        <StatCard title="Sumários" value={pendingLessons} icon={ClipboardList} tint="var(--tint-orange)" description="por registar" />
        <StatCard title="Presenças" value={`${teacherRate}%`} icon={CheckCircle} tint="var(--tint-green)" description="média geral" />
        <StatCard title="Justificações" value={pendingJustifications} icon={AlertCircle} tint={pendingJustifications > 0 ? "var(--tint-red)" : "var(--tint-gray)"} description="pendentes" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        <PanelCard title="Aulas de hoje">
          {todayLessons.length === 0 ? (
            <p className="text-[13px] text-[var(--muted-foreground)] py-4 text-center">Sem aulas hoje.</p>
          ) : (
            <ul className="space-y-1.5">
              {todayLessons.map((l) => {
                const registered = l.attendanceRecords.length > 0;
                const hasSummary = !!l.summary;
                const now = new Date();
                const nowHM = format(now, "HH:mm");
                const isNow =
                  l.startTime <= nowHM && nowHM <= l.endTime &&
                  new Date(l.date).toDateString() === now.toDateString();
                return (
                  <li key={l.id}>
                    <Link
                      href={`/dashboard/lessons/${l.id}`}
                      className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-[8px] hover:bg-[var(--muted)]"
                    >
                      <div className="text-[11px] font-semibold text-[var(--muted-foreground)] tabular-nums shrink-0 w-12">
                        {l.startTime}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium truncate">{l.subject.name}</p>
                        <p className="text-[11px] text-[var(--muted-foreground)] truncate">
                          {l.class.name}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                          isNow ? "bg-[rgba(0,122,255,0.16)] text-[#0064d2]"
                          : registered && hasSummary ? "bg-[rgba(52,199,89,0.16)] text-[#1d8a3a]"
                          : "bg-[rgba(255,149,0,0.18)] text-[#b86b00]"
                        }`}
                      >
                        {isNow ? "Agora" : registered && hasSummary ? "Registado" : "Pendente"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </PanelCard>

        <PanelCard title="Atalhos">
          <QuickActions
            actions={[
              { label: "Registar sumário", href: "/dashboard/lessons/new", icon: ClipboardList, tint: "var(--tint-indigo)" },
              { label: "Marcar presenças", href: "/dashboard/attendance",  icon: CheckCircle,   tint: "var(--tint-green)"  },
              { label: "Ver horário",      href: "/dashboard/schedule",    icon: Calendar,      tint: "var(--tint-red)"    },
              { label: "Lançar notas",     href: "/dashboard/modules",     icon: BarChart3,     tint: "var(--tint-pink)"   },
            ]}
          />
        </PanelCard>
      </div>

      <PanelCard title="Últimos sumários">
        {recentLessons.length === 0 ? (
          <p className="text-[13px] text-[var(--muted-foreground)] py-4 text-center">Sem aulas registadas.</p>
        ) : (
          <ul className="space-y-1.5">
            {recentLessons.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/dashboard/lessons/${l.id}`}
                  className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-[8px] hover:bg-[var(--muted)]"
                >
                  <FileText className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium truncate">{l.subject.name}</p>
                    <p className="text-[11px] text-[var(--muted-foreground)] truncate">
                      {l.class.name} · {format(new Date(l.date), "d MMM", { locale: pt })} · {l.startTime}–{l.endTime}
                    </p>
                  </div>
                  {!l.summary && (
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[rgba(255,149,0,0.18)] text-[#b86b00] shrink-0">
                      Pendente
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PanelCard>
    </div>
  );
}
