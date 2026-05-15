import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FileVisibility } from "@prisma/client";
import { publicUrl } from "@/lib/r2";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  key: z.string().min(1),
  size: z.number().int().positive(),
  mimeType: z.string().min(1),
  visibility: z.enum([
    "PRIVATE",
    "STAFF_SHARED",
    "ADMIN_SHARED",
    "CLASS_SHARED",
    "POST_ATTACHMENT",
    "SUBMISSION",
  ]),
  classId: z.string().optional(),
  subjectId: z.string().optional(),
  moduleId: z.string().optional(),
  folderId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  // Defensive: ensure the key belongs to this user (it includes user id from buildKey)
  if (!parsed.data.key.includes(session.user.id)) {
    return NextResponse.json({ error: "Bad key" }, { status: 400 });
  }

  const file = await prisma.file.create({
    data: {
      name: parsed.data.name,
      storageKey: parsed.data.key,
      url: publicUrl(parsed.data.key),
      size: parsed.data.size,
      mimeType: parsed.data.mimeType,
      ownerId: session.user.id,
      visibility: parsed.data.visibility as FileVisibility,
      classId: parsed.data.classId,
      subjectId: parsed.data.subjectId,
      moduleId: parsed.data.moduleId,
      folderId: parsed.data.folderId,
    },
  });

  return NextResponse.json({ id: file.id, url: file.url, name: file.name });
}
