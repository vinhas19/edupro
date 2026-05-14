import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole, COMPONENT_LABELS } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Users } from "lucide-react";
import Link from "next/link";

export default async function SubjectsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.TEACHER)) redirect("/dashboard");

  const { id: userId, role, schoolId } = session.user;

  const subjects = await prisma.subject.findMany({
    where: {
      course: { schoolId },
      ...(role === Role.TEACHER
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
      <div>
        <h1 className="text-2xl font-bold">Disciplinas</h1>
        <p className="text-muted-foreground">{subjects.length} disciplinas</p>
      </div>

      {subjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="font-medium">Sem disciplinas</p>
            <p className="text-sm text-muted-foreground">Não tem disciplinas atribuídas.</p>
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
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {COMPONENT_LABELS[subject.component]}
                  </Badge>
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
