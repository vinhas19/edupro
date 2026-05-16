import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole, ROLE_LABELS } from "@/lib/permissions";
import Link from "next/link";
import { Plus, Bell, AlertCircle, Info, AlertTriangle, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format, formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { MarkReadButton, MarkAllReadButton } from "@/components/notifications/mark-read-button";

const TYPE_META = {
  INFO: { icon: Info, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", label: "Informação" },
  WARNING: { icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", label: "Aviso" },
  ALERT: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "Urgente" },
  DEADLINE: { icon: Calendar, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200", label: "Prazo" },
} as const;

const RECIPIENT_LABELS: Record<string, string> = {
  ALL_SCHOOL: "Toda a escola",
  ALL_STUDENTS: "Todos os alunos",
  ALL_TEACHERS: "Todos os professores",
  CLASS_STUDENTS: "Turma",
  CLASS_TEACHERS: "Professores da turma",
  INDIVIDUAL: "Individual",
};

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: userId, role } = session.user;

  const receiptsRaw = await prisma.notificationRecipient.findMany({
    where: { recipientId: userId },
    orderBy: { notification: { createdAt: "desc" } },
  });

  const notificationIds = receiptsRaw.map((r) => r.notificationId);
  const notifications = await prisma.notification.findMany({
    where: { id: { in: notificationIds } },
    include: { sender: { select: { name: true, role: true } } },
  });
  const notifMap = new Map(notifications.map((n) => [n.id, n]));

  const classIds = [...new Set(notifications.map((n) => n.classId).filter((c): c is string => !!c))];
  const classes = classIds.length
    ? await prisma.class.findMany({
        where: { id: { in: classIds } },
        select: { id: true, name: true, course: { select: { code: true } } },
      })
    : [];
  const classMap = new Map(classes.map((c) => [c.id, c]));

  const receipts = receiptsRaw
    .map((r) => {
      const n = notifMap.get(r.notificationId);
      if (!n) return null;
      return { ...r, notification: { ...n, class: n.classId ? classMap.get(n.classId) ?? null : null } };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const unread = receipts.filter((r) => !r.readAt).length;
  const canCreate = hasRole(role, Role.CLASS_DIRECTOR);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Comunicações</h1>
          <p className="text-muted-foreground text-sm">
            {unread > 0 ? `${unread} por ler` : "Tudo lido"}
            {receipts.length > 0 && (
              <span className="text-muted-foreground/60"> · {receipts.length} no total</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MarkAllReadButton count={unread} />
          {canCreate && (
            <Button asChild size="sm">
              <Link href="/dashboard/notifications/new">
                <Plus className="mr-1.5 h-3.5 w-3.5" />Enviar Aviso
              </Link>
            </Button>
          )}
        </div>
      </div>

      {receipts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="font-medium">Sem comunicações</p>
            <p className="text-sm text-muted-foreground">Ainda não recebeste nenhum aviso.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {receipts.map((receipt) => {
            const n = receipt.notification;
            const isUnread = !receipt.readAt;
            const meta = TYPE_META[n.type];
            const Icon = meta.icon;
            const recipientLabel =
              n.recipientType === "CLASS_STUDENTS" || n.recipientType === "CLASS_TEACHERS"
                ? n.class
                  ? `${n.class.name}${n.class.course?.code ? ` (${n.class.course.code})` : ""}`
                  : RECIPIENT_LABELS[n.recipientType]
                : RECIPIENT_LABELS[n.recipientType] ?? "Destinatários";

            return (
              <div
                key={receipt.id}
                className={`relative rounded-xl border transition-all ${
                  isUnread
                    ? `${meta.bg} ${meta.border} shadow-sm`
                    : "bg-card border-border"
                }`}
              >
                {isUnread && (
                  <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${meta.color.replace("text-", "bg-")}`} />
                )}
                <div className="flex items-start gap-3 py-4 px-4 pl-5">
                  <div className={`mt-0.5 shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full ${isUnread ? "bg-white" : meta.bg}`}>
                    <Icon className={`h-4 w-4 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center flex-wrap gap-1.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${meta.color} ${meta.bg} border ${meta.border}`}>
                        {meta.label}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {recipientLabel}
                      </span>
                    </div>
                    <p className={`text-[14px] leading-tight ${isUnread ? "font-semibold" : "font-medium"}`}>
                      {n.title}
                    </p>
                    <p className="text-[13px] text-muted-foreground whitespace-pre-wrap leading-snug">
                      {n.content}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 pt-1">
                      <span className="font-medium">{n.sender.name}</span>
                      <span>·</span>
                      <span>{ROLE_LABELS[n.sender.role]}</span>
                      <span>·</span>
                      <span title={format(new Date(n.createdAt), "d MMM yyyy, HH:mm", { locale: pt })}>
                        {formatDistanceToNow(new Date(n.createdAt), { locale: pt, addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  {isUnread && <MarkReadButton receiptId={receipt.id} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
