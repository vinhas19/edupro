import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { canSendMessage } from "@/lib/messaging-permissions";

const schema = z.object({
  recipientId: z.string(),
  content: z.string().min(1).max(4000),
});

function orderPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  if (parsed.data.recipientId === session.user.id) {
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
  }

  const allowed = await canSendMessage(
    session.user.id,
    session.user.role,
    parsed.data.recipientId,
    session.user.schoolId,
  );
  if (!allowed) {
    return NextResponse.json({ error: "Não tens permissão para contactar este utilizador." }, { status: 403 });
  }

  const [user1Id, user2Id] = orderPair(session.user.id, parsed.data.recipientId);

  const conversation = await prisma.conversation.upsert({
    where: { user1Id_user2Id: { user1Id, user2Id } },
    create: { user1Id, user2Id, schoolId: session.user.schoolId },
    update: {},
  });

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: session.user.id,
      content: parsed.data.content,
    },
  });

  return NextResponse.json({ conversationId: conversation.id, messageId: message.id });
}

// Mark conversation as read
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const conversationId = body.conversationId as string;
  if (!conversationId) return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });

  await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: session.user.id },
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
