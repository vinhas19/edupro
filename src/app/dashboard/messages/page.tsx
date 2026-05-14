import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
      schoolId: session.user.schoolId,
    },
    include: {
      user1: { select: { id: true, name: true, email: true, role: true } },
      user2: { select: { id: true, name: true, email: true, role: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  // Sort by last message time
  const sorted = conversations.sort((a, b) => {
    const aTime = a.messages[0]?.createdAt ?? a.createdAt;
    const bTime = b.messages[0]?.createdAt ?? b.createdAt;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  // Count unread per conversation
  const unreadCounts = await prisma.message.groupBy({
    by: ["conversationId"],
    where: {
      conversation: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      senderId: { not: userId },
      readAt: null,
    },
    _count: { _all: true },
  });
  const unreadMap = new Map(unreadCounts.map((u) => [u.conversationId, u._count._all]));

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Mensagens</h1>
        <p className="text-muted-foreground">Conversas privadas</p>
      </div>

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-medium">Sem conversas</p>
            <p className="text-sm text-muted-foreground">
              Inicie uma conversa a partir do perfil de um utilizador.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((c) => {
            const other = c.user1.id === userId ? c.user2 : c.user1;
            const last = c.messages[0];
            const unread = unreadMap.get(c.id) ?? 0;
            return (
              <Link key={c.id} href={`/dashboard/messages/${c.id}`}>
                <Card className="cursor-pointer hover:shadow-sm transition-shadow">
                  <CardContent className="flex items-center gap-3 py-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold shrink-0">
                      {other.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{other.name}</p>
                        <Badge variant="outline" className="text-xs">{other.role}</Badge>
                      </div>
                      {last && (
                        <p className={`text-xs truncate ${unread > 0 ? "font-semibold" : "text-muted-foreground"}`}>
                          {last.senderId === userId && "Tu: "}{last.content}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {last && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(last.createdAt), { addSuffix: false, locale: pt })}
                        </span>
                      )}
                      {unread > 0 && (
                        <Badge className="bg-blue-600 text-white">{unread}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
