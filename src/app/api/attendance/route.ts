import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const upsertSchema = z.object({
  lessonId: z.string(),
  records: z.array(z.object({
    studentId: z.string(),
    status: z.enum(["PRESENT", "ABSENT", "JUSTIFIED", "LATE"]),
    notes: z.string().optional(),
  })),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { lessonId, records } = parsed.data;

  // Upsert all records
  const results = await prisma.$transaction(
    records.map((r) =>
      prisma.attendanceRecord.upsert({
        where: { lessonId_studentId: { lessonId, studentId: r.studentId } },
        create: { lessonId, studentId: r.studentId, status: r.status, notes: r.notes },
        update: { status: r.status, notes: r.notes },
      })
    )
  );

  return NextResponse.json(results, { status: 201 });
}
