import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Role, FileVisibility } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { presignUpload, buildKey, R2_CONFIGURED, R2_BUCKET } from "@/lib/r2";
import { z } from "zod";

const VISIBILITIES = [
  "PRIVATE",
  "STAFF_SHARED",
  "ADMIN_SHARED",
  "CLASS_SHARED",
  "POST_ATTACHMENT",
  "SUBMISSION",
] as const;

const schema = z.object({
  name: z.string().min(1).max(255),
  contentType: z.string().min(1),
  size: z.number().int().positive().max(64 * 1024 * 1024),
  visibility: z.enum(VISIBILITIES),
});

function authorizeUpload(role: Role, visibility: (typeof VISIBILITIES)[number]) {
  switch (visibility) {
    case "PRIVATE":
    case "SUBMISSION":
      return true; // anyone signed in
    case "STAFF_SHARED":
    case "POST_ATTACHMENT":
    case "CLASS_SHARED":
      return hasRole(role, Role.TEACHER);
    case "ADMIN_SHARED":
      return hasRole(role, Role.SCHOOL_ADMIN);
    default:
      return false;
  }
}

function scopeFor(visibility: (typeof VISIBILITIES)[number]) {
  switch (visibility) {
    case "PRIVATE": return "personal";
    case "STAFF_SHARED": return "staff";
    case "ADMIN_SHARED": return "admin";
    case "POST_ATTACHMENT": return "posts";
    case "CLASS_SHARED": return "class";
    case "SUBMISSION": return "submissions";
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!R2_CONFIGURED) {
    return NextResponse.json(
      { error: "R2 não configurado. Define R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY e R2_PUBLIC_URL no .env" },
      { status: 503 }
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  if (!authorizeUpload(session.user.role, parsed.data.visibility)) {
    return NextResponse.json({ error: "Forbidden for this visibility" }, { status: 403 });
  }

  const key = buildKey(session.user.id, parsed.data.name, scopeFor(parsed.data.visibility));
  const uploadUrl = await presignUpload(key, parsed.data.contentType);

  return NextResponse.json({
    uploadUrl,
    key,
    bucket: R2_BUCKET,
  });
}
