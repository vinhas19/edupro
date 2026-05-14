import { Fragment } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Pencil, CalendarRange } from "lucide-react";

const DAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
const TIME_SLOTS = [
  "08:00", "08:50", "09:40", "10:40", "11:30",
  "12:20", "13:10", "14:00", "14:50", "15:40", "16:30", "17:20",
];

const SUBJECT_COLORS = [
  "bg-blue-100 border-blue-300 text-blue-800",
  "bg-green-100 border-green-300 text-green-800",
  "bg-purple-100 border-purple-300 text-purple-800",
  "bg-orange-100 border-orange-300 text-orange-800",
  "bg-pink-100 border-pink-300 text-pink-800",
  "bg-teal-100 border-teal-300 text-teal-800",
  "bg-yellow-100 border-yellow-300 text-yellow-800",
  "bg-red-100 border-red-300 text-red-800",
];

export default async function SchedulePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: userId, role, schoolId } = session.user;

  let blocks: Awaited<ReturnType<typeof prisma.scheduleBlock.findMany>> = [];

  if (!hasRole(role, Role.TEACHER)) {
    // Student — get their class schedule
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: userId, status: "ACTIVE" },
    });
    if (enrollment) {
      blocks = await prisma.scheduleBlock.findMany({
        where: { classId: enrollment.classId },
        include: {
          subject: true,
          room: true,
          class: { include: { course: true } },
        },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      });
    }
  } else if (role === Role.TEACHER) {
    blocks = await prisma.scheduleBlock.findMany({
      where: { teacherId: userId },
      include: {
        subject: true,
        room: true,
        class: { include: { course: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  } else {
    // Admin / Director — may filter by class
    blocks = await prisma.scheduleBlock.findMany({
      where: { class: { course: { schoolId } } },
      include: {
        subject: true,
        room: true,
        class: { include: { course: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  }

  // Build color map per subject
  const subjectIds = [...new Set(blocks.map((b) => b.subjectId))];
  const colorMap = new Map(subjectIds.map((id, i) => [id, SUBJECT_COLORS[i % SUBJECT_COLORS.length]]));

  // Group by day
  const schedule: Record<number, typeof blocks> = {};
  for (let d = 1; d <= 5; d++) schedule[d] = [];
  blocks.forEach((b) => { schedule[b.dayOfWeek]?.push(b); });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Horário</h1>
          <p className="text-muted-foreground">
            {hasRole(role, Role.SCHOOL_ADMIN) ? "Todos os horários" : "O meu horário semanal"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/calendar"><CalendarRange className="mr-1.5 h-3.5 w-3.5" />Calendário</Link>
          </Button>
          {hasRole(role, Role.SCHOOL_ADMIN) && (
            <Button size="sm" asChild>
              <Link href="/dashboard/schedule/edit"><Pencil className="mr-1.5 h-3.5 w-3.5" />Editar</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Weekly grid */}
      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          <div className="grid min-w-[700px]" style={{ gridTemplateColumns: "80px repeat(5, 1fr)" }}>
            {/* Header */}
            <div className="border-b pb-2" />
            {DAYS.map((day) => (
              <div key={day} className="border-b pb-2 text-center text-sm font-semibold">
                {day}
              </div>
            ))}

            {/* Time rows */}
            {TIME_SLOTS.map((time) => (
              <Fragment key={`row-${time}`}>
                <div className="py-2 pr-3 text-xs text-muted-foreground text-right border-b">
                  {time}
                </div>
                {[1, 2, 3, 4, 5].map((day) => {
                  const block = schedule[day]?.find(
                    (b) => b.startTime === time
                  );
                  return (
                    <div key={`${day}-${time}`} className="border-b border-l p-1 min-h-[40px]">
                      {block && (
                        <div
                          className={`rounded border px-2 py-1 text-xs ${colorMap.get(block.subjectId) ?? ""}`}
                        >
                          <p className="font-semibold line-clamp-1">{(block as any).subject?.name}</p>
                          <p className="text-[10px] opacity-75">
                            {block.startTime}–{block.endTime}
                            {(block as any).room && ` · ${(block as any).room.name}`}
                          </p>
                          {hasRole(role, Role.TEACHER) && (block as any).class && (
                            <p className="text-[10px] opacity-75">{(block as any).class.name}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {subjectIds.slice(0, 8).map((id) => {
          const block = blocks.find((b) => b.subjectId === id);
          return (
            <Badge key={id} className={colorMap.get(id)} variant="outline">
              {(block as any)?.subject?.name}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
