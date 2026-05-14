import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, SubmissionStatus } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { z } from "zod";

const gradeSchema = z.object({
  grade: z.number().min(0).max(20).optional(),
  feedback: z.string().optional(),
  status: z.enum(["RETURNED", "GRADED"]).optional(),
  privateComment: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(session.user.role, Role.TEACHER)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = gradeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { post: { include: { class: { include: { course: true } } } } },
  });
  if (!submission || submission.post.class.course.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const status =
    parsed.data.status ??
    (parsed.data.grade != null ? SubmissionStatus.GRADED : submission.status);

  const updated = await prisma.submission.update({
    where: { id },
    data: {
      grade: parsed.data.grade,
      feedback: parsed.data.feedback,
      status,
      reviewedAt: new Date(),
      reviewerId: session.user.id,
    },
  });

  if (parsed.data.privateComment?.trim()) {
    await prisma.privateComment.create({
      data: {
        submissionId: id,
        senderId: session.user.id,
        content: parsed.data.privateComment.trim(),
      },
    });
  }

  return NextResponse.json(updated);
}
