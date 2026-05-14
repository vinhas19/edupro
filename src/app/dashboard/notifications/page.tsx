import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import Link from "next/link";
import { Plus, Bell, AlertCircle, Info, AlertTriangle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { MarkReadButton } from "@/components/notifications/mark-read-button";

const TYPE_ICONS = {
  INFO: <Info className="h-4 w-4 text-blue-500" />,
  WARNING: <AlertTriangle className="h-4 w-4 text-orange-500" />,
  ALERT: <AlertCircle className="h-4 w-4 text-red-500" />,
  DEADLINE: <Calendar className="h-4 w-4 text-purple-500" />,
} as const;

const TYPE_COLORS = {
  INFO: "bg-blue-50 border-blue-200",
  WARNING: "bg-orange-50 border-orange-200",
  ALERT: "bg-red-50 border-red-200",
  DEADLINE: "bg-purple-50 border-purple-200",
} as const;

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: userId, role, schoolId } = session.user;

  const receipts = await prisma.notificationRecipient.findMany({
    where: { recipientId: userId },
    include: {
      notification: {
        include: { sender: { select: { name: true, role: true } } },
      },
    },
    orderBy: { notification: { createdAt: "desc" } },
  });

  const unread = receipts.filter((r) => !r.readAt).length;
  const canCreate = hasRole(role, Role.CLASS_DIRECTOR);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Comunicações</h1>
          <p className="text-muted-foreground">
            {unread > 0 ? `${unread} mensagem${unread !== 1 ? "s" : ""} não lida${unread !== 1 ? "s" : ""}` : "Tudo lido"}
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/dashboard/notifications/new">
              <Plus className="mr-2 h-4 w-4" />Enviar Aviso
            </Link>
          </Button>
        )}
      </div>

      {receipts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="font-medium">Sem comunicações</p>
            <p className="text-sm text-muted-foreground">Ainda não recebeu nenhum aviso.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {receipts.map((receipt) => {
            const n = receipt.notification;
            const isUnread = !receipt.readAt;
            return (
              <Card
                key={receipt.id}
                className={`border transition-all ${isUnread ? TYPE_COLORS[n.type] : ""}`}
              >
                <CardContent className="flex items-start gap-3 py-3">
                  <div className="mt-0.5 shrink-0">{TYPE_ICONS[n.type]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium ${isUnread ? "font-semibold" : ""}`}>
                        {n.title}
                      </p>
                      {isUnread && (
                        <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.content}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                      <span>{n.sender.name}</span>
                      <span>·</span>
                      <span>{format(new Date(n.createdAt), "d MMM, HH:mm", { locale: pt })}</span>
                    </div>
                  </div>
                  {isUnread && <MarkReadButton receiptId={receipt.id} />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
