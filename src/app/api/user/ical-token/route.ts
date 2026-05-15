import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateICalToken } from "@/lib/ical";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = generateICalToken();
  await prisma.user.update({
    where: { id: session.user.id },
    data: { iCalToken: token },
  });

  return NextResponse.json({ token });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.user.update({
    where: { id: session.user.id },
    data: { iCalToken: null },
  });
  return NextResponse.json({ ok: true });
}
