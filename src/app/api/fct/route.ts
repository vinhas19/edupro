import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, FctStatus } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  studentId: z.string(),
  classId: z.string(),
  companyName: z.string().min(1),
  supervisorName: z.string().optional(),
  supervisorEmail: z.string().email().optional().or(z.literal("")),
  startDate: z.string(),
  endDate: z.string(),
  requiredHours: z.number().int().positive(),
  notes: z.string().optional(),
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

  const fct = await prisma.fctRecord.create({
    data: {
      studentId: parsed.data.studentId,
      classId: parsed.data.classId,
      companyName: parsed.data.companyName,
      supervisorName: parsed.data.supervisorName || null,
      supervisorEmail: parsed.data.supervisorEmail || null,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      requiredHours: parsed.data.requiredHours,
      completedHours: 0,
      status: FctStatus.PLANNED,
      notes: parsed.data.notes,
    },
  });

  return NextResponse.json({ id: fct.id }, { status: 201 });
}
