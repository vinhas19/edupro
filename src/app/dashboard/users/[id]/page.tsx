import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole, ROLE_LABELS } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Calendar } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { UserActions } from "@/components/users/user-actions";
import { NewConversationButton } from "@/components/messages/new-conversation-button";
import { Pencil } from "lucide-react";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) redirect("/dashboard");

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      directedClasses: { select: { id: true, name: true } },
      directedCourses: { select: { id: true, name: true } },
      enrollments: { include: { class: { include: { course: { select: { name: true } } } } } },
      taughtSubjectAssignments: {
        include: {
          subject: { select: { name: true } },
          class: { select: { name: true } },
        },
      },
    },
  });

  if (!user || user.schoolId !== session.user.schoolId) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/users"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            {!user.active && <Badge variant="outline" className="text-muted-foreground">Inativo</Badge>}
          </div>
          <p className="text-muted-foreground text-sm">{ROLE_LABELS[user.role]}</p>
        </div>
        <div className="flex gap-2">
          {user.id !== session.user.id && <NewConversationButton recipientId={user.id} />}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/users/${user.id}/edit`}><Pencil className="mr-1.5 h-3.5 w-3.5" />Editar</Link>
          </Button>
          <UserActions userId={user.id} active={user.active} isSelf={user.id === session.user.id} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{user.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Conta criada em {format(new Date(user.createdAt), "d 'de' MMMM 'de' yyyy", { locale: pt })}</span>
          </div>
        </CardContent>
      </Card>

      {user.directedCourses.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Cursos que dirige</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {user.directedCourses.map((c) => <li key={c.id}>· {c.name}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      {user.directedClasses.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Turmas que dirige</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {user.directedClasses.map((c) => <li key={c.id}>· {c.name}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      {user.taughtSubjectAssignments.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Disciplinas leccionadas</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {user.taughtSubjectAssignments.map((a) => (
                <li key={a.id}>· {a.subject.name} — {a.class.name}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {user.enrollments.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Matrículas</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {user.enrollments.map((e) => (
                <li key={e.id}>· {e.class.name} — {e.class.course.name} <Badge variant="outline" className="ml-2 text-xs">{e.status}</Badge></li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
