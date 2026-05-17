import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { logAudit } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

/**
 * RGPD Art. 17º — Direito ao apagamento ("direito a ser esquecido").
 *
 * Estratégia: anonimização em vez de delete físico, para não quebrar
 * referências históricas (notas, faltas, etc.) que a escola tem obrigação
 * legal de conservar. O utilizador deixa de poder fazer login e os dados
 * pessoais identificáveis (nome/email/imagem) são substituídos.
 *
 * SUPER_ADMIN não pode auto-eliminar.
 */

const schema = z.object({
  confirm: z.literal("APAGAR A MINHA CONTA"),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === Role.SUPER_ADMIN) {
    return NextResponse.json({ error: "Super admins não podem auto-eliminar." }, { status: 403 });
  }

  const blocked = enforceRateLimit(req, {
    key: "me:delete",
    limit: 3,
    windowMs: 60 * 60_000,
    clientId: session.user.id,
  });
  if (blocked) return blocked;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Escreve exatamente 'APAGAR A MINHA CONTA' para confirmar." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: "Conta inválida." }, { status: 404 });
  }

  const bcrypt = await import("bcryptjs");
  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Palavra-passe incorreta." }, { status: 401 });

  const anonId = `anon-${user.id.slice(-8)}`;
  const anonEmail = `${anonId}@anonymous.lectiva.local`;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        name: "Utilizador apagado",
        email: anonEmail,
        passwordHash: null,
        image: null,
        active: false,
        iCalToken: null,
      },
    }),
    prisma.pushSubscription.deleteMany({ where: { userId: user.id } }),
    prisma.session.deleteMany({ where: { userId: user.id } }),
    prisma.account.deleteMany({ where: { userId: user.id } }),
    prisma.guardianLink.deleteMany({
      where: { OR: [{ guardianId: user.id }, { studentId: user.id }] },
    }),
  ]);

  await logAudit({
    schoolId: session.user.schoolId,
    userId: null,
    action: "user.delete",
    entity: "User",
    entityId: user.id,
    meta: { selfRequested: true },
  });

  return NextResponse.json({ ok: true });
}
