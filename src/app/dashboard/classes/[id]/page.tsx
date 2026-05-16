import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole, COMPONENT_LABELS } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Users, BookOpen, Megaphone, ClipboardList, HelpCircle,
  Calendar, FileText, GraduationCap, Pencil,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { NewPostForm } from "@/components/classroom/new-post-form";
import { NewTopicForm } from "@/components/classroom/new-topic-form";
import { PostComments } from "@/components/classroom/post-comments";
import { SubmissionForm } from "@/components/classroom/submission-form";
import { AttachmentChip } from "@/components/files/attachment-chip";

const POST_TYPE_META = {
  ANNOUNCEMENT: { label: "Anúncio", icon: Megaphone, color: "bg-blue-100 text-blue-700" },
  MATERIAL: { label: "Material", icon: BookOpen, color: "bg-green-100 text-green-700" },
  ASSIGNMENT: { label: "Trabalho", icon: ClipboardList, color: "bg-orange-100 text-orange-700" },
  QUESTION: { label: "Pergunta", icon: HelpCircle, color: "bg-purple-100 text-purple-700" },
} as const;

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id: userId, role } = session.user;

  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      course: { include: { school: { select: { id: true } } } },
      academicYear: { select: { label: true } },
      enrollments: {
        where: { status: "ACTIVE" },
        include: { student: { select: { id: true, name: true, email: true, image: true } } },
        orderBy: { student: { name: "asc" } },
      },
      subjectAssignments: {
        include: {
          subject: { select: { id: true, name: true, component: true } },
          teacher: { select: { id: true, name: true } },
        },
        orderBy: { subject: { name: "asc" } },
      },
      classDirector: { select: { id: true, name: true, email: true } },
      classroomTopics: { orderBy: { order: "asc" } },
      classroomPosts: {
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, role: true } },
          subject: { select: { name: true } },
          topic: { select: { id: true, name: true } },
          attachments: true,
          comments: {
            orderBy: { createdAt: "asc" },
            include: { author: { select: { id: true, name: true } } },
          },
          submissions: {
            include: {
              student: { select: { id: true, name: true } },
              files: true,
            },
          },
        },
      },
    },
  });

  if (!cls || cls.course.school.id !== session.user.schoolId) notFound();

  // Permission check
  const isStudent = role === Role.STUDENT;
  const isEnrolled = isStudent && cls.enrollments.some((e) => e.student.id === userId);
  const isTeaching = cls.subjectAssignments.some((a) => a.teacher.id === userId);
  const isDirector = cls.classDirectorId === userId;
  const isAdmin = hasRole(role, Role.SCHOOL_ADMIN);
  const canPost = hasRole(role, Role.TEACHER) && (isTeaching || isDirector || isAdmin);
  const canSeeClass = isEnrolled || isTeaching || isDirector || isAdmin;
  if (!canSeeClass) redirect("/dashboard");

  // Group posts by topic for Classwork tab
  const postsByTopic = new Map<string | null, typeof cls.classroomPosts>();
  for (const post of cls.classroomPosts) {
    const key = post.topicId;
    if (!postsByTopic.has(key)) postsByTopic.set(key, [] as typeof cls.classroomPosts);
    postsByTopic.get(key)!.push(post);
  }

  // Filter classwork posts (only MATERIAL, ASSIGNMENT, QUESTION go to Classwork)
  const classworkPosts = cls.classroomPosts.filter(
    (p) => p.type !== "ANNOUNCEMENT"
  );

  // Determine my submissions if student
  const mySubmissions = new Map<string, typeof cls.classroomPosts[number]["submissions"][number]>();
  if (isStudent) {
    for (const post of cls.classroomPosts) {
      const sub = post.submissions.find((s) => s.student.id === userId);
      if (sub) mySubmissions.set(post.id, sub);
    }
  }

  const subjectsForPost = cls.subjectAssignments.map((a) => a.subject);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/classes"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{cls.name}</h1>
            <Badge variant="outline">{cls.course.code}</Badge>
            <Badge variant="secondary">{cls.academicYear.label}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">{cls.course.name} · {cls.year}º Ano</p>
        </div>
        {isAdmin && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/classes/${cls.id}/edit`}><Pencil className="mr-1.5 h-3.5 w-3.5" />Editar</Link>
          </Button>
        )}
      </div>

      <Tabs defaultValue="stream">
        <TabsList>
          <TabsTrigger value="stream"><Megaphone className="mr-1.5 h-3.5 w-3.5" />Stream</TabsTrigger>
          <TabsTrigger value="classwork"><ClipboardList className="mr-1.5 h-3.5 w-3.5" />Trabalhos</TabsTrigger>
          <TabsTrigger value="people"><Users className="mr-1.5 h-3.5 w-3.5" />Pessoas</TabsTrigger>
          {canPost && <TabsTrigger value="grades"><GraduationCap className="mr-1.5 h-3.5 w-3.5" />Notas</TabsTrigger>}
        </TabsList>

        {/* ─────────────── STREAM ─────────────── */}
        <TabsContent value="stream" className="space-y-4 mt-4">
          {canPost && (
            <NewPostForm
              classId={cls.id}
              topics={cls.classroomTopics.map((t) => ({ id: t.id, name: t.name }))}
              subjects={subjectsForPost.map((s) => ({ id: s.id, name: s.name }))}
            />
          )}

          {cls.classroomPosts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Megaphone className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-medium">Sem publicações</p>
                <p className="text-sm text-muted-foreground">
                  {canPost ? "Seja o primeiro a publicar algo!" : "Ainda não há publicações na turma."}
                </p>
              </CardContent>
            </Card>
          ) : (
            cls.classroomPosts.map((post) => {
              const Meta = POST_TYPE_META[post.type];
              const Icon = Meta.icon;
              const mySub = mySubmissions.get(post.id);
              return (
                <Card key={post.id}>
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge className={Meta.color}>
                          <Icon className="mr-1 h-3 w-3" />{Meta.label}
                        </Badge>
                        {post.subject && (
                          <Badge variant="outline" className="text-xs">{post.subject.name}</Badge>
                        )}
                        {post.topic && (
                          <Badge variant="outline" className="text-xs">{post.topic.name}</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(post.createdAt), "d MMM, HH:mm", { locale: pt })}
                      </span>
                    </div>

                    {post.title && <h3 className="font-semibold text-base">{post.title}</h3>}
                    {post.content && (
                      <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                    )}

                    {post.type === "ASSIGNMENT" && post.dueDate && (
                      <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 px-3 py-2 rounded">
                        <Calendar className="h-3.5 w-3.5" />
                        Entrega: {format(new Date(post.dueDate), "d MMM yyyy, HH:mm", { locale: pt })}
                        {post.maxGrade != null && <span className="ml-auto">Nota máx: {post.maxGrade}</span>}
                      </div>
                    )}

                    {post.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {post.attachments.map((f) => (
                          <AttachmentChip key={f.id} name={f.name} url={f.url} />
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {post.author.name} · {post.author.role}
                    </p>

                    {/* Student submission area */}
                    {post.type === "ASSIGNMENT" && isStudent && (
                      <SubmissionForm
                        postId={post.id}
                        dueDate={post.dueDate}
                        status={mySub?.status ?? "NOT_SUBMITTED"}
                        submittedAt={mySub?.submittedAt ?? null}
                        grade={mySub?.grade ?? null}
                        feedback={mySub?.feedback ?? null}
                        existingFiles={mySub?.files.map((f) => ({ id: f.id, name: f.name, url: f.url })) ?? []}
                      />
                    )}

                    {/* Submission summary for teachers */}
                    {post.type === "ASSIGNMENT" && canPost && (
                      <div className="text-xs text-muted-foreground border-t pt-2">
                        Entregas: {post.submissions.filter((s) => s.status !== "NOT_SUBMITTED").length}/{post.submissions.length}
                        <Link href={`/dashboard/classes/${cls.id}/assignment/${post.id}`} className="ml-2 text-blue-600 hover:underline">
                          Ver entregas →
                        </Link>
                      </div>
                    )}

                    {/* Public comments */}
                    <PostComments
                      postId={post.id}
                      comments={post.comments.map((c) => ({
                        id: c.id,
                        content: c.content,
                        createdAt: c.createdAt,
                        author: { id: c.author.id, name: c.author.name },
                      }))}
                    />
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* ─────────────── CLASSWORK ─────────────── */}
        <TabsContent value="classwork" className="space-y-4 mt-4">
          {canPost && <NewTopicForm classId={cls.id} />}

          {classworkPosts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-medium">Sem trabalhos ou materiais</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {cls.classroomTopics.map((topic) => {
                const items = classworkPosts.filter((p) => p.topicId === topic.id);
                if (!items.length) return null;
                return (
                  <Card key={topic.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{topic.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1.5">
                        {items.map((p) => {
                          const M = POST_TYPE_META[p.type];
                          const I = M.icon;
                          return (
                            <li key={p.id} className="flex items-center gap-3 rounded border px-3 py-2 text-sm">
                              <I className="h-4 w-4 text-muted-foreground" />
                              <span className="flex-1 font-medium">{p.title ?? p.content?.slice(0, 80) ?? "(sem título)"}</span>
                              {p.dueDate && (
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(p.dueDate), "d MMM", { locale: pt })}
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
              {/* Posts without a topic */}
              {(() => {
                const orphans = classworkPosts.filter((p) => !p.topicId);
                if (!orphans.length) return null;
                return (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-muted-foreground">Sem tópico</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1.5">
                        {orphans.map((p) => {
                          const M = POST_TYPE_META[p.type];
                          const I = M.icon;
                          return (
                            <li key={p.id} className="flex items-center gap-3 rounded border px-3 py-2 text-sm">
                              <I className="h-4 w-4 text-muted-foreground" />
                              <span className="flex-1 font-medium">{p.title ?? p.content?.slice(0, 80) ?? "(sem título)"}</span>
                              {p.dueDate && (
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(p.dueDate), "d MMM", { locale: pt })}
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })()}
            </>
          )}
        </TabsContent>

        {/* ─────────────── PEOPLE ─────────────── */}
        <TabsContent value="people" className="space-y-4 mt-4">
          {cls.classDirector && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm uppercase text-muted-foreground tracking-wider">Diretor de Turma</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                    {cls.classDirector.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{cls.classDirector.name}</p>
                    <p className="text-xs text-muted-foreground">{cls.classDirector.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase text-muted-foreground tracking-wider">
                Professores ({cls.subjectAssignments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {cls.subjectAssignments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-semibold text-xs">
                        {a.teacher.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{a.teacher.name}</p>
                        <p className="text-xs text-muted-foreground">{a.subject.name}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">{COMPONENT_LABELS[a.subject.component]}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase text-muted-foreground tracking-wider">
                Alunos ({cls.enrollments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {cls.enrollments.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 text-sm py-1">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-semibold text-xs">
                      {e.student.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1">{e.student.name}</span>
                    <span className="text-xs text-muted-foreground">{e.student.email}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─────────────── GRADES (teacher only) ─────────────── */}
        {canPost && (
          <TabsContent value="grades" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pauta de Trabalhos</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-3 font-medium">Aluno</th>
                      {cls.classroomPosts.filter((p) => p.type === "ASSIGNMENT").map((p) => (
                        <th key={p.id} className="py-2 px-2 font-medium text-center text-xs">
                          {p.title ?? "(sem título)"}
                        </th>
                      ))}
                      <th className="py-2 px-2 font-medium text-center">Média</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cls.enrollments.map((e) => {
                      const assignments = cls.classroomPosts.filter((p) => p.type === "ASSIGNMENT");
                      const studentGrades = assignments
                        .map((a) => a.submissions.find((s) => s.student.id === e.student.id)?.grade)
                        .filter((g): g is number => g != null);
                      const avg = studentGrades.length
                        ? (studentGrades.reduce((s, g) => s + g, 0) / studentGrades.length).toFixed(1)
                        : "—";
                      return (
                        <tr key={e.id} className="border-b">
                          <td className="py-2 pr-3 font-medium">{e.student.name}</td>
                          {assignments.map((a) => {
                            const sub = a.submissions.find((s) => s.student.id === e.student.id);
                            return (
                              <td key={a.id} className="py-2 px-2 text-center">
                                {sub?.grade != null ? (
                                  <span className="font-mono font-semibold">{sub.grade}</span>
                                ) : sub?.submittedAt ? (
                                  <Badge variant="outline" className="text-xs">Por avaliar</Badge>
                                ) : (
                                  <span className="text-muted-foreground text-xs">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="py-2 px-2 text-center font-mono font-semibold">{avg}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
