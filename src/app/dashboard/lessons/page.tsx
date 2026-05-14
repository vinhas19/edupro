import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import Link from "next/link";
import { Plus, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default async function LessonsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.TEACHER)) redirect("/dashboard");

  const { id: userId, role, schoolId } = session.user;

  const lessons = await prisma.lesson.findMany({
    where: {
      ...(role === Role.TEACHER
        ? { teacherId: userId }
        : { class: { course: { schoolId } } }),
    },
    include: {
      subject: true,
      class: true,
      attendanceRecords: { select: { id: true, status: true } },
    },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sumários</h1>
          <p className="text-muted-foreground">Registo de aulas lecionadas</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/lessons/new">
            <Plus className="mr-2 h-4 w-4" />
            Registar Aula
          </Link>
        </Button>
      </div>

      {lessons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="font-medium">Nenhuma aula registada</p>
            <p className="text-sm text-muted-foreground">Registe o sumário da primeira aula.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/lessons/new">
                <Plus className="mr-2 h-4 w-4" />Registar Aula
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {lessons.map((lesson) => {
            const absences = lesson.attendanceRecords.filter((r) => r.status === "ABSENT").length;
            const hasAttendance = lesson.attendanceRecords.length > 0;
            return (
              <Link key={lesson.id} href={`/dashboard/lessons/${lesson.id}`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-sm">
                  <CardContent className="flex items-center gap-4 py-3">
                    <div className="flex flex-col items-center text-center w-12 shrink-0">
                      <Calendar className="h-4 w-4 text-blue-500 mb-0.5" />
                      <p className="text-xs font-semibold">
                        {format(new Date(lesson.date), "dd/MM")}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{lesson.subject.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {lesson.class.name} · {lesson.startTime}–{lesson.endTime}
                        {lesson.lessonNumber && ` · Aula nº${lesson.lessonNumber}`}
                      </p>
                      {lesson.summary && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {lesson.summary}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!hasAttendance && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 text-xs">
                          Sem presenças
                        </Badge>
                      )}
                      {absences > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {absences} falta{absences !== 1 ? "s" : ""}
                        </Badge>
                      )}
                      {!lesson.summary && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 text-xs">
                          Sem sumário
                        </Badge>
                      )}
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
