import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let configured = false;
function ensureConfigured() {
  if (configured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@lectiva.local";
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  if (!ensureConfigured()) {
    console.warn("[push] VAPID keys not configured; skipping push");
    return { sent: 0, failed: 0 };
  }
  if (userIds.length === 0) return { sent: 0, failed: 0 };

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  });

  let sent = 0;
  let failed = 0;
  const toDelete: string[] = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
        );
        sent++;
      } catch (err: unknown) {
        failed++;
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) toDelete.push(s.id);
      }
    }),
  );

  if (toDelete.length) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: toDelete } } });
  }

  return { sent, failed };
}
