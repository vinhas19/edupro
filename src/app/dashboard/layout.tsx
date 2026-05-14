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

  const unreadCount = await prisma.notificationRecipient.count({
    where: { recipientId: session.user.id, readAt: null },
  });

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        userRole={session.user.role}
        schoolName={school.name}
        schoolLogo={school.logoUrl}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          userName={session.user.name}
          userEmail={session.user.email}
          userRole={session.user.role}
          userImage={session.user.image}
          unreadCount={unreadCount}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
