import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { listMessageableUsers } from "@/lib/messaging-permissions";
import { MessagesList } from "@/components/messages/messages-list";

export default async function MessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  const [conversations, unreadCounts, messageableUsers] = await Promise.all([
    prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        schoolId: session.user.schoolId,
      },
      include: {
        user1: { select: { id: true, name: true, email: true, role: true } },
        user2: { select: { id: true, name: true, email: true, role: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.message.groupBy({
      by: ["conversationId"],
      where: {
        conversation: { OR: [{ user1Id: userId }, { user2Id: userId }] },
        senderId: { not: userId },
        readAt: null,
      },
      _count: { _all: true },
    }),
    listMessageableUsers(userId, session.user.role, session.user.schoolId),
  ]);

  const unreadMap = Object.fromEntries(
    unreadCounts.map((u) => [u.conversationId, u._count._all]),
  );

  const items = conversations
    .map((c) => {
      const other = c.user1.id === userId ? c.user2 : c.user1;
      const last = c.messages[0];
      return {
        id: c.id,
        other,
        lastMessage: last
          ? {
              content: last.content,
              fromMe: last.senderId === userId,
              createdAt: last.createdAt,
            }
          : null,
        unread: unreadMap[c.id] ?? 0,
        sortTime: last?.createdAt ?? c.createdAt,
      };
    })
    .sort((a, b) => new Date(b.sortTime).getTime() - new Date(a.sortTime).getTime());

  // Get info needed for profile dialogs: turma + curso + ano para cada other user
  const otherIds = items.map((it) => it.other.id).concat(messageableUsers.map((u) => u.id));
  const uniqueOtherIds = [...new Set(otherIds)];

  const [enrollmentsByUser, teachingByUser] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId: { in: uniqueOtherIds }, status: "ACTIVE" },
      select: {
        studentId: true,
        class: {
          select: {
            name: true,
            year: true,
            course: { select: { name: true, code: true } },
          },
        },
      },
    }),
    prisma.subjectAssignment.findMany({
      where: { teacherId: { in: uniqueOtherIds } },
      select: {
        teacherId: true,
        subject: { select: { name: true } },
        class: { select: { name: true } },
      },
      take: 100,
    }),
  ]);

  const enrollmentMap = new Map(enrollmentsByUser.map((e) => [e.studentId, e.class]));
  const teachingMap = new Map<string, typeof teachingByUser>();
  for (const t of teachingByUser) {
    const arr = teachingMap.get(t.teacherId) ?? [];
    arr.push(t);
    teachingMap.set(t.teacherId, arr);
  }

  const profileMap = Object.fromEntries(
    uniqueOtherIds.map((id) => {
      const cls = enrollmentMap.get(id);
      return [
        id,
        {
          class: cls
            ? {
                name: cls.name,
                year: cls.year,
                courseName: cls.course.name,
                courseCode: cls.course.code,
              }
            : null,
          teachingSubjects: (teachingMap.get(id) ?? []).slice(0, 5).map((a) => ({
            subject: a.subject.name,
            className: a.class.name,
          })),
        },
      ];
    }),
  );

  return (
    <MessagesList
      conversations={items}
      messageableUsers={messageableUsers}
      profileMap={profileMap}
    />
  );
}
