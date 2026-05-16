import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canSendMessage } from "@/lib/messaging-permissions";
import { NewMessageComposer } from "@/components/messages/new-message-composer";

export default async function NewMessagePage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { to } = await searchParams;
  if (!to) redirect("/dashboard/messages");

  const recipient = await prisma.user.findUnique({
    where: { id: to },
    select: { id: true, name: true, email: true, role: true, schoolId: true },
  });
  if (!recipient || recipient.schoolId !== session.user.schoolId) notFound();

  const allowed = await canSendMessage(session.user.id, session.user.role, to, session.user.schoolId);
  if (!allowed) {
    return (
      <div className="space-y-4 max-w-md mx-auto">
        <h1 className="text-xl font-bold">Permissão negada</h1>
        <p className="text-sm text-muted-foreground">Não podes contactar este utilizador.</p>
      </div>
    );
  }

  // Se já existe conversa, redireciona para lá
  const [u1, u2] = [session.user.id, to].sort();
  const existing = await prisma.conversation.findUnique({
    where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
  });
  if (existing) redirect(`/dashboard/messages/${existing.id}`);

  return <NewMessageComposer recipient={recipient} />;
}
