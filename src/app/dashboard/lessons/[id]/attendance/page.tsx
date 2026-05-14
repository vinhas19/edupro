import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { AttendanceForm } from "@/components/attendance/attendance-form";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function LessonAttendancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role } = session.user;
  if (!hasRole(role, Role.TEACHER)) redirect("/dashboard");

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: {
      subject: { select: { name: true } },
      class: {
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            include: {
              student: { select: { id: true, name: true, email: true } },
            },
            orderBy: { student: { name: "asc" } },
          },
        },
      },
      attendanceRecords: {
        include: {
          student: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!lesson) notFound();

  const students = lesson.class.enrollments.map((e) => e.student);
  const existingRecords = Object.fromEntries(
    lesson.attendanceRecords.map((r) => [r.studentId, r.status])
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/lessons">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Registo de Presenças</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
            <Badge variant="outline">{lesson.subject.name}</Badge>
            <span>·</span>
            <span>{lesson.class.name}</span>
            <span>·</span>
            <Clock className="h-3.5 w-3.5" />
            <span>
              {format(new Date(lesson.date), "EEEE, d 'de' MMMM", { locale: pt })}
              {" "}
              {lesson.startTime}–{lesson.endTime}
            </span>
          </div>
        </div>
      </div>

      <AttendanceForm
        lessonId={id}
        students={students}
        existingRecords={existingRecords}
      />
    </div>
  );
}
