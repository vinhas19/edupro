import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { EditUserForm } from "@/components/users/edit-user-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) redirect("/dashboard");

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.schoolId !== session.user.schoolId) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/users/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Editar Utilizador</h1>
          <p className="text-muted-foreground text-sm">{user.name} · {user.email}</p>
        </div>
      </div>
      <EditUserForm
        user={{ id: user.id, name: user.name, role: user.role, active: user.active }}
        isSelf={user.id === session.user.id}
      />
    </div>
  );
}
