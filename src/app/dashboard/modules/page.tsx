import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole, MODULE_STATUS_LABELS, MODULE_STATUS_COLORS, COMPONENT_LABELS } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, AlertCircle, TrendingUp } from "lucide-react";
import { ModuleProgressTable } from "@/components/modules/module-progress-table";

export default async function ModulesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: userId, role, schoolId } = session.user;

  // Student view
  if (!hasRole(role, Role.TEACHER)) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: userId, status: "ACTIVE" },
      include: {
        class: {
          include: {
            course: {
              include: {
                subjects: {
                  include: {
                    modules: { orderBy: { order: "asc" } },
                  },
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
          <h1 className="text-2xl font-bold">Módulos</h1>
          <Card><CardContent className="py-8 text-center text-muted-foreground">Sem turma atribuída.</CardContent></Card>
        </div>
      );
    }

    const progress = await prisma.studentModuleProgress.findMany({
      where: { studentId: userId },
      include: { module: true, evaluations: { orderBy: { date: "desc" } } },
    });
    const progressMap = new Map(progress.map((p) => [p.moduleId, p]));

    const course = enrollment.class.course;
    const allModules = course.subjects.flatMap((s) => s.modules);
    const totalModules = allModules.length;
    const approved = progress.filter((p) => ["APPROVED", "COMPLETED"].includes(p.status)).length;
    const inProgress = progress.filter((p) => p.status === "IN_PROGRESS").length;
    const failed = progress.filter((p) => ["FAILED", "RECURSO"].includes(p.status)).length;
    const pct = totalModules > 0 ? Math.round((approved / totalModules) * 100) : 0;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Os Meus Módulos</h1>
          <p className="text-muted-foreground">{course.name}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <div><p className="text-xl font-bold">{approved}</p><p className="text-xs text-muted-foreground">Aprovados</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <Clock className="h-6 w-6 text-blue-500" />
              <div><p className="text-xl font-bold">{inProgress}</p><p className="text-xs text-muted-foreground">Em Curso</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <div><p className="text-xl font-bold">{failed}</p><p className="text-xs text-muted-foreground">Em Recurso</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <TrendingUp className="h-6 w-6 text-purple-500" />
              <div><p className="text-xl font-bold">{pct}%</p><p className="text-xs text-muted-foreground">Concluído</p></div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Progresso Geral</CardTitle>
              <span className="text-sm text-muted-foreground">{approved}/{totalModules} módulos</span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={pct} className="h-3" />
          </CardContent>
        </Card>

        {course.subjects.map((subject) => {
          const subjectModules = subject.modules;
          const subjectApproved = subjectModules.filter((m) => {
            const p = progressMap.get(m.id);
            return p && ["APPROVED", "COMPLETED"].includes(p.status);
          }).length;

          return (
            <Card key={subject.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{subject.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {COMPONENT_LABELS[subject.component]} · {subject.totalHours}h
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {subjectApproved}/{subjectModules.length}
                  </Badge>
                </div>
                <Progress
                  value={subjectModules.length > 0 ? (subjectApproved / subjectModules.length) * 100 : 0}
                  className="h-1.5 mt-2"
                />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {subjectModules.map((mod) => {
                    const p = progressMap.get(mod.id);
                    const status = p?.status ?? "NOT_STARTED";
                    const grade = p?.grade;
                    return (
                      <div key={mod.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                        <div>
                          <span className="font-medium">Módulo {mod.number}</span>
                          <span className="text-muted-foreground"> — {mod.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">({mod.hours}h)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {grade != null && (
                            <span className="font-mono text-sm font-semibold">
                              {grade.toFixed(0)}/20
                            </span>
                          )}
                          <Badge className={MODULE_STATUS_COLORS[status]} variant="secondary">
                            {MODULE_STATUS_LABELS[status]}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // Teacher/Admin view — see all classes
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
      course: true,
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          student: {
            include: {
              moduleProgress: {
                include: { module: { include: { subject: true } } },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Progresso nos Módulos</h1>
      {classes.map((cls) => (
        <ModuleProgressTable key={cls.id} classData={cls} />
      ))}
    </div>
  );
}
