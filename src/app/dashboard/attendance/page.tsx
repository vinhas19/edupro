import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role, AttendanceStatus } from "@prisma/client";
import { hasRole, ATTENDANCE_LABELS } from "@/lib/permissions";
import { calcAbsenceLimit, getAbsenceRisk } from "@/lib/attendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { AttendanceRegisterButton } from "@/components/attendance/attendance-register-button";

const STATUS_ICONS = {
  PRESENT: <CheckCircle className="h-3.5 w-3.5 text-green-500" />,
  ABSENT: <XCircle className="h-3.5 w-3.5 text-red-500" />,
  JUSTIFIED: <Clock className="h-3.5 w-3.5 text-yellow-500" />,
  LATE: <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />,
} as const;

export default async function AttendancePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: userId, role, schoolId } = session.user;

  // ─── Student View ────────────────────────────────────────────────────────
  if (!hasRole(role, Role.TEACHER)) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: userId, status: "ACTIVE" },
      include: { class: { include: { course: { include: { subjects: true } } } } },
    });

    if (!enrollment) {
      return (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Assiduidade</h1>
          <Card><CardContent className="py-8 text-center text-muted-foreground">Sem turma atribuída.</CardContent></Card>
        </div>
      );
    }

    const records = await prisma.attendanceRecord.findMany({
      where: { studentId: userId },
      include: {
        lesson: { include: { subject: true } },
        justification: true,
      },
      orderBy: { lesson: { date: "desc" } },
    });

    // Group by subject
    const subjectRecords = new Map<string, { name: string; hours: number; records: typeof records }>();
    enrollment.class.course.subjects.forEach((s) => {
      subjectRecords.set(s.id, { name: s.name, hours: s.totalHours, records: [] });
    });
    records.forEach((r) => {
      const subjectId = r.lesson.subjectId;
      const entry = subjectRecords.get(subjectId);
      if (entry) entry.records.push(r);
    });

    const totalAbsences = records.filter((r) => r.status === "ABSENT").length;
    const totalPresent = records.filter((r) => r.status === "PRESENT").length;
    const totalLessons = records.length;

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">A Minha Assiduidade</h1>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <div><p className="text-xl font-bold">{totalPresent}</p><p className="text-xs text-muted-foreground">Presenças</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <XCircle className="h-6 w-6 text-red-500" />
              <div><p className="text-xl font-bold">{totalAbsences}</p><p className="text-xs text-muted-foreground">Faltas</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-6">
              <Clock className="h-6 w-6 text-blue-500" />
              <div>
                <p className="text-xl font-bold">
                  {totalLessons > 0 ? Math.round((totalPresent / totalLessons) * 100) : 100}%
                </p>
                <p className="text-xs text-muted-foreground">Assiduidade</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {Array.from(subjectRecords.values()).map((data) => {
          if (!data.records.length) return null;
          const absences = data.records.filter((r) => r.status === "ABSENT").length;
          const present = data.records.filter((r) => r.status === "PRESENT").length;
          const total = data.records.length;
          const limit = calcAbsenceLimit(data.hours, 0.1);
          const risk = getAbsenceRisk(absences, data.hours, 0.1);

          return (
            <Card key={data.name}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{data.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    {risk === "exceeded" && (
                      <Badge variant="destructive" className="text-xs">Limite excedido</Badge>
                    )}
                    {risk === "warning" && (
                      <Badge className="bg-orange-100 text-orange-700 text-xs">Em risco</Badge>
                    )}
                    <span className="text-sm text-muted-foreground">{absences}/{limit} faltas</span>
                  </div>
                </div>
                <Progress
                  value={total > 0 ? (present / total) * 100 : 100}
                  className="h-1.5 mt-2"
                />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {data.records.slice(0, 8).map((r) => (
                    <div key={r.id} className="flex items-center gap-3 text-sm py-1 border-b last:border-0">
                      {STATUS_ICONS[r.status as AttendanceStatus]}
                      <span className="text-muted-foreground text-xs">
                        {format(new Date(r.lesson.date), "dd/MM/yyyy", { locale: pt })}
                      </span>
                      <span className="text-xs text-muted-foreground">{r.lesson.startTime}</span>
                      <Badge variant="outline" className="text-xs ml-auto">
                        {ATTENDANCE_LABELS[r.status as AttendanceStatus]}
                      </Badge>
                      {r.justification && (
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            r.justification.status === "APPROVED"
                              ? "bg-green-100 text-green-700"
                              : r.justification.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {r.justification.status === "APPROVED" ? "Justificada" : r.justification.status === "PENDING" ? "Pendente" : "Rejeitada"}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // ─── Teacher View — select lesson to register attendance ─────────────────
  const todayLessons = await prisma.lesson.findMany({
    where: {
      teacherId: userId,
      date: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
        lte: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    },
    include: {
      class: { include: { enrollments: { where: { status: "ACTIVE" }, include: { student: { select: { id: true, name: true } } } } } },
      subject: true,
      attendanceRecords: { include: { justification: true } },
    },
    orderBy: { startTime: "asc" },
  });

  // Pending justifications for class directors
  const pendingJustifications = hasRole(role, Role.CLASS_DIRECTOR)
    ? await prisma.absenceJustification.findMany({
        where: {
          status: "PENDING",
          attendanceRecord: {
            lesson: { class: { classDirectorId: userId } },
          },
        },
        include: {
          attendanceRecord: {
            include: {
              student: { select: { name: true } },
              lesson: { include: { subject: true } },
            },
          },
        },
        take: 10,
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Assiduidade</h1>
        <p className="text-muted-foreground">
          Aulas de hoje — {format(new Date(), "EEEE, d 'de' MMMM", { locale: pt })}
        </p>
      </div>

      {/* Today's lessons */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold">Aulas de Hoje</h2>
        {todayLessons.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Sem aulas registadas para hoje.
            </CardContent>
          </Card>
        ) : (
          todayLessons.map((lesson) => {
            const students = lesson.class.enrollments.map((e) => e.student);
            const registered = lesson.attendanceRecords.length;
            const allRegistered = registered === students.length;

            return (
              <Card key={lesson.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{lesson.subject.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {lesson.class.name} · {lesson.startTime}–{lesson.endTime}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {allRegistered ? (
                        <Badge className="bg-green-100 text-green-700">Completo</Badge>
                      ) : (
                        <Badge variant="secondary">{registered}/{students.length}</Badge>
                      )}
                      <AttendanceRegisterButton lessonId={lesson.id} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {students.map((student) => {
                      const record = lesson.attendanceRecords.find((r) => r.studentId === student.id);
                      return (
                        <div key={student.id} className="flex items-center gap-2 rounded border px-2 py-1.5 text-xs">
                          {record ? STATUS_ICONS[record.status as AttendanceStatus] : <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-300" />}
                          <span className="truncate">{student.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pending justifications */}
      {pendingJustifications.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Justificações Pendentes ({pendingJustifications.length})
          </h2>
          <div className="space-y-2">
            {pendingJustifications.map((j) => (
              <Card key={j.id}>
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{j.attendanceRecord.student.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {j.attendanceRecord.lesson.subject.name} ·{" "}
                      {format(new Date(j.attendanceRecord.lesson.date), "dd/MM/yyyy")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{j.reason}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 text-xs">Pendente</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
