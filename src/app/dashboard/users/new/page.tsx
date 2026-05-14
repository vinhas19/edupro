import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import { NewUserForm } from "@/components/users/new-user-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NewUserPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.SCHOOL_ADMIN)) redirect("/dashboard");

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/users"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Novo Utilizador</h1>
          <p className="text-muted-foreground text-sm">Criar uma nova conta na escola</p>
        </div>
      </div>
      <NewUserForm />
    </div>
  );
}
