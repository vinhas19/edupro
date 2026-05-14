import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, currentPassword, newPassword } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "O nome não pode estar vazio" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });

  const updateData: { name: string; passwordHash?: string } = { name: name.trim() };

  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Introduza a palavra-passe atual" }, { status: 400 });
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash ?? "");
    if (!valid) {
      return NextResponse.json({ error: "Palavra-passe atual incorreta" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "A nova palavra-passe deve ter pelo menos 8 caracteres" }, { status: 400 });
    }
    updateData.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
  });

  return NextResponse.json({ ok: true });
}
