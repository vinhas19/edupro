import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ScheduleEditor } from "@/components/schedule/schedule-editor";

export default async function EditSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) redirect("/dashboard/schedule");

  const { classId } = await searchParams;

  const classes = await prisma.class.findMany({
    where: {
      course: { schoolId: session.user.schoolId },
      academicYear: { active: true },
    },
    include: { course: { select: { name: true, code: true } } },
    orderBy: [{ year: "asc" }, { name: "asc" }],
  });

  const selectedClassId = classId ?? classes[0]?.id;

  if (!selectedClassId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/schedule"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-2xl font-bold">Editar Horário</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Sem turmas no ano lectivo activo.
          </CardContent>
        </Card>
      </div>
    );
  }

  const cls = await prisma.class.findUnique({
    where: { id: selectedClassId },
    include: {
      course: { select: { name: true, code: true } },
      subjectAssignments: {
        include: {
          subject: { select: { id: true, name: true } },
          teacher: { select: { id: true, name: true } },
        },
      },
      scheduleBlocks: {
        include: {
          subject: { select: { name: true } },
          teacher: { select: { name: true } },
          room: { select: { name: true } },
          class: { select: { name: true } },
        },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
    },
  });

  if (!cls) redirect("/dashboard/schedule");

  const rooms = await prisma.room.findMany({
    where: { schoolId: session.user.schoolId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // Build subjects with their assigned teachers for this class
  const subjectMap = new Map<string, { id: string; name: string; teachers: { id: string; name: string }[] }>();
  for (const a of cls.subjectAssignments) {
    if (!subjectMap.has(a.subject.id)) {
      subjectMap.set(a.subject.id, { id: a.subject.id, name: a.subject.name, teachers: [] });
    }
    subjectMap.get(a.subject.id)!.teachers.push(a.teacher);
  }
  const subjects = Array.from(subjectMap.values());

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/schedule"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Editar Horário</h1>
          <p className="text-muted-foreground text-sm">
            {cls.name} · {cls.course.name} · {cls.year}º Ano
          </p>
        </div>
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1 max-w-xs">
          <label className="text-xs text-muted-foreground">Turma</label>
          <form action="/dashboard/schedule/edit" method="GET">
            <Select name="classId" defaultValue={cls.id}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.course.code}) · {c.year}º
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button type="submit" className="hidden">go</button>
          </form>
        </div>
      </div>

      <ScheduleEditor
        classId={cls.id}
        blocks={cls.scheduleBlocks.map((b) => ({
          ...b,
          subject: b.subject,
          teacher: b.teacher,
          room: b.room,
          class: b.class,
        }))}
        subjects={subjects}
        rooms={rooms}
      />
    </div>
  );
}
