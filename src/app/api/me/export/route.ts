import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/rate-limit";

/**
 * RGPD Art. 20º — Direito à portabilidade dos dados.
 * Devolve um JSON com TODOS os dados pessoais do utilizador (e referências relacionadas).
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const blocked = enforceRateLimit(req, {
    key: "me:export",
    limit: 3,
    windowMs: 60 * 60_000, // 3/hour
    clientId: session.user.id,
  });
  if (blocked) return blocked;

  const userId = session.user.id;

  const [
    user,
    enrollments,
    attendance,
    moduleProgress,
    submissions,
    fct,
    pap,
    notifications,
    messages,
    files,
    folders,
    auditLogs,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        school: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.enrollment.findMany({
      where: { studentId: userId },
      include: { class: { select: { name: true, course: { select: { name: true } } } } },
    }),
    prisma.attendanceRecord.findMany({
      where: { studentId: userId },
      include: { lesson: { select: { date: true, subject: { select: { name: true } } } } },
    }),
    prisma.studentModuleProgress.findMany({
      where: { studentId: userId },
      include: { module: { select: { name: true, subject: { select: { name: true } } } } },
    }),
    prisma.submission.findMany({
      where: { studentId: userId },
      include: { post: { select: { title: true, type: true } }, files: { select: { name: true, url: true } } },
    }),
    prisma.fctRecord.findMany({ where: { studentId: userId } }),
    prisma.papRecord.findMany({ where: { studentId: userId }, include: { phases: true } }),
    prisma.notificationRecipient.findMany({
      where: { recipientId: userId },
      include: { notification: { select: { title: true, content: true, createdAt: true } } },
    }),
    prisma.message.findMany({
      where: { senderId: userId },
      select: { id: true, content: true, createdAt: true, conversationId: true },
    }),
    prisma.file.findMany({
      where: { ownerId: userId },
      select: { name: true, url: true, size: true, mimeType: true, createdAt: true, visibility: true },
    }),
    prisma.folder.findMany({
      where: { createdById: userId },
      select: { name: true, createdAt: true },
    }),
    prisma.auditLog.findMany({
      where: { userId },
      select: { action: true, entity: true, entityId: true, createdAt: true },
      take: 1000,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  await logAudit({
    schoolId: session.user.schoolId,
    userId,
    action: "user.export",
    entity: "User",
    entityId: userId,
  });

  const data = {
    exportedAt: new Date().toISOString(),
    note: "Este ficheiro contém os teus dados pessoais ao abrigo do RGPD (artigo 20º).",
    user,
    academic: { enrollments, attendance, moduleProgress },
    work: { submissions, fct, pap },
    communications: { notifications, messages },
    files: { uploaded: files, folders },
    activity: { auditLogs },
  };

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="lectiva-dados-${userId}-${new Date().toISOString().slice(0,10)}.json"`,
    },
  });
}
