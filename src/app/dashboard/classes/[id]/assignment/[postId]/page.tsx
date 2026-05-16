import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { SubmissionReview } from "@/components/classroom/submission-review";
import { AttachmentChip } from "@/components/files/attachment-chip";

export default async function AssignmentReviewPage({
  params,
}: {
  params: Promise<{ id: string; postId: string }>;
}) {
  const { id, postId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.TEACHER)) redirect("/dashboard");

  const post = await prisma.classroomPost.findUnique({
    where: { id: postId },
    include: {
      class: { include: { course: true } },
      author: { select: { name: true } },
      attachments: true,
      submissions: {
        include: {
          student: { select: { id: true, name: true } },
          files: true,
        },
        orderBy: [{ status: "asc" }, { student: { name: "asc" } }],
      },
    },
  });

  if (!post || post.classId !== id || post.class.course.schoolId !== session.user.schoolId) {
    notFound();
  }

  if (post.type !== "ASSIGNMENT") redirect(`/dashboard/classes/${id}`);

  const submitted = post.submissions.filter((s) => s.status !== "NOT_SUBMITTED");
  const notSubmitted = post.submissions.filter((s) => s.status === "NOT_SUBMITTED");
  const graded = post.submissions.filter((s) => s.status === "GRADED").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/classes/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{post.title ?? "Trabalho"}</h1>
          <p className="text-muted-foreground text-sm">{post.class.name}</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-5 space-y-3">
          {post.content && <p className="text-sm whitespace-pre-wrap">{post.content}</p>}
          {post.dueDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-3.5 w-3.5" />
              Prazo: {format(new Date(post.dueDate), "d MMM yyyy, HH:mm", { locale: pt })}
            </div>
          )}
          {post.attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.attachments.map((f) => (
                <AttachmentChip key={f.id} name={f.name} url={f.url} />
              ))}
            </div>
          )}
          <div className="flex gap-3 pt-2 border-t text-xs text-muted-foreground">
            <span>Total: <strong className="text-foreground">{post.submissions.length}</strong></span>
            <span>Entregues: <strong className="text-foreground">{submitted.length}</strong></span>
            <span>Avaliados: <strong className="text-foreground">{graded}</strong></span>
            <span>Por entregar: <strong className="text-foreground">{notSubmitted.length}</strong></span>
          </div>
        </CardContent>
      </Card>

      {submitted.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-base font-semibold">Entregas ({submitted.length})</h2>
          {submitted.map((s) => (
            <SubmissionReview key={s.id} submission={s} maxGrade={post.maxGrade} />
          ))}
        </div>
      )}

      {notSubmitted.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-muted-foreground">Por entregar ({notSubmitted.length})</h2>
          <Card>
            <CardContent className="pt-5">
              <ul className="space-y-1.5">
                {notSubmitted.map((s) => (
                  <li key={s.id} className="flex items-center justify-between text-sm py-1">
                    <span>{s.student.name}</span>
                    <Badge variant="outline" className="text-xs">Não entregue</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
