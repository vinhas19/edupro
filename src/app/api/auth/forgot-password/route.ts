import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail } from "@/lib/email-templates";
import { enforceRateLimit } from "@/lib/rate-limit";
import crypto from "crypto";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  schoolSlug: z.string().min(1),
});

const TOKEN_TTL_HOURS = 1;

export async function POST(req: Request) {
  // Aggressive rate limit: 3/min per IP, 10/hour per IP
  const blocked =
    enforceRateLimit(req, { key: "auth:forgot:minute", limit: 3, windowMs: 60_000 }) ??
    enforceRateLimit(req, { key: "auth:forgot:hour", limit: 10, windowMs: 60 * 60_000 });
  if (blocked) return blocked;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const { email, schoolSlug } = parsed.data;

  // ALWAYS return ok to avoid user enumeration
  const school = await prisma.school.findUnique({ where: { slug: schoolSlug } });
  if (!school) return NextResponse.json({ ok: true });

  const user = await prisma.user.findUnique({
    where: { email_schoolId: { email: email.toLowerCase(), schoolId: school.id } },
  });
  if (!user || !user.active) return NextResponse.json({ ok: true });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

  // Reuse VerificationToken table (already in schema). Identifier = userId:reset
  const identifier = `pwd-reset:${user.id}`;

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier } }),
    prisma.verificationToken.create({ data: { identifier, token, expires } }),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${token}&school=${encodeURIComponent(schoolSlug)}`;

  const { html, text } = passwordResetEmail({
    appName: "EduPro",
    schoolName: school.name,
    appUrl,
    recipientName: user.name,
    resetUrl,
    expiresInHours: TOKEN_TTL_HOURS,
  });

  await sendEmail({
    to: user.email,
    subject: "Redefinir palavra-passe — EduPro",
    html,
    text,
    tag: "password-reset",
  });

  return NextResponse.json({ ok: true });
}
