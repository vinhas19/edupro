import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const school = await prisma.school.findUnique({
    where: { id: session.user.schoolId },
  });
  if (!school) redirect("/login");

  const [unreadNotifications, unreadMessages] = await Promise.all([
    prisma.notificationRecipient.count({
      where: { recipientId: session.user.id, readAt: null },
    }),
    prisma.message.count({
      where: {
        conversation: {
          OR: [{ user1Id: session.user.id }, { user2Id: session.user.id }],
        },
        senderId: { not: session.user.id },
        readAt: null,
      },
    }),
  ]);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[var(--background)]">
      <Sidebar
        userRole={session.user.role}
        userName={session.user.name}
        userEmail={session.user.email}
        schoolName={school.name}
        unreadMessages={unreadMessages}
        unreadNotifications={unreadNotifications}
      />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Topbar
          userName={session.user.name}
          userEmail={session.user.email}
          userRole={session.user.role}
        />
        <main className="flex-1 overflow-y-auto bg-transparent p-4 sm:p-6 lg:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}
