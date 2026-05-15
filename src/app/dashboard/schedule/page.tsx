import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { ScheduleGrid } from "@/components/schedule/schedule-grid";
import { ClassFilter } from "@/components/schedule/class-filter";
import Link from "next/link";
import { Pencil, CalendarRange, Calendar, BookOpen, MapPin, Printer } from "lucide-react";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: userId, role, schoolId } = session.user;
  const { classId } = await searchParams;

  const [school, timeSlots] = await Promise.all([
    prisma.school.findUnique({
      where: { id: schoolId },
      select: { dayStart: true, dayEnd: true, blockMinutes: true, breakMinutes: true },
    }),
    prisma.timeSlot.findMany({
      where: { schoolId },
      orderBy: { order: "asc" },
      select: { startTime: true, endTime: true, label: true },
    }),
  ]);

  const include = {
    subject: { select: { id: true, name: true } },
    teacher: { select: { name: true } },
    room: { select: { name: true } },
    class: { select: { name: true } },
  } as const;

  let blocks: Awaited<ReturnType<typeof prisma.scheduleBlock.findMany>> = [];
  let viewMode: "student" | "teacher" | "admin" = "admin";
  let classes: { id: string; name: string; year: number; course: { code: string } }[] = [];

  if (role === Role.STUDENT) {
    viewMode = "student";
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: userId, status: "ACTIVE" },
    });
    if (enrollment) {
      blocks = await prisma.scheduleBlock.findMany({
        where: { classId: enrollment.classId },
        include,
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      });
    }
  } else if (role === Role.TEACHER && !classId) {
    viewMode = "teacher";
    blocks = await prisma.scheduleBlock.findMany({
      where: { teacherId: userId },
      include,
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  } else {
    viewMode = "admin";
    classes = await prisma.class.findMany({
      where: {
        course: { schoolId },
        academicYear: { active: true },
      },
      select: { id: true, name: true, year: true, course: { select: { code: true } } },
      orderBy: [{ year: "asc" }, { name: "asc" }],
    });

    blocks = await prisma.scheduleBlock.findMany({
      where: {
        class: { course: { schoolId } },
        ...(classId ? { classId } : {}),
      },
      include,
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  }

  const selectedClass = classId ? classes.find((c) => c.id === classId) : null;
  const totalLessons = blocks.length;
  const uniqueSubjects = new Set(blocks.map((b) => b.subjectId));
  const uniqueRooms = new Set(blocks.map((b) => b.roomId).filter(Boolean));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-red)] mb-1">
            Horário
          </div>
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.022em]">
            {viewMode === "student"
              ? "O meu horário semanal"
              : viewMode === "teacher"
                ? "O meu horário"
                : selectedClass
                  ? selectedClass.name
                  : "Todos os horários"}
          </h1>
          {school && (
            <p className="text-[12px] text-[var(--muted-foreground)] tabular-nums">
              {school.dayStart}–{school.dayEnd} · blocos de {school.blockMinutes} min
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {viewMode === "admin" && classes.length > 0 && (
            <ClassFilter classes={classes} defaultValue={classId ?? "ALL"} />
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/schedule/print${classId ? `?classId=${classId}` : ""}`} target="_blank">
              <Printer className="mr-1.5 h-3.5 w-3.5" />Imprimir
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/calendar">
              <CalendarRange className="mr-1.5 h-3.5 w-3.5" />Calendário
            </Link>
          </Button>
          {hasRole(role, Role.SCHOOL_ADMIN) && (
            <Button size="sm" asChild>
              <Link href={`/dashboard/schedule/edit${classId ? `?classId=${classId}` : ""}`}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />Editar
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="bg-[var(--card)] rounded-[12px] p-4 shadow-[var(--card-shadow)]">
        {blocks.length === 0 ? (
          <div className="text-center py-12 text-[13px] text-[var(--muted-foreground)]">
            {viewMode === "admin" && !selectedClass && !classId
              ? "Sem aulas registadas. Configure horários em Editar."
              : "Sem aulas no horário."}
          </div>
        ) : (
          <ScheduleGrid
            blocks={blocks as any}
            showClass={viewMode !== "student"}
            dayStart={school?.dayStart ?? "08:00"}
            dayEnd={school?.dayEnd ?? "18:30"}
            timeSlots={timeSlots}
          />
        )}
      </div>

      {blocks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <StatCard
            title="Aulas/semana"
            value={totalLessons}
            icon={Calendar}
            tint="var(--tint-red)"
            description="blocos lectivos"
          />
          <StatCard
            title="Disciplinas"
            value={uniqueSubjects.size}
            icon={BookOpen}
            tint="var(--tint-purple)"
            description="distintas"
          />
          <StatCard
            title="Salas"
            value={uniqueRooms.size}
            icon={MapPin}
            tint="var(--tint-teal)"
            description="utilizadas"
          />
        </div>
      )}
    </div>
  );
}
