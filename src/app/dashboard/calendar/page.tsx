import { Fragment } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ClipboardList, UserX, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isToday, isSameMonth } from "date-fns";
import { pt } from "date-fns/locale";

const DAY_HEADERS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: userId, role, schoolId } = session.user;
  const params = await searchParams;
  const cursor = params.month ? new Date(params.month + "-01") : new Date();
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);

  // Days grid: from start of month back to previous Sunday, until end of month forward to next Saturday
  const firstWeekday = getDay(monthStart); // 0=Sun..6=Sat
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - firstWeekday);
  const lastWeekday = getDay(monthEnd);
  const gridEnd = new Date(monthEnd);
  gridEnd.setDate(monthEnd.getDate() + (6 - lastWeekday));
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // Fetch events for the visible range
  const isStaff = hasRole(role, Role.TEACHER);

  // Assignments (with dueDate) the user can see
  const assignments = await prisma.classroomPost.findMany({
    where: {
      type: "ASSIGNMENT",
      dueDate: { gte: gridStart, lte: gridEnd },
      class: isStaff
        ? {
            course: { schoolId },
            ...(role === Role.TEACHER || role === Role.CLASS_DIRECTOR
              ? {
                  OR: [
                    { classDirectorId: userId },
                    { subjectAssignments: { some: { teacherId: userId } } },
                  ],
                }
              : {}),
          }
        : {
            enrollments: { some: { studentId: userId, status: "ACTIVE" } },
          },
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      classId: true,
      class: { select: { name: true } },
    },
  });

  // Teacher absences (only staff can see)
  const absences = isStaff
    ? await prisma.teacherAbsence.findMany({
        where: {
          teacher: { schoolId },
          date: { gte: gridStart, lte: gridEnd },
        },
        select: {
          id: true,
          date: true,
          teacher: { select: { name: true } },
        },
      })
    : [];

  // Map by date string
  type Event = { type: "ASSIGNMENT" | "ABSENCE"; label: string; href: string };
  const eventsByDay = new Map<string, Event[]>();
  for (const a of assignments) {
    if (!a.dueDate) continue;
    const k = format(a.dueDate, "yyyy-MM-dd");
    if (!eventsByDay.has(k)) eventsByDay.set(k, []);
    eventsByDay.get(k)!.push({
      type: "ASSIGNMENT",
      label: a.title ?? "Trabalho",
      href: `/dashboard/classes/${a.classId}`,
    });
  }
  for (const ab of absences) {
    const k = format(ab.date, "yyyy-MM-dd");
    if (!eventsByDay.has(k)) eventsByDay.set(k, []);
    eventsByDay.get(k)!.push({
      type: "ABSENCE",
      label: ab.teacher.name,
      href: "/dashboard/substitutions",
    });
  }

  const prevMonth = format(subMonths(cursor, 1), "yyyy-MM");
  const nextMonth = format(addMonths(cursor, 1), "yyyy-MM");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendário</h1>
          <p className="text-muted-foreground capitalize">
            {format(cursor, "MMMM 'de' yyyy", { locale: pt })}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/dashboard/calendar?month=${prevMonth}`}><ChevronLeft className="h-4 w-4" /></Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/calendar">Hoje</Link>
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link href={`/dashboard/calendar?month=${nextMonth}`}><ChevronRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {DAY_HEADERS.map((h) => (
              <div key={h} className="bg-gray-50 text-center text-xs font-semibold py-2 text-muted-foreground">
                {h}
              </div>
            ))}
            {days.map((d) => {
              const key = format(d, "yyyy-MM-dd");
              const events = eventsByDay.get(key) ?? [];
              const inMonth = isSameMonth(d, cursor);
              return (
                <div
                  key={key}
                  className={`bg-white min-h-[100px] p-1.5 ${!inMonth ? "opacity-40" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-medium ${
                        isToday(d) ? "bg-blue-600 text-white rounded-full h-5 w-5 flex items-center justify-center" : ""
                      }`}
                    >
                      {format(d, "d")}
                    </span>
                  </div>
                  <div className="space-y-1 mt-1">
                    {events.slice(0, 3).map((e, i) => (
                      <Link
                        key={i}
                        href={e.href}
                        className={`block truncate rounded px-1 py-0.5 text-[10px] ${
                          e.type === "ASSIGNMENT"
                            ? "bg-orange-100 text-orange-800 hover:bg-orange-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}
                      >
                        {e.type === "ASSIGNMENT" ? "📝 " : "⚠ "}{e.label}
                      </Link>
                    ))}
                    {events.length > 3 && (
                      <p className="text-[10px] text-muted-foreground px-1">+{events.length - 3}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-orange-200"></div>
          <span className="text-muted-foreground">Prazos de trabalhos</span>
        </div>
        {isStaff && (
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-red-200"></div>
            <span className="text-muted-foreground">Ausências de professores</span>
          </div>
        )}
      </div>
    </div>
  );
}
