import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, PostType, SubmissionStatus } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { z } from "zod";

const schema = z.object({
  classId: z.string(),
  type: z.enum(["ANNOUNCEMENT", "MATERIAL", "ASSIGNMENT", "QUESTION"]),
  title: z.string().optional(),
  content: z.string().optional(),
  topicId: z.string().optional(),
  subjectId: z.string().optional(),
  moduleId: z.string().optional(),
  dueDate: z.string().optional(),
  maxGrade: z.number().optional(),
  countsForModule: z.boolean().optional(),
  allowLate: z.boolean().optional(),
  attachmentIds: z.array(z.string()).optional(),
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

  // Verify the teacher is allowed to post to this class
  const cls = await prisma.class.findUnique({
    where: { id: parsed.data.classId },
    include: { course: true, subjectAssignments: { where: { teacherId: session.user.id } } },
  });
  if (!cls || cls.course.schoolId !== session.user.schoolId) {
    return NextResponse.json({ error: "Class not found" }, { status: 404 });
  }
  const isDirector = cls.classDirectorId === session.user.id;
  const isTeaching = cls.subjectAssignments.length > 0;
  const isAdmin = hasRole(session.user.role, Role.SCHOOL_ADMIN);
  if (!isDirector && !isTeaching && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const post = await prisma.classroomPost.create({
    data: {
      classId: parsed.data.classId,
      type: parsed.data.type as PostType,
      title: parsed.data.title,
      content: parsed.data.content,
      topicId: parsed.data.topicId,
      subjectId: parsed.data.subjectId,
      moduleId: parsed.data.moduleId,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      maxGrade: parsed.data.maxGrade,
      countsForModule: parsed.data.countsForModule ?? false,
      allowLate: parsed.data.allowLate ?? true,
      authorId: session.user.id,
    },
  });

  // Attach files
  if (parsed.data.attachmentIds?.length) {
    await prisma.file.updateMany({
      where: { id: { in: parsed.data.attachmentIds }, ownerId: session.user.id },
      data: { postId: post.id, visibility: "POST_ATTACHMENT" },
    });
  }

  // For assignments, create empty submissions for every enrolled student
  if (parsed.data.type === "ASSIGNMENT") {
    const enrollments = await prisma.enrollment.findMany({
      where: { classId: parsed.data.classId, status: "ACTIVE" },
      select: { studentId: true },
    });
    if (enrollments.length > 0) {
      await prisma.submission.createMany({
        data: enrollments.map((e) => ({
          postId: post.id,
          studentId: e.studentId,
          status: SubmissionStatus.NOT_SUBMITTED,
        })),
        skipDuplicates: true,
      });
    }
  }

  return NextResponse.json({ id: post.id }, { status: 201 });
}
