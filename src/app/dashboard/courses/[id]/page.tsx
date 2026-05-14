import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole, COMPONENT_LABELS } from "@/lib/permissions";
import Link from "next/link";
import { ArrowLeft, Plus, Users, BookOpen, Clock, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.TEACHER)) redirect("/dashboard");

  const course = await prisma.course.findFirst({
    where: { id, schoolId: session.user.schoolId },
    include: {
      director: { select: { id: true, name: true, email: true } },
      subjects: {
        include: {
          modules: { orderBy: { order: "asc" } },
          subjectAssignments: {
            include: { teacher: { select: { name: true } } },
          },
        },
        orderBy: { order: "asc" },
      },
      classes: {
        include: {
          classDirector: { select: { name: true } },
          academicYear: true,
          enrollments: {
            where: { status: "ACTIVE" },
            include: { student: { select: { id: true, name: true, email: true } } },
          },
        },
        orderBy: { year: "asc" },
      },
    },
  });

  if (!course) notFound();

  const isAdmin = hasRole(session.user.role, Role.SCHOOL_ADMIN);
  const componentGroups = {
    SOCIOCULTURAL: course.subjects.filter((s) => s.component === "SOCIOCULTURAL"),
    SCIENTIFIC: course.subjects.filter((s) => s.component === "SCIENTIFIC"),
    TECHNICAL: course.subjects.filter((s) => s.component === "TECHNICAL"),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/courses"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{course.name}</h1>
            <Badge variant="outline">Nível {course.level}</Badge>
          </div>
          <p className="text-muted-foreground">{course.code} · {course.formationArea}</p>
        </div>
        {isAdmin && (
          <Button variant="outline" asChild>
            <Link href={`/dashboard/courses/${course.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />Editar
            </Link>
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Clock className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{course.totalHours}h</p>
              <p className="text-xs text-muted-foreground">Carga horária total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <BookOpen className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{course.subjects.length}</p>
              <p className="text-xs text-muted-foreground">Disciplinas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Users className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">
                {course.classes.reduce((s, c) => s + c.enrollments.length, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Alunos matriculados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subjects">
        <TabsList>
          <TabsTrigger value="subjects">Disciplinas</TabsTrigger>
          <TabsTrigger value="classes">Turmas</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="space-y-4 mt-4">
          {(["SOCIOCULTURAL", "SCIENTIFIC", "TECHNICAL"] as const).map((comp) => {
            const subjects = componentGroups[comp];
            if (!subjects.length) return null;
            return (
              <Card key={comp}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {COMPONENT_LABELS[comp]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {subjects.map((subject) => (
                      <div key={subject.id} className="py-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{subject.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {subject.totalHours}h total · {subject.modules.length} módulos
                              {subject.subjectAssignments[0] && (
                                <> · Prof. {subject.subjectAssignments[0].teacher.name}</>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {subject.modules.map((m) => (
                              <Badge key={m.id} variant="outline" className="font-mono text-xs">
                                M{m.number} ({m.hours}h)
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {isAdmin && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/subjects/new?courseId=${course.id}`}>
                <Plus className="mr-2 h-4 w-4" />Adicionar Disciplina
              </Link>
            </Button>
          )}
        </TabsContent>

        <TabsContent value="classes" className="space-y-4 mt-4">
          {course.classes.map((cls) => (
            <Card key={cls.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{cls.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{cls.academicYear.label}</Badge>
                    <Badge variant="outline">{cls.year}º Ano</Badge>
                  </div>
                </div>
                {cls.classDirector && (
                  <p className="text-xs text-muted-foreground">
                    Dir. Turma: {cls.classDirector.name}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">{cls.enrollments.length} alunos matriculados</p>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/classes/${cls.id}`}>Ver turma →</Link>
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {cls.enrollments.slice(0, 8).map((e) => (
                    <Badge key={e.id} variant="outline" className="text-xs">
                      {e.student.name}
                    </Badge>
                  ))}
                  {cls.enrollments.length > 8 && (
                    <Badge variant="outline" className="text-xs">
                      +{cls.enrollments.length - 8} mais
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {isAdmin && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/classes/new?courseId=${course.id}`}>
                <Plus className="mr-2 h-4 w-4" />Nova Turma
              </Link>
            </Button>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
