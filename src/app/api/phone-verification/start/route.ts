import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { normalizePhone, sendSms } from "@/lib/sms";

const schema = z.object({
  phone: z.string().min(7).max(20),
});

const OTP_TTL_MINUTES = 10;
const COOLDOWN_SECONDS = 60;

function generateCode(): string {
  // 6 dígitos, sem padding inseguro (Math.random é OK aqui — não é cripto-chave)
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const phoneE164 = normalizePhone(parsed.data.phone);
  if (!phoneE164) {
    return NextResponse.json(
      { error: "Número inválido. Usa o formato +351 9XX XXX XXX." },
      { status: 400 },
    );
  }

  // Rate-limit: se já houve um pedido nos últimos COOLDOWN_SECONDS, recusar
  const recent = await prisma.phoneVerification.findFirst({
    where: {
      userId: session.user.id,
      createdAt: { gte: new Date(Date.now() - COOLDOWN_SECONDS * 1000) },
    },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    const wait = Math.ceil(
      COOLDOWN_SECONDS - (Date.now() - recent.createdAt.getTime()) / 1000,
    );
    return NextResponse.json(
      { error: `Aguarda ${wait}s antes de pedir novo código.` },
      { status: 429 },
    );
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  await prisma.phoneVerification.create({
    data: {
      userId: session.user.id,
      phoneE164,
      codeHash,
      expiresAt,
    },
  });

  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "EduPro";
  const body = `${appName}: o teu codigo de verificacao e ${code}. Expira em ${OTP_TTL_MINUTES} minutos.`;
  const res = await sendSms({ to: phoneE164, body });

  if (!res.ok && !res.skipped) {
    return NextResponse.json(
      { error: `Falha a enviar SMS: ${res.error ?? "desconhecido"}` },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    phoneE164,
    expiresInMinutes: OTP_TTL_MINUTES,
    devCode: process.env.NODE_ENV === "development" && res.skipped ? code : undefined,
  });
}
