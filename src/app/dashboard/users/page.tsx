import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  SCHOOL_ADMIN: "Admin Escola",
  COURSE_DIRECTOR: "Diretor de Curso",
  CLASS_DIRECTOR: "Diretor de Turma",
  TEACHER: "Professor",
  STUDENT: "Aluno",
};

const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
  SCHOOL_ADMIN: "bg-blue-100 text-blue-700 border-blue-200",
  COURSE_DIRECTOR: "bg-indigo-100 text-indigo-700 border-indigo-200",
  CLASS_DIRECTOR: "bg-teal-100 text-teal-700 border-teal-200",
  TEACHER: "bg-green-100 text-green-700 border-green-200",
  STUDENT: "bg-orange-100 text-orange-700 border-orange-200",
};

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role, schoolId } = session.user;
  if (!hasRole(role, Role.SCHOOL_ADMIN)) redirect("/dashboard");

  const users = await prisma.user.findMany({
    where: { schoolId },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  const byRole = users.reduce<Partial<Record<Role, typeof users>>>((acc, u) => {
    if (!acc[u.role]) acc[u.role] = [];
    acc[u.role]!.push(u);
    return acc;
  }, {});

  const roleOrder: Role[] = [
    Role.SCHOOL_ADMIN,
    Role.COURSE_DIRECTOR,
    Role.CLASS_DIRECTOR,
    Role.TEACHER,
    Role.STUDENT,
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Utilizadores</h1>
          <p className="text-muted-foreground">{users.length} utilizadores registados</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/users/new">
            <UserPlus className="mr-2 h-4 w-4" />
            Novo Utilizador
          </Link>
        </Button>
      </div>

      {roleOrder.map((r) => {
        const group = byRole[r];
        if (!group?.length) return null;
        return (
          <div key={r} className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={ROLE_COLORS[r]}>
                {ROLE_LABELS[r]}
              </Badge>
              <span className="text-sm text-muted-foreground">{group.length}</span>
            </div>
            <div className="space-y-1.5">
              {group.map((user) => (
                <Card key={user.id}>
                  <CardContent className="flex items-center gap-4 py-3">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-muted-foreground">
                        {user.name?.charAt(0).toUpperCase() ?? "?"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!user.active && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Inativo
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(user.createdAt), "d MMM yyyy", { locale: pt })}
                      </span>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/users/${user.id}`}>Ver</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {users.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="font-medium">Sem utilizadores</p>
            <p className="text-sm text-muted-foreground">Ainda não existem utilizadores registados.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
