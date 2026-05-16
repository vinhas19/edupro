"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users as UsersIcon, X } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Role } from "@prisma/client";

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  SCHOOL_ADMIN: "Admin Escola",
  COURSE_DIRECTOR: "Diretor de Curso",
  CLASS_DIRECTOR: "Diretor de Turma",
  TEACHER: "Professor",
  STUDENT: "Aluno",
  GUARDIAN: "Encarregado",
};

const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
  SCHOOL_ADMIN: "bg-blue-100 text-blue-700 border-blue-200",
  COURSE_DIRECTOR: "bg-indigo-100 text-indigo-700 border-indigo-200",
  CLASS_DIRECTOR: "bg-teal-100 text-teal-700 border-teal-200",
  TEACHER: "bg-green-100 text-green-700 border-green-200",
  STUDENT: "bg-orange-100 text-orange-700 border-orange-200",
  GUARDIAN: "bg-pink-100 text-pink-700 border-pink-200",
};

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: Date | string;
}

interface Props {
  users: UserItem[];
}

const ROLE_FILTERS: { value: Role | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: Role.SCHOOL_ADMIN, label: "Admins" },
  { value: Role.COURSE_DIRECTOR, label: "Dir. Curso" },
  { value: Role.CLASS_DIRECTOR, label: "Dir. Turma" },
  { value: Role.TEACHER, label: "Professores" },
  { value: Role.STUDENT, label: "Alunos" },
  { value: Role.GUARDIAN, label: "Encarregados" },
];

export function UsersListFilter({ users }: Props) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [users, query, roleFilter]);

  const byRole = useMemo(() => {
    return filtered.reduce<Partial<Record<Role, UserItem[]>>>((acc, u) => {
      if (!acc[u.role]) acc[u.role] = [];
      acc[u.role]!.push(u);
      return acc;
    }, {});
  }, [filtered]);

  const roleOrder: Role[] = [
    Role.SCHOOL_ADMIN,
    Role.COURSE_DIRECTOR,
    Role.CLASS_DIRECTOR,
    Role.TEACHER,
    Role.STUDENT,
    Role.GUARDIAN,
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar por nome ou email..."
            className="pl-9 pr-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1 bg-muted/40 p-1 rounded-lg">
          {ROLE_FILTERS.map((rf) => (
            <button
              key={rf.value}
              type="button"
              onClick={() => setRoleFilter(rf.value)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                roleFilter === rf.value
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {rf.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} de {users.length} utilizadores
      </p>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <UsersIcon className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="font-medium">Sem resultados</p>
            <p className="text-sm text-muted-foreground">
              {query ? `Nenhum utilizador corresponde a "${query}".` : "Sem utilizadores nesta categoria."}
            </p>
          </CardContent>
        </Card>
      ) : (
        roleOrder.map((r) => {
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
                        <span className="text-xs text-muted-foreground hidden sm:inline">
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
        })
      )}
    </div>
  );
}
