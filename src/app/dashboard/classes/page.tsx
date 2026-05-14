import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Users, GraduationCap } from "lucide-react";
import Link from "next/link";

export default async function ClassesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role, schoolId, id: userId } = session.user;
  if (!hasRole(role, Role.TEACHER)) redirect("/dashboard");

  const canManage = hasRole(role, Role.CLASS_DIRECTOR);

  const whereClause =
    role === Role.TEACHER
      ? {
          academicYear: { schoolId, active: true },
          subjectAssignments: { some: { teacherId: userId } },
        }
      : role === Role.CLASS_DIRECTOR
      ? {
          academicYear: { schoolId, active: true },
          classDirectorId: userId,
        }
      : { academicYear: { schoolId, active: true } };

  const classes = await prisma.class.findMany({
    where: whereClause,
    include: {
      course: { select: { name: true, code: true } },
      academicYear: { select: { label: true } },
      _count: {
        select: { enrollments: true, lessons: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Turmas</h1>
          <p className="text-muted-foreground">{classes.length} turma{classes.length !== 1 ? "s" : ""}</p>
        </div>
        {hasRole(role, Role.SCHOOL_ADMIN) && (
          <Button asChild>
            <Link href="/dashboard/classes/new">
              <Plus className="mr-2 h-4 w-4" />
              Nova Turma
            </Link>
          </Button>
        )}
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="font-medium">Sem turmas</p>
            <p className="text-sm text-muted-foreground">Não tem turmas atribuídas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls) => (
            <Link key={cls.id} href={`/dashboard/classes/${cls.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-lg font-bold">{cls.name}</p>
                      <p className="text-sm text-muted-foreground">{cls.course.name}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{cls.course.code}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <span>{cls._count.enrollments} alunos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{cls._count.lessons} aulas</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{cls.academicYear.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
