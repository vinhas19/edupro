import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const schema = z.object({
  code: z.string().regex(/^\d{6}$/),
});

const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Código inválido. São 6 dígitos." }, { status: 400 });
  }

  const challenge = await prisma.phoneVerification.findFirst({
    where: {
      userId: session.user.id,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!challenge) {
    return NextResponse.json(
      { error: "Nenhum código válido. Pede um novo." },
      { status: 410 },
    );
  }

  if (challenge.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "Demasiadas tentativas. Pede um novo código." },
      { status: 429 },
    );
  }

  const valid = await bcrypt.compare(parsed.data.code, challenge.codeHash);

  if (!valid) {
    await prisma.phoneVerification.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    const remaining = MAX_ATTEMPTS - challenge.attempts - 1;
    return NextResponse.json(
      {
        error:
          remaining > 0
            ? `Código incorreto. Restam ${remaining} tentativa(s).`
            : "Código incorreto. Pede um novo.",
      },
      { status: 400 },
    );
  }

  // Sucesso: marca challenge consumido e atualiza User
  await prisma.$transaction([
    prisma.phoneVerification.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        phoneE164: challenge.phoneE164,
        phoneVerified: true,
      },
    }),
    // Invalida outros challenges pendentes
    prisma.phoneVerification.updateMany({
      where: {
        userId: session.user.id,
        consumedAt: null,
        id: { not: challenge.id },
      },
      data: { consumedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true, phoneE164: challenge.phoneE164 });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { phoneE164: null, phoneVerified: false },
  });

  return NextResponse.json({ ok: true });
}
