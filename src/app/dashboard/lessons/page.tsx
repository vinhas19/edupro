import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import Link from "next/link";
import { Plus, FileText, Check, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";

const SUBJECT_TINTS = [
  "var(--tint-indigo)", "var(--tint-pink)", "var(--tint-red)",
  "var(--tint-orange)", "var(--tint-green)", "var(--tint-teal)",
  "var(--tint-purple)", "var(--tint-cyan)", "var(--tint-brown)",
];

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ lessonId?: string; filter?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!hasRole(session.user.role, Role.TEACHER)) redirect("/dashboard");

  const { id: userId, role, schoolId } = session.user;
  const params = await searchParams;
  const filter = params.filter ?? "all";
  const selectedId = params.lessonId;

  const lessons = await prisma.lesson.findMany({
    where: {
      ...(role === Role.TEACHER
        ? { teacherId: userId }
        : { class: { course: { schoolId } } }),
    },
    include: {
      subject: { select: { id: true, name: true } },
      class: { select: { id: true, name: true } },
      teacher: { select: { name: true } },
      attendanceRecords: { select: { id: true, status: true } },
    },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
    take: 80,
  });

  const filtered = lessons.filter((l) => {
    if (filter === "pending") return !l.summary;
    if (filter === "registered") return !!l.summary;
    return true;
  });

  const selected = selectedId
    ? lessons.find((l) => l.id === selectedId)
    : filtered[0];

  const subjectIds = [...new Set(lessons.map((l) => l.subject.id))];
  const colorOf = (sid: string) => SUBJECT_TINTS[subjectIds.indexOf(sid) % SUBJECT_TINTS.length];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--tint-indigo)] mb-1">
            Sumários
          </div>
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.022em]">
            Registo de aulas
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center rounded-[7px] bg-[var(--muted)] p-0.5">
            {[
              { id: "all", label: "Todos" },
              { id: "pending", label: "Por registar" },
              { id: "registered", label: "Registados" },
            ].map((f) => (
              <Link
                key={f.id}
                href={`/dashboard/lessons${f.id === "all" ? "" : `?filter=${f.id}`}`}
                className={cn(
                  "px-3 py-1 rounded-[6px] text-[12px] font-semibold transition-colors",
                  filter === f.id ? "bg-[var(--card)] shadow-sm" : "text-[var(--muted-foreground)]"
                )}
              >
                {f.label}
              </Link>
            ))}
          </div>
          <Button size="sm" asChild>
            <Link href="/dashboard/lessons/new">
              <Plus className="mr-1.5 h-3.5 w-3.5" />Novo sumário
            </Link>
          </Button>
        </div>
      </div>

      <div className="sm:hidden flex gap-1 overflow-x-auto -mx-1 px-1">
        {[
          { id: "all", label: "Todos" },
          { id: "pending", label: "Por registar" },
          { id: "registered", label: "Registados" },
        ].map((f) => (
          <Link
            key={f.id}
            href={`/dashboard/lessons${f.id === "all" ? "" : `?filter=${f.id}`}`}
            className={cn(
              "px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap",
              filter === f.id ? "bg-[var(--primary)] text-white" : "bg-[var(--muted)] text-[var(--foreground)]"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-[var(--card)] rounded-[12px] shadow-[var(--card-shadow)] py-16 text-center">
          <FileText className="h-12 w-12 text-[var(--muted-foreground)] opacity-40 mx-auto mb-3" />
          <p className="text-[14px] font-medium">Sem sumários</p>
          <p className="text-[12px] text-[var(--muted-foreground)] mt-1">
            {filter === "pending" ? "Não há sumários por registar." :
             filter === "registered" ? "Ainda não há sumários registados." :
             "Comece por registar a primeira aula."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
          {/* Master list */}
          <div className="bg-[var(--card)] rounded-[12px] shadow-[var(--card-shadow)] overflow-hidden lg:max-h-[calc(100dvh-220px)] lg:overflow-y-auto">
            {filtered.map((lesson, i) => {
              const isSelected = selected?.id === lesson.id;
              const registered = !!lesson.summary;
              const absences = lesson.attendanceRecords.filter((r) => r.status === "ABSENT").length;
              // On mobile, link drills down to detail; on desktop, sets selected via URL
              return (
                <Link
                  key={lesson.id}
                  href={{
                    pathname: "/dashboard/lessons",
                    query: { ...(filter !== "all" && { filter }), lessonId: lesson.id },
                  }}
                  className={cn(
                    "block px-3.5 py-3 transition-colors",
                    i > 0 && "border-t border-[var(--separator)]",
                    "hover:bg-[var(--muted)]",
                    isSelected && "lg:bg-[var(--accent)]"
                  )}
                >
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-1 h-3.5 rounded-sm shrink-0"
                        style={{ background: colorOf(lesson.subject.id) }}
                      />
                      <span className="text-[13px] font-semibold truncate">{lesson.subject.name}</span>
                    </div>
                    {registered ? (
                      <Check className="w-3.5 h-3.5 text-[var(--tint-green)] shrink-0" />
                    ) : (
                      <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[rgba(255,149,0,0.18)] text-[#b86b00] shrink-0">
                        Pendente
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] text-[var(--muted-foreground)] truncate">
                    {lesson.class.name} · {lesson.startTime}–{lesson.endTime}
                  </div>
                  <div className="text-[11px] text-[var(--muted-foreground)] font-mono tabular-nums mt-0.5">
                    {format(new Date(lesson.date), "EEE · dd/MM", { locale: pt })}
                  </div>
                  {absences > 0 && (
                    <div className="text-[11px] text-[var(--tint-red)] mt-1">
                      {absences} falta{absences !== 1 ? "s" : ""}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Detail (only on desktop) */}
          <div className="hidden lg:block">
            {selected ? (
              <article className="bg-[var(--card)] rounded-[12px] shadow-[var(--card-shadow)] overflow-hidden">
                <div className="h-1.5" style={{ background: colorOf(selected.subject.id) }} />
                <div className="p-5">
                  <header className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h2 className="text-[18px] font-bold tracking-[-0.012em]">{selected.subject.name}</h2>
                      <p className="text-[12px] text-[var(--muted-foreground)] flex items-center gap-2 mt-0.5 flex-wrap">
                        <span>{selected.class.name}</span>
                        <span>·</span>
                        <Calendar className="h-3 w-3" />
                        <span className="tabular-nums">
                          {format(new Date(selected.date), "d 'de' MMMM yyyy", { locale: pt })} · {selected.startTime}–{selected.endTime}
                        </span>
                        {selected.lessonNumber && (
                          <>
                            <span>·</span>
                            <span className="tabular-nums">Aula nº {selected.lessonNumber}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <Button asChild size="sm" variant={selected.summary ? "outline" : "default"}>
                      <Link href={`/dashboard/lessons/${selected.id}`}>
                        {selected.summary ? "Ver / Editar" : "Registar"}
                      </Link>
                    </Button>
                  </header>

                  <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--muted-foreground)] mb-2">
                    Sumário
                  </div>
                  {selected.summary ? (
                    <p className="text-[14px] leading-[1.55] whitespace-pre-wrap">{selected.summary}</p>
                  ) : (
                    <p className="text-[13px] italic text-[var(--muted-foreground)]">
                      Sem sumário registado.
                    </p>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[var(--separator)]">
                    <div>
                      <div className="text-[11px] uppercase font-semibold text-[var(--muted-foreground)]">Presenças</div>
                      <div className="text-[18px] font-bold tabular-nums mt-0.5">
                        {selected.attendanceRecords.filter((r) => r.status === "PRESENT" || r.status === "LATE").length}/{selected.attendanceRecords.length}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase font-semibold text-[var(--muted-foreground)]">Faltas</div>
                      <div className="text-[18px] font-bold tabular-nums mt-0.5 text-[var(--tint-red)]">
                        {selected.attendanceRecords.filter((r) => r.status === "ABSENT").length}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase font-semibold text-[var(--muted-foreground)]">Aula nº</div>
                      <div className="text-[18px] font-bold tabular-nums mt-0.5">
                        {selected.lessonNumber ?? "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase font-semibold text-[var(--muted-foreground)]">Estado</div>
                      <div className="text-[13px] font-semibold mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${
                          selected.summary
                            ? "bg-[rgba(52,199,89,0.16)] text-[#1d8a3a]"
                            : "bg-[rgba(255,149,0,0.18)] text-[#b86b00]"
                        }`}>
                          {selected.summary ? "Registado" : "Pendente"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ) : (
              <div className="bg-[var(--card)] rounded-[12px] shadow-[var(--card-shadow)] py-16 text-center">
                <p className="text-[13px] text-[var(--muted-foreground)]">Selecione um sumário</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
