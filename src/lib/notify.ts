import type { ReactElement } from "react";
import { prisma } from "@/lib/prisma";
import {
  NotificationCategory,
  NotificationChannel,
  NotificationType,
  RecipientType,
  DeliveryStatus,
  type Prisma,
} from "@prisma/client";
import { sendPushToUsers } from "@/lib/push";
import { sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface EmailContent {
  subject: string;
  react?: ReactElement;
  html?: string;
  text?: string;
}

export interface NotifyInput {
  schoolId: string;
  senderId?: string | null;       // null = sistema
  category: NotificationCategory;
  title: string;
  content: string;
  type?: NotificationType;
  recipientType?: RecipientType;
  classId?: string | null;
  recipientIds: string[];          // utilizadores a notificar (já resolvidos pelo caller)

  // Conteúdo específico por canal (opcional — fallback usa title/content)
  url?: string;                     // URL para "Ver mais" em push/email
  email?: EmailContent;
  sms?: string;                     // body curto, <= 160 chars idealmente

  // Override de canais por força bruta (ignora preferências) — usar com parcimónia
  forceChannels?: NotificationChannel[];

  // Mensagens críticas ignoram quiet hours
  urgentBypassQuietHours?: boolean;
}

type PreferenceFieldKey =
  | "scheduleChanges"
  | "lessonCancelled"
  | "absences"
  | "justifications"
  | "grades"
  | "assignments"
  | "messages"
  | "announcements"
  | "fctPapMilestones"
  | "substitutions";

const PREFERENCE_FIELD: Record<NotificationCategory, PreferenceFieldKey> = {
  SCHEDULE_CHANGE: "scheduleChanges",
  LESSON_CANCELLED: "lessonCancelled",
  ABSENCE: "absences",
  JUSTIFICATION: "justifications",
  GRADE: "grades",
  ASSIGNMENT: "assignments",
  MESSAGE: "messages",
  ANNOUNCEMENT: "announcements",
  FCT_PAP_MILESTONE: "fctPapMilestones",
  SUBSTITUTION: "substitutions",
};

const DEFAULT_PREFERENCE: Record<PreferenceFieldKey, NotificationChannel[]> = {
  scheduleChanges: ["PUSH", "IN_APP", "EMAIL"],
  lessonCancelled: ["PUSH", "IN_APP", "EMAIL", "SMS"],
  absences: ["PUSH", "IN_APP", "EMAIL"],
  justifications: ["PUSH", "IN_APP", "EMAIL"],
  grades: ["IN_APP", "EMAIL"],
  assignments: ["PUSH", "IN_APP"],
  messages: ["PUSH", "IN_APP"],
  announcements: ["PUSH", "IN_APP"],
  fctPapMilestones: ["IN_APP", "EMAIL"],
  substitutions: ["PUSH", "IN_APP", "EMAIL"],
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function parseChannels(value: Prisma.JsonValue | null | undefined): NotificationChannel[] {
  if (!value) return [];
  const arr = Array.isArray(value) ? value : [];
  return arr.filter((c): c is NotificationChannel =>
    typeof c === "string" && ["IN_APP", "PUSH", "EMAIL", "SMS"].includes(c),
  );
}

function isWithinQuietHours(
  start: string | null,
  end: string | null,
  now: Date = new Date(),
): boolean {
  if (!start || !end || start === end) return false;
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) return false;
  const toMin = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const s = toMin(start);
  const e = toMin(end);
  // Janela que cruza meia-noite (ex: 22:00 → 07:00)
  if (s > e) return nowMin >= s || nowMin < e;
  return nowMin >= s && nowMin < e;
}

// ─── Core ─────────────────────────────────────────────────────────────────────

export interface NotifyResult {
  notificationId: string;
  recipientsCount: number;
  deliveries: { channel: NotificationChannel; sent: number; skipped: number; failed: number }[];
}

export async function notify(input: NotifyInput): Promise<NotifyResult> {
  const {
    schoolId,
    senderId,
    category,
    title,
    content,
    type = NotificationType.INFO,
    recipientType = RecipientType.INDIVIDUAL,
    classId,
    url,
    email,
    sms,
    forceChannels,
    urgentBypassQuietHours = false,
  } = input;

  const recipientIds = [...new Set(input.recipientIds)];
  if (recipientIds.length === 0) {
    return { notificationId: "", recipientsCount: 0, deliveries: [] };
  }

  // 1. Criar Notification + NotificationRecipient (in-app sempre persiste)
  const effectiveSenderId =
    senderId ??
    (await prisma.user.findFirst({
      where: { schoolId, role: "SCHOOL_ADMIN" },
      select: { id: true },
    }))?.id;

  if (!effectiveSenderId) {
    console.warn("[notify] No sender resolvable for school", schoolId);
    return { notificationId: "", recipientsCount: 0, deliveries: [] };
  }

  const notification = await prisma.notification.create({
    data: {
      schoolId,
      senderId: effectiveSenderId,
      title,
      content,
      type,
      recipientType,
      classId: classId ?? null,
    },
  });

  await prisma.notificationRecipient.createMany({
    data: recipientIds.map((id) => ({
      notificationId: notification.id,
      recipientId: id,
    })),
    skipDuplicates: true,
  });

  const persistedRecipients = await prisma.notificationRecipient.findMany({
    where: { notificationId: notification.id },
    select: { id: true, recipientId: true },
  });

  // 2. Carregar utilizadores + preferências
  const users = await prisma.user.findMany({
    where: { id: { in: recipientIds }, active: true },
    select: {
      id: true,
      email: true,
      phoneE164: true,
      phoneVerified: true,
      notificationPreference: true,
    },
  });

  const userById = new Map(users.map((u) => [u.id, u]));

  // 3. Decidir canais por utilizador e agrupar
  const byChannel: Record<NotificationChannel, { userId: string; recipientId: string }[]> = {
    IN_APP: [],
    PUSH: [],
    EMAIL: [],
    SMS: [],
  };
  const skippedByQuietHours: { recipientId: string; channel: NotificationChannel }[] = [];

  for (const rec of persistedRecipients) {
    const user = userById.get(rec.recipientId);
    if (!user) continue;

    // IN_APP é sempre garantido pelo NotificationRecipient (UI lê daqui)
    byChannel.IN_APP.push({ userId: user.id, recipientId: rec.id });

    let channels: NotificationChannel[];
    if (forceChannels?.length) {
      channels = forceChannels;
    } else {
      const pref = user.notificationPreference;
      const fieldKey = PREFERENCE_FIELD[category];
      const prefValue: NotificationChannel[] = pref
        ? parseChannels((pref as Record<string, unknown>)[fieldKey] as Prisma.JsonValue)
        : DEFAULT_PREFERENCE[fieldKey];
      channels = prefValue.length > 0 ? prefValue : DEFAULT_PREFERENCE[fieldKey];

      // Master toggles
      if (pref) {
        if (!pref.emailEnabled) channels = channels.filter((c) => c !== "EMAIL");
        if (!pref.smsEnabled) channels = channels.filter((c) => c !== "SMS");
        if (!pref.pushEnabled) channels = channels.filter((c) => c !== "PUSH");

        // Quiet hours (não silencia IN_APP)
        if (
          !urgentBypassQuietHours &&
          isWithinQuietHours(pref.quietHoursStart, pref.quietHoursEnd)
        ) {
          for (const c of channels) {
            if (c !== "IN_APP") {
              skippedByQuietHours.push({ recipientId: rec.id, channel: c });
            }
          }
          continue;
        }
      }

      // Por defeito a IN_APP já foi entregue acima; não duplicar
      channels = channels.filter((c) => c !== "IN_APP");
    }

    for (const c of channels) {
      if (c === "EMAIL" && !user.email) continue;
      if (c === "SMS" && (!user.phoneE164 || !user.phoneVerified)) continue;
      byChannel[c].push({ userId: user.id, recipientId: rec.id });
    }
  }

  // 4. Registar deliveries (IN_APP = SENT imediato, restantes = QUEUED)
  const deliveryRows: Prisma.NotificationDeliveryCreateManyInput[] = [];
  for (const r of byChannel.IN_APP) {
    deliveryRows.push({
      recipientId: r.recipientId,
      channel: "IN_APP",
      status: DeliveryStatus.SENT,
      category,
      sentAt: new Date(),
    });
  }
  for (const r of skippedByQuietHours) {
    deliveryRows.push({
      recipientId: r.recipientId,
      channel: r.channel,
      status: DeliveryStatus.SKIPPED,
      category,
      error: "quiet_hours",
    });
  }
  for (const channel of ["PUSH", "EMAIL", "SMS"] as const) {
    for (const r of byChannel[channel]) {
      deliveryRows.push({
        recipientId: r.recipientId,
        channel,
        status: DeliveryStatus.QUEUED,
        category,
        target:
          channel === "EMAIL"
            ? userById.get(r.userId)?.email
            : channel === "SMS"
              ? userById.get(r.userId)?.phoneE164 ?? undefined
              : undefined,
      });
    }
  }
  if (deliveryRows.length) {
    await prisma.notificationDelivery.createMany({ data: deliveryRows });
  }

  // 5. Disparar em paralelo (não bloquear a resposta da API por mais de necessário)
  const results = {
    PUSH: { sent: 0, skipped: 0, failed: 0 },
    EMAIL: { sent: 0, skipped: 0, failed: 0 },
    SMS: { sent: 0, skipped: 0, failed: 0 },
  };

  const pushUserIds = byChannel.PUSH.map((r) => r.userId);
  const promises: Promise<unknown>[] = [];

  if (pushUserIds.length) {
    promises.push(
      (async () => {
        const res = await sendPushToUsers(pushUserIds, {
          title,
          body: content,
          url,
          tag: notification.id,
        });
        results.PUSH.sent = res.sent;
        results.PUSH.failed = res.failed;
        await prisma.notificationDelivery.updateMany({
          where: {
            recipientId: { in: byChannel.PUSH.map((r) => r.recipientId) },
            channel: "PUSH",
            status: DeliveryStatus.QUEUED,
          },
          data: { status: DeliveryStatus.SENT, sentAt: new Date() },
        });
      })(),
    );
  }

  if (byChannel.EMAIL.length) {
    const subject = email?.subject ?? title;
    const react = email?.react;
    const html = email?.html;
    const text = email?.text ?? content;

    for (const r of byChannel.EMAIL) {
      const user = userById.get(r.userId);
      if (!user?.email) continue;
      promises.push(
        (async () => {
          const res = await sendEmail({
            to: user.email,
            subject,
            react,
            html,
            text,
            tag: category.toLowerCase(),
          });
          if (res.ok) {
            results.EMAIL.sent++;
            await prisma.notificationDelivery.updateMany({
              where: {
                recipientId: r.recipientId,
                channel: "EMAIL",
                status: DeliveryStatus.QUEUED,
              },
              data: {
                status: DeliveryStatus.SENT,
                sentAt: new Date(),
                providerId: res.id,
              },
            });
          } else if (res.skipped) {
            results.EMAIL.skipped++;
            await prisma.notificationDelivery.updateMany({
              where: {
                recipientId: r.recipientId,
                channel: "EMAIL",
                status: DeliveryStatus.QUEUED,
              },
              data: { status: DeliveryStatus.SKIPPED, error: res.error },
            });
          } else {
            results.EMAIL.failed++;
            await prisma.notificationDelivery.updateMany({
              where: {
                recipientId: r.recipientId,
                channel: "EMAIL",
                status: DeliveryStatus.QUEUED,
              },
              data: { status: DeliveryStatus.FAILED, error: res.error },
            });
          }
        })(),
      );
    }
  }

  if (byChannel.SMS.length) {
    const body = sms ?? truncateSms(`${title} — ${content}`);
    for (const r of byChannel.SMS) {
      const user = userById.get(r.userId);
      if (!user?.phoneE164) continue;
      promises.push(
        (async () => {
          const res = await sendSms({ to: user.phoneE164!, body });
          if (res.ok) {
            results.SMS.sent++;
            await prisma.notificationDelivery.updateMany({
              where: {
                recipientId: r.recipientId,
                channel: "SMS",
                status: DeliveryStatus.QUEUED,
              },
              data: {
                status: DeliveryStatus.SENT,
                sentAt: new Date(),
                providerId: res.sid,
              },
            });
          } else if (res.skipped) {
            results.SMS.skipped++;
            await prisma.notificationDelivery.updateMany({
              where: {
                recipientId: r.recipientId,
                channel: "SMS",
                status: DeliveryStatus.QUEUED,
              },
              data: { status: DeliveryStatus.SKIPPED, error: res.error },
            });
          } else {
            results.SMS.failed++;
            await prisma.notificationDelivery.updateMany({
              where: {
                recipientId: r.recipientId,
                channel: "SMS",
                status: DeliveryStatus.QUEUED,
              },
              data: { status: DeliveryStatus.FAILED, error: res.error },
            });
          }
        })(),
      );
    }
  }

  await Promise.allSettled(promises);

  return {
    notificationId: notification.id,
    recipientsCount: recipientIds.length,
    deliveries: [
      { channel: "IN_APP", sent: byChannel.IN_APP.length, skipped: 0, failed: 0 },
      { channel: "PUSH", ...results.PUSH },
      { channel: "EMAIL", ...results.EMAIL },
      { channel: "SMS", ...results.SMS },
    ],
  };
}

// SMS body deve ser conciso. Trunca preservando "..." final.
export function truncateSms(s: string, max = 155): string {
  const clean = s.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1) + "…";
}

// Resolve EE (encarregados de educação) a partir de uma lista de alunos
export async function resolveGuardianIds(studentIds: string[]): Promise<string[]> {
  if (studentIds.length === 0) return [];
  const links = await prisma.guardianLink.findMany({
    where: { studentId: { in: studentIds } },
    select: { guardianId: true },
  });
  return [...new Set(links.map((l) => l.guardianId))];
}

// Resolve alunos ativos de uma turma
export async function resolveClassStudentIds(classId: string): Promise<string[]> {
  const enrolls = await prisma.enrollment.findMany({
    where: { classId, status: "ACTIVE" },
    select: { studentId: true },
  });
  return enrolls.map((e) => e.studentId);
}

// Resolve professores que dão aulas a uma turma
export async function resolveClassTeacherIds(classId: string): Promise<string[]> {
  const assigns = await prisma.subjectAssignment.findMany({
    where: { classId },
    select: { teacherId: true },
  });
  return [...new Set(assigns.map((a) => a.teacherId))];
}
