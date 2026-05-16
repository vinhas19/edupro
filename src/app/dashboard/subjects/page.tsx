import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole, isTeachingRole, COMPONENT_LABELS } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Users, Plus, Pencil } from "lucide-react";
import Link from "next/link";

export default async function SubjectsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.TEACHER)) redirect("/dashboard");

  const { id: userId, role, schoolId } = session.user;

  const subjects = await prisma.subject.findMany({
    where: {
      course: { schoolId },
      // Profs e DTs só veem as disciplinas que lecionam; admins/dir.curso veem tudo
      ...(isTeachingRole(role) && !hasRole(role, Role.COURSE_DIRECTOR)
        ? { subjectAssignments: { some: { teacherId: userId } } }
        : {}),
    },
    include: {
      course: { select: { name: true, code: true } },
      modules: { orderBy: { order: "asc" } },
      subjectAssignments: {
        include: {
          teacher: { select: { name: true } },
          class: { select: { name: true } },
        },
      },
    },
    orderBy: [{ course: { name: "asc" } }, { order: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.022em]">Disciplinas</h1>
          <p className="text-muted-foreground text-sm">{subjects.length} disciplinas</p>
        </div>
        {hasRole(role, Role.SCHOOL_ADMIN) && (
          <Button size="sm" asChild>
            <Link href="/dashboard/subjects/new">
              <Plus className="mr-1.5 h-3.5 w-3.5" />Nova disciplina
            </Link>
          </Button>
        )}
      </div>

      {subjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="font-medium">Sem disciplinas</p>
            <p className="text-sm text-muted-foreground">
              {hasRole(role, Role.SCHOOL_ADMIN)
                ? "Crie a primeira disciplina para começar."
                : "Não tem disciplinas atribuídas."}
            </p>
            {hasRole(role, Role.SCHOOL_ADMIN) && (
              <Button size="sm" asChild className="mt-4">
                <Link href="/dashboard/subjects/new">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />Nova disciplina
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {subjects.map((subject) => (
            <Card key={subject.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{subject.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <Link href={`/dashboard/courses/${subject.courseId}`} className="hover:underline">
                        {subject.course.name} ({subject.course.code})
                      </Link>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {COMPONENT_LABELS[subject.component]}
                    </Badge>
                    {hasRole(role, Role.SCHOOL_ADMIN) && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <Link href={`/dashboard/subjects/${subject.id}/edit`} aria-label="Editar disciplina">
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {subject.totalHours}h
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {subject.modules.length} módulos
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {subject.subjectAssignments.length} turmas
                  </span>
                </div>

                {subject.modules.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {subject.modules.map((m) => (
                      <Badge key={m.id} variant="outline" className="font-mono text-xs">
                        M{m.number} — {m.name} ({m.hours}h)
                      </Badge>
                    ))}
                  </div>
                )}

                {subject.subjectAssignments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t">
                    {subject.subjectAssignments.map((a) => (
                      <Badge key={a.id} variant="secondary" className="text-xs">
                        {a.teacher.name} · {a.class.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
