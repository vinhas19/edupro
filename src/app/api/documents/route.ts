import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, DocumentCategory, DocumentAccess } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum([
    "MINUTES",
    "REGULATIONS",
    "PLANIFICATIONS",
    "STUDENT_FILES",
    "FCT_DOCS",
    "PAP_DOCS",
    "OTHER",
  ]),
  accessLevel: z.enum(["PUBLIC", "STUDENT", "STAFF", "ADMIN"]),
  fileUrl: z.string().url(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.TEACHER)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const doc = await prisma.document.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category as DocumentCategory,
      accessLevel: parsed.data.accessLevel as DocumentAccess,
      fileUrl: parsed.data.fileUrl,
      schoolId: session.user.schoolId,
      uploaderId: session.user.id,
    },
  });

  return NextResponse.json({ id: doc.id }, { status: 201 });
}
