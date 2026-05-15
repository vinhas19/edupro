import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, NotificationType, RecipientType } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { notify, truncateSms } from "@/lib/notify";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1).trim(),
  content: z.string().min(1).trim(),
  type: z.enum(["INFO", "WARNING", "ALERT", "DEADLINE"]).optional(),
  recipientType: z.enum([
    "ALL_SCHOOL",
    "ALL_STUDENTS",
    "ALL_TEACHERS",
    "CLASS_STUDENTS",
    "CLASS_TEACHERS",
    "INDIVIDUAL",
  ]),
  classId: z.string().nullable().optional(),
  individualRecipientIds: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role, id: senderId, schoolId } = session.user;
  if (!hasRole(role, Role.CLASS_DIRECTOR)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const { title, content, type, recipientType, classId, individualRecipientIds } = parsed.data;

  // Resolver recipientIds
  let recipientIds: string[] = [];

  if (recipientType === "ALL_SCHOOL") {
    const users = await prisma.user.findMany({
      where: { schoolId, active: true },
      select: { id: true },
    });
    recipientIds = users.map((u) => u.id).filter((id) => id !== senderId);
  } else if (recipientType === "ALL_STUDENTS") {
    const users = await prisma.user.findMany({
      where: { schoolId, role: Role.STUDENT, active: true },
      select: { id: true },
    });
    recipientIds = users.map((u) => u.id);
  } else if (recipientType === "ALL_TEACHERS") {
    const users = await prisma.user.findMany({
      where: {
        schoolId,
        role: { in: [Role.TEACHER, Role.CLASS_DIRECTOR, Role.COURSE_DIRECTOR] },
        active: true,
      },
      select: { id: true },
    });
    recipientIds = users.map((u) => u.id).filter((id) => id !== senderId);
  } else if (recipientType === "CLASS_STUDENTS" && classId) {
    const enrollments = await prisma.enrollment.findMany({
      where: { classId, status: "ACTIVE" },
      select: { studentId: true },
    });
    recipientIds = enrollments.map((e) => e.studentId);
  } else if (recipientType === "CLASS_TEACHERS" && classId) {
    const assignments = await prisma.subjectAssignment.findMany({
      where: { classId },
      select: { teacherId: true },
    });
    recipientIds = [...new Set(assignments.map((a) => a.teacherId))].filter(
      (id) => id !== senderId,
    );
  } else if (recipientType === "INDIVIDUAL" && individualRecipientIds?.length) {
    // Validar que pertencem à mesma escola
    const found = await prisma.user.findMany({
      where: { id: { in: individualRecipientIds }, schoolId, active: true },
      select: { id: true },
    });
    recipientIds = found.map((u) => u.id);
  }

  if (recipientIds.length === 0) {
    return NextResponse.json({ error: "Sem destinatários" }, { status: 400 });
  }

  const result = await notify({
    schoolId,
    senderId,
    category: "ANNOUNCEMENT",
    title,
    content,
    type: (type ?? "INFO") as NotificationType,
    recipientType: recipientType as RecipientType,
    classId: classId ?? null,
    recipientIds,
    sms: truncateSms(`${title}: ${content}`),
  });

  return NextResponse.json({ ok: true, ...result });
}
