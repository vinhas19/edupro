import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, ApplicationStatus } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/email-templates";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["PENDING", "UNDER_REVIEW", "ACCEPTED", "REJECTED", "WAITLISTED", "WITHDRAWN"]),
  rejectionReason: z.string().optional(),
  notes: z.string().optional(),
  // Quando ACCEPTED, opcionalmente colocar em turma
  classId: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const app = await prisma.application.findUnique({
    where: { id },
    include: { school: { select: { id: true, name: true, slug: true } } },
  });
  if (!app || app.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  // Se aceita → cria utilizador STUDENT + matricula em turma (se fornecida)
  let resultUserId: string | undefined;
  if (parsed.data.status === "ACCEPTED" && !app.resultUserId) {
    // Gera password temporária
    const tempPassword = crypto.randomBytes(6).toString("base64").replace(/[/+=]/g, "").slice(0, 10);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Cria utilizador (verifica unique por email)
    const existing = await prisma.user.findUnique({
      where: { email_schoolId: { email: app.email, schoolId: app.schoolId } },
    });
    let user;
    if (existing) {
      user = existing;
    } else {
      user = await prisma.user.create({
        data: {
          name: app.fullName,
          email: app.email,
          role: Role.STUDENT,
          passwordHash,
          schoolId: app.schoolId,
        },
      });

      // Welcome email com password temporária
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      const { html, text } = welcomeEmail({
        appName: "EduPro",
        schoolName: app.school.name,
        appUrl,
        recipientName: user.name,
        email: user.email,
        loginUrl: `${appUrl}/login?school=${encodeURIComponent(app.school.slug)}`,
        schoolSlug: app.school.slug,
        temporaryPassword: tempPassword,
      });
      sendEmail({
        to: user.email,
        subject: `Candidatura aceite — ${app.school.name}`,
        html,
        text,
        tag: "application-accepted",
      }).catch(() => {});
    }

    resultUserId = user.id;

    // Matricula em turma (opcional)
    if (parsed.data.classId) {
      await prisma.enrollment.upsert({
        where: { studentId_classId: { studentId: user.id, classId: parsed.data.classId } },
        create: { studentId: user.id, classId: parsed.data.classId, status: "ACTIVE" },
        update: { status: "ACTIVE" },
      });
    }
  }

  if (parsed.data.status === "REJECTED") {
    // Email a comunicar rejeição
    sendEmail({
      to: app.email,
      subject: `Candidatura — ${app.school.name}`,
      html: `<p>Olá ${app.fullName.split(" ")[0]},</p><p>Lamentamos informar que a tua candidatura a <strong>${app.school.name}</strong> não foi aceite${parsed.data.rejectionReason ? `: ${parsed.data.rejectionReason}` : "."}.</p><p>Obrigado pelo interesse.</p>`,
      text: `Candidatura não aceite em ${app.school.name}.${parsed.data.rejectionReason ? ` Motivo: ${parsed.data.rejectionReason}` : ""}`,
      tag: "application-rejected",
    }).catch(() => {});
  }

  await prisma.application.update({
    where: { id },
    data: {
      status: parsed.data.status as ApplicationStatus,
      rejectionReason: parsed.data.rejectionReason ?? undefined,
      notes: parsed.data.notes ?? undefined,
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      resultUserId: resultUserId ?? app.resultUserId,
    },
  });

  await logAudit({
    schoolId: session.user.schoolId,
    userId: session.user.id,
    action: `application.${parsed.data.status.toLowerCase()}`,
    entity: "Application",
    entityId: id,
  });

  return NextResponse.json({ ok: true });
}
