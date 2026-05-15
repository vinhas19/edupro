import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { NotificationChannel } from "@prisma/client";

const channelEnum = z.enum(["IN_APP", "PUSH", "EMAIL", "SMS"]);
const channelArray = z.array(channelEnum);

const patchSchema = z.object({
  scheduleChanges: channelArray.optional(),
  lessonCancelled: channelArray.optional(),
  absences: channelArray.optional(),
  justifications: channelArray.optional(),
  grades: channelArray.optional(),
  assignments: channelArray.optional(),
  messages: channelArray.optional(),
  announcements: channelArray.optional(),
  fctPapMilestones: channelArray.optional(),
  substitutions: channelArray.optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
});

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
} satisfies Record<string, NotificationChannel[]>;

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pref = await prisma.notificationPreference.findUnique({
    where: { userId: session.user.id },
  });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phoneE164: true, phoneVerified: true },
  });

  if (!pref) {
    return NextResponse.json({
      ...DEFAULTS,
      quietHoursStart: null,
      quietHoursEnd: null,
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
      phoneE164: user?.phoneE164 ?? null,
      phoneVerified: user?.phoneVerified ?? false,
    });
  }

  return NextResponse.json({
    scheduleChanges: pref.scheduleChanges,
    lessonCancelled: pref.lessonCancelled,
    absences: pref.absences,
    justifications: pref.justifications,
    grades: pref.grades,
    assignments: pref.assignments,
    messages: pref.messages,
    announcements: pref.announcements,
    fctPapMilestones: pref.fctPapMilestones,
    substitutions: pref.substitutions,
    quietHoursStart: pref.quietHoursStart,
    quietHoursEnd: pref.quietHoursEnd,
    emailEnabled: pref.emailEnabled,
    smsEnabled: pref.smsEnabled,
    pushEnabled: pref.pushEnabled,
    phoneE164: user?.phoneE164 ?? null,
    phoneVerified: user?.phoneVerified ?? false,
  });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  }

  const data = parsed.data;

  // Upsert: cria com os defaults + overrides do utilizador
  const pref = await prisma.notificationPreference.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      ...DEFAULTS,
      ...data,
    },
    update: data,
  });

  return NextResponse.json({ ok: true, preference: pref });
}
