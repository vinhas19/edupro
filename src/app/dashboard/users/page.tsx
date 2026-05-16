import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import Link from "next/link";
import { UsersListFilter } from "@/components/users/users-list-filter";

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role, schoolId } = session.user;
  if (!hasRole(role, Role.SCHOOL_ADMIN)) redirect("/dashboard");

  const users = await prisma.user.findMany({
    where: { schoolId },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });

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

      <UsersListFilter users={users} />
    </div>
  );
}
