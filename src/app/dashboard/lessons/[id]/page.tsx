import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role, AttendanceStatus } from "@prisma/client";
import { hasRole, ATTENDANCE_LABELS } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, Users, ClipboardList, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const STATUS_ICONS = {
  PRESENT: <CheckCircle className="h-3.5 w-3.5 text-green-500" />,
  ABSENT: <XCircle className="h-3.5 w-3.5 text-red-500" />,
  JUSTIFIED: <Clock className="h-3.5 w-3.5 text-yellow-500" />,
  LATE: <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />,
} as const;

export default async function LessonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.TEACHER)) redirect("/dashboard");

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      subject: true,
      class: { include: { enrollments: { where: { status: "ACTIVE" } } } },
      teacher: { select: { id: true, name: true } },
      attendanceRecords: {
        include: { student: { select: { id: true, name: true } } },
        orderBy: { student: { name: "asc" } },
      },
    },
  });

  if (!lesson) notFound();

  const totalStudents = lesson.class.enrollments.length;
  const recorded = lesson.attendanceRecords.length;
  const isOwner = lesson.teacherId === session.user.id;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/lessons"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{lesson.subject.name}</h1>
          <p className="text-muted-foreground text-sm">
            {lesson.class.name} · {format(new Date(lesson.date), "EEEE, d 'de' MMMM yyyy", { locale: pt })}
          </p>
        </div>
        {isOwner && (
          <Button asChild>
            <Link href={`/dashboard/lessons/${id}/attendance`}>
              <ClipboardList className="mr-2 h-4 w-4" />Marcar Presenças
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Calendar className="h-6 w-6 text-blue-500" />
            <div>
              <p className="text-sm font-semibold">{lesson.startTime}–{lesson.endTime}</p>
              <p className="text-xs text-muted-foreground">Horário</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Users className="h-6 w-6 text-purple-500" />
            <div>
              <p className="text-sm font-semibold">{recorded}/{totalStudents}</p>
              <p className="text-xs text-muted-foreground">Presenças marcadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <ClipboardList className="h-6 w-6 text-green-500" />
            <div>
              <p className="text-sm font-semibold">
                {lesson.lessonNumber ? `Aula nº ${lesson.lessonNumber}` : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Professor: {lesson.teacher.name}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sumário</CardTitle>
        </CardHeader>
        <CardContent>
          {lesson.summary ? (
            <p className="text-sm whitespace-pre-wrap">{lesson.summary}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">Sem sumário registado.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Presenças</CardTitle>
            <Badge variant="secondary">{recorded}/{totalStudents}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {lesson.attendanceRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem presenças registadas.</p>
          ) : (
            <ul className="space-y-1.5">
              {lesson.attendanceRecords.map((r) => (
                <li key={r.id} className="flex items-center gap-3 text-sm py-1.5 border-b last:border-0">
                  {STATUS_ICONS[r.status as AttendanceStatus]}
                  <span className="flex-1">{r.student.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {ATTENDANCE_LABELS[r.status as AttendanceStatus]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
