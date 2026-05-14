import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ROLE_LABELS } from "@/lib/permissions";
import { ChatThread } from "@/components/messages/chat-thread";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      user1: { select: { id: true, name: true, email: true, role: true, image: true } },
      user2: { select: { id: true, name: true, email: true, role: true, image: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 200,
        include: { sender: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  if (!conversation || conversation.schoolId !== session.user.schoolId) notFound();
  if (conversation.user1.id !== session.user.id && conversation.user2.id !== session.user.id) {
    redirect("/dashboard/messages");
  }

  const other = conversation.user1.id === session.user.id ? conversation.user2 : conversation.user1;

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      <div className="flex items-center gap-3 pb-3 border-b">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/messages"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
          {other.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-medium">{other.name}</p>
          <p className="text-xs text-muted-foreground">{ROLE_LABELS[other.role]} · {other.email}</p>
        </div>
      </div>

      <Card className="flex-1 mt-3 overflow-hidden">
        <ChatThread
          conversationId={id}
          recipientId={other.id}
          currentUserId={session.user.id}
          initialMessages={conversation.messages.map((m) => ({
            id: m.id,
            content: m.content,
            createdAt: m.createdAt,
            readAt: m.readAt,
            sender: { id: m.sender.id, name: m.sender.name, image: m.sender.image },
          }))}
        />
      </Card>
    </div>
  );
}
