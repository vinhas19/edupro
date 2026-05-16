import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole, isTeachingRole } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format, isPast, formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { ClipboardList, Megaphone, Calendar, CheckCircle, Clock, AlertTriangle } from "lucide-react";

const STATUS_META = {
  NOT_SUBMITTED: { label: "Por entregar", color: "text-muted-foreground", bg: "bg-muted/50" },
  SUBMITTED: { label: "Entregue", color: "text-blue-700", bg: "bg-blue-50" },
  LATE: { label: "Entregue (atrasado)", color: "text-orange-700", bg: "bg-orange-50" },
  RETURNED: { label: "Devolvido", color: "text-purple-700", bg: "bg-purple-50" },
  GRADED: { label: "Avaliado", color: "text-green-700", bg: "bg-green-50" },
} as const;

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: userId, role, schoolId } = session.user;
  const { filter = "all" } = await searchParams;

  // ─── STUDENT — só os SEUS trabalhos por entrega ─────────────────────────
  if (role === Role.STUDENT) {
    const submissions = await prisma.submission.findMany({
      where: { studentId: userId },
      include: {
        post: {
          include: {
            class: { select: { id: true, name: true, course: { select: { code: true } } } },
            subject: { select: { name: true } },
            author: { select: { name: true } },
          },
        },
      },
      orderBy: { post: { dueDate: "asc" } },
    });

    const filtered = submissions.filter((s) => {
      if (filter === "pending") return s.status === "NOT_SUBMITTED";
      if (filter === "submitted") return ["SUBMITTED", "LATE"].includes(s.status);
      if (filter === "graded") return s.status === "GRADED";
      return true;
    });

    const pending = submissions.filter((s) => s.status === "NOT_SUBMITTED").length;
    const submitted = submissions.filter((s) => ["SUBMITTED", "LATE"].includes(s.status)).length;
    const graded = submissions.filter((s) => s.status === "GRADED").length;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Os meus trabalhos</h1>
          <p className="text-muted-foreground text-sm">
            {pending} por entregar · {submitted} entregues · {graded} avaliados
          </p>
        </div>

        <FilterTabs current={filter} options={[
          { id: "all", label: "Todos", count: submissions.length },
          { id: "pending", label: "Por entregar", count: pending },
          { id: "submitted", label: "Entregues", count: submitted },
          { id: "graded", label: "Avaliados", count: graded },
        ]} />

        {filtered.length === 0 ? (
          <EmptyState message={
            filter === "pending" ? "Sem trabalhos por entregar! 🎉" :
            filter === "submitted" ? "Ainda não entregaste nenhum trabalho." :
            filter === "graded" ? "Nenhum trabalho avaliado ainda." :
            "Sem trabalhos atribuídos."
          } />
        ) : (
          <div className="space-y-2">
            {filtered.map((sub) => {
              const meta = STATUS_META[sub.status];
              const overdue = sub.post.dueDate && isPast(new Date(sub.post.dueDate)) && sub.status === "NOT_SUBMITTED";
              return (
                <Link
                  key={sub.id}
                  href={`/dashboard/documents/task/${sub.post.id}`}
                  className="block rounded-lg border hover:shadow-sm transition-shadow bg-card"
                >
                  <div className="flex items-start gap-3 p-4">
                    <div className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                      <ClipboardList className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{sub.post.title ?? "Trabalho sem título"}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {sub.post.class.name}
                        {sub.post.subject && ` · ${sub.post.subject.name}`}
                        {" · "}{sub.post.author.name}
                      </p>
                      {sub.post.dueDate && (
                        <p className={`text-xs mt-1 inline-flex items-center gap-1 ${overdue ? "text-red-600" : "text-muted-foreground"}`}>
                          <Calendar className="h-3 w-3" />
                          Prazo: {format(new Date(sub.post.dueDate), "d MMM, HH:mm", { locale: pt })}
                          {overdue && " (atrasado)"}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.bg} ${meta.color}`}>
                        {sub.status === "GRADED" && <CheckCircle className="h-3 w-3" />}
                        {sub.status === "NOT_SUBMITTED" && <Clock className="h-3 w-3" />}
                        {(sub.status === "SUBMITTED" || sub.status === "LATE") && <CheckCircle className="h-3 w-3" />}
                        {meta.label}
                      </span>
                      {sub.grade != null && (
                        <span className="text-sm font-bold text-green-700">{sub.grade}/{sub.post.maxGrade ?? 20}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── TEACHER / DT / Admin — só os trabalhos QUE CRIARAM (e avisos) ───────
  if (!isTeachingRole(role) && !hasRole(role, Role.SCHOOL_ADMIN)) {
    redirect("/dashboard");
  }

  const isAdmin = hasRole(role, Role.SCHOOL_ADMIN);

  const posts = await prisma.classroomPost.findMany({
    where: {
      class: { course: { schoolId } },
      // Admin vê tudo; staff só os seus
      ...(isAdmin ? {} : { authorId: userId }),
      ...(filter === "announcements" ? { type: "ANNOUNCEMENT" } : {}),
      ...(filter === "assignments" ? { type: "ASSIGNMENT" } : {}),
    },
    include: {
      class: { select: { name: true, course: { select: { code: true } } } },
      subject: { select: { name: true } },
      author: { select: { name: true } },
      submissions: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const assignments = posts.filter((p) => p.type === "ASSIGNMENT");
  const announcements = posts.filter((p) => p.type === "ANNOUNCEMENT");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{isAdmin ? "Trabalhos & Avisos" : "Os meus trabalhos & avisos"}</h1>
        <p className="text-muted-foreground text-sm">
          {assignments.length} trabalhos · {announcements.length} avisos
        </p>
      </div>

      <FilterTabs current={filter} options={[
        { id: "all", label: "Todos", count: posts.length },
        { id: "assignments", label: "Trabalhos", count: assignments.length },
        { id: "announcements", label: "Avisos", count: announcements.length },
      ]} />

      {posts.length === 0 ? (
        <EmptyState message={isAdmin ? "Sem publicações na escola." : "Ainda não criaste nenhuma publicação."} />
      ) : (
        <div className="space-y-2">
          {posts.map((p) => {
            const submitted = p.submissions.filter((s) => s.status !== "NOT_SUBMITTED").length;
            const graded = p.submissions.filter((s) => s.status === "GRADED").length;
            const total = p.submissions.length;
            const isAssignment = p.type === "ASSIGNMENT";
            const overdue = p.dueDate && isPast(new Date(p.dueDate));
            return (
              <Link
                key={p.id}
                href={isAssignment ? `/dashboard/classes/${p.classId}/assignment/${p.id}` : `/dashboard/classes/${p.classId}`}
                className="block rounded-lg border hover:shadow-sm transition-shadow bg-card"
              >
                <div className="flex items-start gap-3 p-4">
                  <div className={`shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg ${
                    isAssignment ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {isAssignment ? <ClipboardList className="h-4 w-4" /> : <Megaphone className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{p.title ?? (p.content?.slice(0, 60) ?? "Sem título")}</p>
                      <Badge variant="outline" className="text-[10px]">{p.class.name}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.subject && `${p.subject.name} · `}
                      {isAdmin && `${p.author.name} · `}
                      Publicado {formatDistanceToNow(new Date(p.createdAt), { locale: pt, addSuffix: true })}
                    </p>
                    {p.dueDate && isAssignment && (
                      <p className={`text-xs mt-1 inline-flex items-center gap-1 ${overdue ? "text-red-600" : "text-muted-foreground"}`}>
                        <Calendar className="h-3 w-3" />
                        Prazo: {format(new Date(p.dueDate), "d MMM, HH:mm", { locale: pt })}
                      </p>
                    )}
                  </div>
                  {isAssignment && total > 0 && (
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">Entregas</p>
                      <p className="text-sm font-bold tabular-nums">{submitted}/{total}</p>
                      {graded > 0 && (
                        <p className="text-[10px] text-green-700">{graded} avaliados</p>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterTabs({ current, options }: { current: string; options: { id: string; label: string; count: number }[] }) {
  return (
    <div className="flex gap-1 bg-muted/40 p-1 rounded-lg w-fit">
      {options.map((opt) => (
        <Link
          key={opt.id}
          href={`/dashboard/assignments${opt.id === "all" ? "" : `?filter=${opt.id}`}`}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            current === opt.id ? "bg-white shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label} <span className="ml-1 tabular-nums text-muted-foreground/80">({opt.count})</span>
        </Link>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <ClipboardList className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
