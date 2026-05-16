import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { receiptId, all } = body as { receiptId?: string; all?: boolean };

  if (all) {
    const result = await prisma.notificationRecipient.updateMany({
      where: { recipientId: session.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ ok: true, count: result.count });
  }

  if (!receiptId) {
    return NextResponse.json({ error: "Missing receiptId" }, { status: 400 });
  }

  await prisma.notificationRecipient.updateMany({
    where: { id: receiptId, recipientId: session.user.id },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
