import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId } = await params;
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (conversation.user1Id !== session.user.id && conversation.user2Id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: { sender: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json(messages);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { conversationId } = await params;
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (conversation.user1Id !== session.user.id && conversation.user2Id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Apaga a conversa e (em cascata) todas as mensagens
  await prisma.conversation.delete({ where: { id: conversationId } });
  return NextResponse.json({ ok: true });
}
