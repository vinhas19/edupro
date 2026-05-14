import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import Link from "next/link";
import { Plus, BookOpen, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CoursesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.TEACHER)) redirect("/dashboard");

  const courses = await prisma.course.findMany({
    where: { schoolId: session.user.schoolId, active: true },
    include: {
      director: { select: { name: true } },
      subjects: true,
      classes: {
        where: { academicYear: { active: true } },
        include: { enrollments: { where: { status: "ACTIVE" } } },
      },
    },
    orderBy: { name: "asc" },
  });

  const isAdmin = hasRole(session.user.role, Role.SCHOOL_ADMIN);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cursos Profissionais</h1>
          <p className="text-muted-foreground">{courses.length} cursos ativos</p>
        </div>
        {isAdmin && (
          <Button asChild>
            <Link href="/dashboard/courses/new">
              <Plus className="mr-2 h-4 w-4" />
              Novo Curso
            </Link>
          </Button>
        )}
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="font-medium">Nenhum curso criado</p>
            <p className="text-sm text-muted-foreground">Comece por adicionar um curso profissional.</p>
            {isAdmin && (
              <Button asChild className="mt-4">
                <Link href="/dashboard/courses/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Curso
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => {
            const totalStudents = course.classes.reduce(
              (s, c) => s + c.enrollments.length, 0
            );
            return (
              <Link key={course.id} href={`/dashboard/courses/${course.id}`}>
                <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-tight">{course.name}</CardTitle>
                      <Badge variant="outline" className="shrink-0">Nível {course.level}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{course.code} · {course.formationArea}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {course.totalHours}h
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        {course.subjects.length} disciplinas
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {totalStudents} alunos
                      </span>
                    </div>
                    {course.director && (
                      <p className="text-xs text-muted-foreground">
                        Diretor: {course.director.name}
                      </p>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      {course.classes.map((cls) => (
                        <Badge key={cls.id} variant="secondary" className="text-xs">
                          {cls.name} · {cls.enrollments.length} alunos
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
