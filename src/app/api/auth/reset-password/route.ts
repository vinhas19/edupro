import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  token: z.string().min(20),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export async function POST(req: Request) {
  const blocked = enforceRateLimit(req, { key: "auth:reset", limit: 10, windowMs: 60_000 });
  if (blocked) return blocked;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: "", token: parsed.data.token } as never },
  }).catch(() => null);

  // Fallback: search by token only (identifier is dynamic per user)
  const v = record ?? await prisma.verificationToken.findFirst({
    where: { token: parsed.data.token },
  });

  if (!v || !v.identifier.startsWith("pwd-reset:") || v.expires < new Date()) {
    return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 400 });
  }

  const userId = v.identifier.slice("pwd-reset:".length);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.active) {
    return NextResponse.json({ error: "Conta inválida." }, { status: 400 });
  }

  const hash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } }),
    prisma.verificationToken.deleteMany({ where: { identifier: v.identifier } }),
    // Invalidate other sessions
    prisma.session.deleteMany({ where: { userId } }),
  ]);

  await logAudit({
    schoolId: user.schoolId,
    userId,
    action: "password.reset",
    entity: "User",
    entityId: userId,
  });

  return NextResponse.json({ ok: true });
}
