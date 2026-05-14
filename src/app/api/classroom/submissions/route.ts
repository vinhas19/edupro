import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SubmissionStatus } from "@prisma/client";
import { z } from "zod";

// Student submits work
const submitSchema = z.object({
  postId: z.string(),
  fileIds: z.array(z.string()).optional(),
  comment: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const post = await prisma.classroomPost.findUnique({
    where: { id: parsed.data.postId },
    include: { class: true },
  });
  if (!post || post.type !== "ASSIGNMENT") {
    return NextResponse.json({ error: "Trabalho inválido" }, { status: 400 });
  }

  // Verify student is enrolled in the class
  const enrollment = await prisma.enrollment.findFirst({
    where: { classId: post.classId, studentId: session.user.id, status: "ACTIVE" },
  });
  if (!enrollment) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const isLate = post.dueDate ? now > post.dueDate : false;

  const submission = await prisma.submission.upsert({
    where: { postId_studentId: { postId: parsed.data.postId, studentId: session.user.id } },
    create: {
      postId: parsed.data.postId,
      studentId: session.user.id,
      status: isLate ? SubmissionStatus.LATE : SubmissionStatus.SUBMITTED,
      submittedAt: now,
    },
    update: {
      status: isLate ? SubmissionStatus.LATE : SubmissionStatus.SUBMITTED,
      submittedAt: now,
    },
  });

  if (parsed.data.fileIds?.length) {
    await prisma.file.updateMany({
      where: { id: { in: parsed.data.fileIds }, ownerId: session.user.id },
      data: { submissionId: submission.id, visibility: "SUBMISSION" },
    });
  }

  if (parsed.data.comment?.trim()) {
    await prisma.privateComment.create({
      data: {
        submissionId: submission.id,
        senderId: session.user.id,
        content: parsed.data.comment.trim(),
      },
    });
  }

  return NextResponse.json({ id: submission.id });
}
