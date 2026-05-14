import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role, id: senderId, schoolId } = session.user;
  if (!hasRole(role, Role.CLASS_DIRECTOR)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, content, type, recipientType, classId } = await req.json();

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
  }

  const notification = await prisma.notification.create({
    data: {
      schoolId,
      senderId,
      title,
      content,
      type,
      recipientType,
      classId: classId || null,
    },
  });

  // Determine recipient user IDs
  let recipientIds: string[] = [];

  if (recipientType === "ALL_SCHOOL") {
    const users = await prisma.user.findMany({ where: { schoolId }, select: { id: true } });
    recipientIds = users.map((u) => u.id).filter((id) => id !== senderId);
  } else if (recipientType === "ALL_STUDENTS") {
    const users = await prisma.user.findMany({
      where: { schoolId, role: Role.STUDENT },
      select: { id: true },
    });
    recipientIds = users.map((u) => u.id);
  } else if (recipientType === "ALL_TEACHERS") {
    const users = await prisma.user.findMany({
      where: { schoolId, role: { in: [Role.TEACHER, Role.CLASS_DIRECTOR, Role.COURSE_DIRECTOR] } },
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
    recipientIds = [...new Set(assignments.map((a) => a.teacherId))].filter((id) => id !== senderId);
  }

  if (recipientIds.length > 0) {
    await prisma.notificationRecipient.createMany({
      data: recipientIds.map((recipientId) => ({
        notificationId: notification.id,
        recipientId,
      })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({ ok: true, id: notification.id });
}
