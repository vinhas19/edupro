import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { findAvailableSubstitutes } from "@/lib/schedule";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  subjectId: z.string(),
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string(),
  endTime: z.string(),
  excludeTeacherId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.CLASS_DIRECTOR)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const teachers = await findAvailableSubstitutes({
    schoolId: session.user.schoolId,
    ...parsed.data,
  });

  return NextResponse.json(teachers);
}
