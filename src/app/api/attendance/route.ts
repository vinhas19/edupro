import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { notify, resolveGuardianIds, truncateSms } from "@/lib/notify";
import { AbsenceAlertEmail } from "@/emails/absence-alert";

const upsertSchema = z.object({
  lessonId: z.string(),
  records: z.array(z.object({
    studentId: z.string(),
    status: z.enum(["PRESENT", "ABSENT", "JUSTIFIED", "LATE"]),
    notes: z.string().optional(),
  })),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { lessonId, records } = parsed.data;

  // Buscar estado anterior para detetar transições para ABSENT/LATE (notificar apenas novos)
  const existing = await prisma.attendanceRecord.findMany({
    where: { lessonId, studentId: { in: records.map((r) => r.studentId) } },
    select: { studentId: true, status: true },
  });
  const existingByStudent = new Map(existing.map((e) => [e.studentId, e.status]));

  const results = await prisma.$transaction(
    records.map((r) =>
      prisma.attendanceRecord.upsert({
        where: { lessonId_studentId: { lessonId, studentId: r.studentId } },
        create: { lessonId, studentId: r.studentId, status: r.status, notes: r.notes },
        update: { status: r.status, notes: r.notes },
      }),
    ),
  );

  // Detetar novas faltas / atrasos (não eram ABSENT/LATE antes) e notificar EE + aluno
  const newAlerts = records.filter((r) => {
    if (r.status !== "ABSENT" && r.status !== "LATE") return false;
    const prev = existingByStudent.get(r.studentId);
    return prev !== r.status; // novo registo ou transição
  });

  if (newAlerts.length > 0) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        class: { include: { course: { include: { school: true } } } },
        subject: true,
      },
    });

    if (lesson && lesson.class.course.schoolId === session.user.schoolId) {
      const students = await prisma.user.findMany({
        where: { id: { in: newAlerts.map((a) => a.studentId) } },
        select: { id: true, name: true },
      });
      const studentNameById = new Map(students.map((s) => [s.id, s.name]));

      const lessonDate = new Date(lesson.date).toLocaleDateString("pt-PT");
      const lessonTime = `${lesson.startTime} - ${lesson.endTime}`;
      const className = `${lesson.class.course.name} · ${lesson.class.name}`;
      const subjectName = lesson.subject.name;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      const justifyUrl = `${appUrl}/dashboard/attendance/justifications`;

      for (const alert of newAlerts) {
        const studentName = studentNameById.get(alert.studentId) ?? "—";
        const guardians = await resolveGuardianIds([alert.studentId]);
        const recipients = [...new Set([alert.studentId, ...guardians])];

        void notify({
          schoolId: session.user.schoolId,
          senderId: session.user.id,
          category: "ABSENCE",
          title: alert.status === "LATE" ? `Atraso registado · ${studentName}` : `Falta registada · ${studentName}`,
          content: `${subjectName} · ${className} · ${lessonDate} ${lessonTime}`,
          type: alert.status === "LATE" ? "WARNING" : "ALERT",
          recipientType: "INDIVIDUAL",
          recipientIds: recipients,
          url: `${appUrl}/dashboard/attendance`,
          email: {
            subject:
              alert.status === "LATE"
                ? `[${lesson.class.course.school.name}] Atraso — ${studentName}`
                : `[${lesson.class.course.school.name}] Falta — ${studentName}`,
            react: AbsenceAlertEmail({
              recipientName: "—",
              schoolName: lesson.class.course.school.name,
              studentName,
              className,
              subjectName,
              lessonDate,
              lessonTime,
              status: alert.status as "ABSENT" | "LATE",
              justifyUrl,
            }),
          },
          sms: truncateSms(
            `${alert.status === "LATE" ? "Atraso" : "Falta"} de ${studentName} em ${subjectName} (${lessonDate} ${lessonTime}).`,
          ),
        }).catch((err) => console.error("[notify] absence failed", err));
      }
    }
  }

  return NextResponse.json(results, { status: 201 });
}
