import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, BookOpen, GraduationCap, ClipboardList,
  TrendingUp, AlertCircle, Calendar, CheckCircle,
} from "lucide-react";
import { hasRole } from "@/lib/permissions";
import { MODULE_STATUS_LABELS, MODULE_STATUS_COLORS } from "@/lib/permissions";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: userId, role, schoolId } = session.user;

  // ─── Admin / Staff Dashboard ──────────────────────────────────────────────
  if (hasRole(role, Role.TEACHER)) {
    const [totalStudents, totalClasses, totalCourses, recentLessons, pendingJustifications] =
      await Promise.all([
        prisma.user.count({ where: { schoolId, role: Role.STUDENT, active: true } }),
        prisma.class.count({
          where: { course: { schoolId }, academicYear: { active: true } },
        }),
        prisma.course.count({ where: { schoolId, active: true } }),
        prisma.lesson.findMany({
          where: { teacher: { schoolId } },
          orderBy: { date: "desc" },
          take: 5,
          include: { subject: true, class: true },
        }),
        hasRole(role, Role.CLASS_DIRECTOR)
          ? prisma.absenceJustification.count({
              where: {
                status: "PENDING",
                attendanceRecord: { lesson: { class: { classDirectorId: userId } } },
              },
            })
          : Promise.resolve(0),
      ]);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Alunos" value={totalStudents} icon={Users} description="matriculados ativos" />
          <StatCard title="Turmas" value={totalClasses} icon={GraduationCap} description="ano letivo atual" />
          <StatCard title="Cursos" value={totalCourses} icon={BookOpen} description="cursos ativos" />
          <StatCard
            title="Justificações"
            value={pendingJustifications}
            icon={AlertCircle}
            description="pendentes de aprovação"
            iconClassName={pendingJustifications > 0 ? "bg-orange-50" : undefined}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Últimas Aulas Registadas</CardTitle>
            </CardHeader>
            <CardContent>
              {recentLessons.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma aula registada.</p>
              ) : (
                <ul className="space-y-3">
                  {recentLessons.map((lesson) => (
                    <li key={lesson.id} className="flex items-start gap-3 text-sm">
                      <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                      <div>
                        <p className="font-medium">{lesson.subject.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {lesson.class.name} · {format(new Date(lesson.date), "d MMM", { locale: pt })} · {lesson.startTime}–{lesson.endTime}
                        </p>
                        {lesson.summary && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{lesson.summary}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acesso Rápido</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {[
                { label: "Registar Sumário", href: "/dashboard/lessons/new", icon: ClipboardList },
                { label: "Marcar Presenças", href: "/dashboard/attendance", icon: CheckCircle },
                { label: "Ver Horário", href: "/dashboard/schedule", icon: Calendar },
                { label: "Progresso Módulos", href: "/dashboard/modules", icon: TrendingUp },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center gap-1 rounded-lg border p-3 text-center text-sm hover:bg-gray-50 transition-colors"
                >
                  <item.icon className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-xs">{item.label}</span>
                </a>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Student Dashboard ────────────────────────────────────────────────────
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: userId, status: "ACTIVE" },
    include: {
      class: {
        include: {
          course: { include: { subjects: { include: { modules: true } } } },
          academicYear: true,
        },
      },
    },
  });

  const moduleProgress = await prisma.studentModuleProgress.findMany({
    where: { studentId: userId },
    include: { module: { include: { subject: true } } },
  });

  const recentAttendance = await prisma.attendanceRecord.findMany({
    where: { studentId: userId },
    orderBy: { lesson: { date: "desc" } },
    take: 10,
    include: { lesson: { include: { subject: true } } },
  });

  const absences = recentAttendance.filter((r) => r.status === "ABSENT").length;
  const totalModules = enrollment?.class.course.subjects.reduce(
    (sum, s) => sum + s.modules.length, 0
  ) ?? 0;
  const completedModules = moduleProgress.filter(
    (p) => p.status === "APPROVED" || p.status === "COMPLETED"
  ).length;

  const notifications = await prisma.notificationRecipient.findMany({
    where: { recipientId: userId, readAt: null },
    include: { notification: true },
    take: 5,
    orderBy: { notification: { createdAt: "desc" } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Olá, {session.user.name.split(" ")[0]}!</h1>
        <p className="text-muted-foreground">
          {enrollment?.class.course.name ?? "Sem turma atribuída"} ·{" "}
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: pt })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Módulos Concluídos" value={`${completedModules}/${totalModules}`} icon={CheckCircle} />
        <StatCard title="Faltas Recentes" value={absences} icon={AlertCircle} description="últimas 10 aulas" />
        <StatCard title="Progresso" value={`${totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0}%`} icon={TrendingUp} description="do curso concluído" />
        <StatCard title="Avisos" value={notifications.length} icon={ClipboardList} description="não lidos" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progresso nos Módulos</CardTitle>
          </CardHeader>
          <CardContent>
            {moduleProgress.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem progresso registado.</p>
            ) : (
              <ul className="space-y-2">
                {moduleProgress.slice(0, 6).map((p) => (
                  <li key={p.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{p.module.subject.name}</span>
                      <span className="text-muted-foreground"> · Módulo {p.module.number}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.grade != null && (
                        <span className="font-mono text-xs font-semibold">{p.grade.toFixed(0)}/20</span>
                      )}
                      <Badge className={MODULE_STATUS_COLORS[p.status]} variant="secondary">
                        {MODULE_STATUS_LABELS[p.status]}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Avisos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem avisos novos.</p>
            ) : (
              <ul className="space-y-3">
                {notifications.map((n) => (
                  <li key={n.id} className="flex gap-3 text-sm">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    <div>
                      <p className="font-medium">{n.notification.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{n.notification.content}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
