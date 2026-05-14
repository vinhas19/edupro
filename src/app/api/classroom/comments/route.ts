import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  postId: z.string(),
  content: z.string().min(1).max(2000),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  // Verify user belongs to the class
  const post = await prisma.classroomPost.findUnique({
    where: { id: parsed.data.postId },
    include: {
      class: {
        include: {
          enrollments: { where: { studentId: session.user.id, status: "ACTIVE" } },
          subjectAssignments: { where: { teacherId: session.user.id } },
          course: true,
        },
      },
    },
  });
  if (!post || post.class.course.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const isStudent = post.class.enrollments.length > 0;
  const isTeacher = post.class.subjectAssignments.length > 0 || post.class.classDirectorId === session.user.id;
  if (!isStudent && !isTeacher) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const comment = await prisma.postComment.create({
    data: {
      postId: parsed.data.postId,
      authorId: session.user.id,
      content: parsed.data.content,
    },
  });

  return NextResponse.json({ id: comment.id }, { status: 201 });
}
