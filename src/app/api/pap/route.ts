import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, PapStatus, PapPhaseType, PhaseStatus } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  studentId: z.string(),
  classId: z.string(),
  advisorId: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
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

  const pap = await prisma.papRecord.create({
    data: {
      studentId: parsed.data.studentId,
      classId: parsed.data.classId,
      advisorId: parsed.data.advisorId,
      title: parsed.data.title,
      description: parsed.data.description,
      status: PapStatus.PROPOSAL,
      phases: {
        create: [
          { phase: PapPhaseType.PROPOSAL, status: PhaseStatus.IN_PROGRESS },
          { phase: PapPhaseType.DEVELOPMENT, status: PhaseStatus.PENDING },
          { phase: PapPhaseType.SUBMISSION, status: PhaseStatus.PENDING },
          { phase: PapPhaseType.PRESENTATION, status: PhaseStatus.PENDING },
        ],
      },
    },
  });

  return NextResponse.json({ id: pap.id }, { status: 201 });
}
