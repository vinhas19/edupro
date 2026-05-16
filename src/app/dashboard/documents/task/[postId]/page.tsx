import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { canReadClass, canWriteToSubjectFolder } from "@/lib/docs-permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Calendar, BookOpen } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { StudentSubmitPanel } from "@/components/documents/student-submit-panel";
import { TeacherGradingPanel } from "@/components/documents/teacher-grading-panel";
import { AttachmentChip } from "@/components/files/attachment-chip";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { postId } = await params;

  const post = await prisma.classroomPost.findUnique({
    where: { id: postId },
    include: {
      class: { include: { course: { select: { schoolId: true } } } },
      subject: { select: { id: true, name: true } },
      module: { select: { id: true, name: true, number: true } },
      author: { select: { name: true } },
      attachments: true,
    },
  });
  if (!post || post.type !== "ASSIGNMENT" || post.class.course.schoolId !== session.user.schoolId) {
    notFound();
  }

  const ok = await canReadClass(session.user.id, session.user.role, session.user.schoolId, post.classId);
  if (!ok) notFound();

  const canGrade = await canWriteToSubjectFolder(
    session.user.id,
    session.user.role,
    session.user.schoolId,
    post.classId,
    post.subjectId,
  );

  const isStudent = session.user.role === Role.STUDENT;
  const isGuardian = session.user.role === Role.GUARDIAN;

  // Student's own submission
  const ownSubmission = isStudent
    ? await prisma.submission.findUnique({
        where: { postId_studentId: { postId, studentId: session.user.id } },
        include: { files: true },
      })
    : null;

  // All submissions (teachers/DT/admin)
  const allSubmissions = canGrade
    ? await prisma.submission.findMany({
        where: { postId },
        include: {
          student: { select: { id: true, name: true, email: true } },
          files: { select: { id: true, name: true, url: true, size: true, mimeType: true, createdAt: true } },
        },
        orderBy: { student: { name: "asc" } },
      })
    : [];

  const backHref = post.module
    ? `/dashboard/documents/${post.classId}/${post.subjectId}/${post.module.id}`
    : `/dashboard/documents/${post.classId}`;

  const now = new Date();
  const isOverdue = post.dueDate ? now > post.dueDate : false;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={backHref}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-orange)] mb-0.5">
            Tarefa · {post.class.name} · {post.subject?.name}
            {post.module && ` · M${post.module.number}`}
          </div>
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.022em]">{post.title}</h1>
          <p className="text-[12px] text-[var(--muted-foreground)]">
            Criada por {post.author.name} em {format(post.createdAt, "d MMM yyyy", { locale: pt })}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-[13px]">
            {post.dueDate && (
              <span className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                <Clock className="h-3.5 w-3.5" />
                Entrega até {format(post.dueDate, "d 'de' MMMM yyyy, HH:mm", { locale: pt })}
              </span>
            )}
            {post.maxGrade != null && (
              <Badge variant="outline" className="tabular-nums">até {post.maxGrade} valores</Badge>
            )}
            {post.countsForModule && (
              <Badge variant="outline" className="text-[var(--tint-purple)]">
                <BookOpen className="mr-1 h-3 w-3" />Conta para módulo
              </Badge>
            )}
            {!post.allowLate && (
              <Badge variant="outline" className="text-[var(--destructive)]">
                Sem entregas atrasadas
              </Badge>
            )}
            {isOverdue && (
              <Badge variant="outline" className="text-[var(--destructive)]">
                <Calendar className="mr-1 h-3 w-3" />Prazo expirado
              </Badge>
            )}
          </div>

          {post.content && (
            <div className="text-[14px] whitespace-pre-wrap">{post.content}</div>
          )}

          {post.attachments.length > 0 && (
            <div className="pt-2 border-t border-[var(--separator)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--muted-foreground)] mb-1.5">
                Anexos do professor
              </p>
              <div className="flex flex-wrap gap-1.5">
                {post.attachments.map((a) => (
                  <AttachmentChip key={a.id} name={a.name} url={a.url} />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isStudent && (
        <StudentSubmitPanel
          postId={post.id}
          isOverdue={isOverdue}
          allowLate={post.allowLate}
          existing={ownSubmission
            ? {
                id: ownSubmission.id,
                status: ownSubmission.status,
                submittedAt: ownSubmission.submittedAt,
                grade: ownSubmission.grade,
                feedback: ownSubmission.feedback,
                files: ownSubmission.files.map((f) => ({ id: f.id, name: f.name, url: f.url })),
              }
            : null}
        />
      )}

      {isGuardian && (
        <Card>
          <CardContent className="p-4 text-[13px] text-[var(--muted-foreground)]">
            Os encarregados podem ver os trabalhos dos educandos mas não submeter em seu nome.
          </CardContent>
        </Card>
      )}

      {canGrade && (
        <TeacherGradingPanel
          postId={post.id}
          maxGrade={post.maxGrade ?? 20}
          submissions={allSubmissions.map((s) => ({
            id: s.id,
            studentId: s.student.id,
            studentName: s.student.name,
            status: s.status,
            submittedAt: s.submittedAt,
            grade: s.grade,
            feedback: s.feedback,
            files: s.files.map((f) => ({ id: f.id, name: f.name, url: f.url })),
          }))}
        />
      )}
    </div>
  );
}
