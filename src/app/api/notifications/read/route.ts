import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { receiptId } = await req.json();

  await prisma.notificationRecipient.updateMany({
    where: { id: receiptId, recipientId: session.user.id },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
