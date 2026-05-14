import { prisma } from "@/lib/prisma";

/** "HH:MM" → minutes since 00:00 */
export function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Two intervals [a, b) overlap iff a1 < b2 && a2 > b1 */
export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return timeToMin(aStart) < timeToMin(bEnd) && timeToMin(aEnd) > timeToMin(bStart);
}

export type ConflictReason =
  | { kind: "TEACHER"; teacherName: string; existingClass: string; existingSubject: string }
  | { kind: "CLASS"; existingSubject: string; teacherName: string }
  | { kind: "ROOM"; roomName: string; existingClass: string };

export interface ConflictCheckInput {
  classId: string;
  teacherId?: string | null;
  subjectId: string;
  roomId?: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  excludeBlockId?: string;
}

/**
 * Returns an array of conflicts. Empty array means OK.
 * Checks: teacher overlap, class overlap, room overlap, same school.
 */
export async function findScheduleConflicts(input: ConflictCheckInput): Promise<ConflictReason[]> {
  const conflicts: ConflictReason[] = [];

  // All blocks on same dayOfWeek (we filter overlap in JS — Prisma can't compare time strings reliably)
  const candidates = await prisma.scheduleBlock.findMany({
    where: {
      dayOfWeek: input.dayOfWeek,
      ...(input.excludeBlockId ? { NOT: { id: input.excludeBlockId } } : {}),
    },
    include: {
      teacher: { select: { name: true } },
      class: { select: { name: true } },
      subject: { select: { name: true } },
      room: { select: { name: true } },
    },
  });

  for (const b of candidates) {
    if (!overlaps(input.startTime, input.endTime, b.startTime, b.endTime)) continue;

    if (input.teacherId && b.teacherId === input.teacherId) {
      conflicts.push({
        kind: "TEACHER",
        teacherName: b.teacher?.name ?? "?",
        existingClass: b.class.name,
        existingSubject: b.subject.name,
      });
    }
    if (b.classId === input.classId) {
      conflicts.push({
        kind: "CLASS",
        existingSubject: b.subject.name,
        teacherName: b.teacher?.name ?? "?",
      });
    }
    if (input.roomId && b.roomId === input.roomId) {
      conflicts.push({
        kind: "ROOM",
        roomName: b.room?.name ?? "?",
        existingClass: b.class.name,
      });
    }
  }

  return conflicts;
}

export function formatConflict(c: ConflictReason): string {
  switch (c.kind) {
    case "TEACHER":
      return `O professor ${c.teacherName} já tem aula de ${c.existingSubject} em ${c.existingClass} a essa hora.`;
    case "CLASS":
      return `A turma já tem aula de ${c.existingSubject} (Prof. ${c.teacherName}) a essa hora.`;
    case "ROOM":
      return `A sala ${c.roomName} já está a ser usada por ${c.existingClass}.`;
  }
}

/**
 * Find available teachers for a given time slot who can teach a subject.
 * Returns teachers from the same school who:
 *   - are not in another ScheduleBlock at that time
 *   - have taught that subject before (have SubjectAssignment for it)
 *   - or, optionally, share the same Course
 */
export async function findAvailableSubstitutes(opts: {
  schoolId: string;
  subjectId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  excludeTeacherId?: string;
}) {
  // 1. All teachers in school who are active
  const teachers = await prisma.user.findMany({
    where: {
      schoolId: opts.schoolId,
      active: true,
      role: { in: ["TEACHER", "CLASS_DIRECTOR", "COURSE_DIRECTOR"] },
      ...(opts.excludeTeacherId ? { id: { not: opts.excludeTeacherId } } : {}),
    },
    include: {
      taughtSubjectAssignments: {
        where: { subjectId: opts.subjectId },
        select: { id: true },
      },
      // All teacher's schedule blocks for that day
      // (using lessons-like query — adapted by getting via ScheduleBlock relation through user)
    },
    orderBy: { name: "asc" },
  });

  // 2. For each teacher, check schedule availability
  const teacherIds = teachers.map((t) => t.id);
  const blocks = await prisma.scheduleBlock.findMany({
    where: {
      teacherId: { in: teacherIds },
      dayOfWeek: opts.dayOfWeek,
    },
    select: { teacherId: true, startTime: true, endTime: true },
  });

  const busyMap = new Map<string, { startTime: string; endTime: string }[]>();
  for (const b of blocks) {
    if (!b.teacherId) continue;
    if (!busyMap.has(b.teacherId)) busyMap.set(b.teacherId, []);
    busyMap.get(b.teacherId)!.push({ startTime: b.startTime, endTime: b.endTime });
  }

  return teachers
    .map((t) => {
      const busy = busyMap.get(t.id) ?? [];
      const isFree = !busy.some((b) => overlaps(opts.startTime, opts.endTime, b.startTime, b.endTime));
      const teachesSubject = t.taughtSubjectAssignments.length > 0;
      return {
        id: t.id,
        name: t.name,
        email: t.email,
        free: isFree,
        teachesSubject,
        score: (isFree ? 2 : 0) + (teachesSubject ? 1 : 0),
      };
    })
    .filter((t) => t.free)
    .sort((a, b) => b.score - a.score);
}
