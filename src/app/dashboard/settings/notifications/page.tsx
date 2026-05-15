import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PreferencesForm } from "@/components/notifications/preferences-form";
import { NotificationsToggle } from "@/components/settings/notifications-toggle";

const DEFAULTS = {
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
} as const;

type Channel = "IN_APP" | "PUSH" | "EMAIL" | "SMS";

function asChannelArray(value: unknown, fallback: readonly Channel[]): Channel[] {
  if (!Array.isArray(value)) return [...fallback];
  const valid = value.filter(
    (c): c is Channel => typeof c === "string" && ["IN_APP", "PUSH", "EMAIL", "SMS"].includes(c),
  );
  return valid.length > 0 ? valid : [...fallback];
}

export default async function NotificationSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [pref, user] = await Promise.all([
    prisma.notificationPreference.findUnique({
      where: { userId: session.user.id },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { phoneE164: true, phoneVerified: true },
    }),
  ]);

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;

  const initial = {
    scheduleChanges: asChannelArray(pref?.scheduleChanges, DEFAULTS.scheduleChanges),
    lessonCancelled: asChannelArray(pref?.lessonCancelled, DEFAULTS.lessonCancelled),
    absences: asChannelArray(pref?.absences, DEFAULTS.absences),
    justifications: asChannelArray(pref?.justifications, DEFAULTS.justifications),
    grades: asChannelArray(pref?.grades, DEFAULTS.grades),
    assignments: asChannelArray(pref?.assignments, DEFAULTS.assignments),
    messages: asChannelArray(pref?.messages, DEFAULTS.messages),
    announcements: asChannelArray(pref?.announcements, DEFAULTS.announcements),
    fctPapMilestones: asChannelArray(pref?.fctPapMilestones, DEFAULTS.fctPapMilestones),
    substitutions: asChannelArray(pref?.substitutions, DEFAULTS.substitutions),
    quietHoursStart: pref?.quietHoursStart ?? null,
    quietHoursEnd: pref?.quietHoursEnd ?? null,
    emailEnabled: pref?.emailEnabled ?? true,
    smsEnabled: pref?.smsEnabled ?? true,
    pushEnabled: pref?.pushEnabled ?? true,
    phoneE164: user?.phoneE164 ?? null,
    phoneVerified: user?.phoneVerified ?? false,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notificações</h1>
        <p className="text-muted-foreground">
          Escolhe como queres ser notificado em cada situação.
        </p>
      </div>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="text-base font-semibold mb-2">Push neste dispositivo</h2>
        <NotificationsToggle publicKey={publicKey} />
      </section>

      <PreferencesForm initial={initial} />
    </div>
  );
}
