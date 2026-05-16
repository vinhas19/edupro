"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Plus, Trash2, X, User, GraduationCap, BookOpen, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { Role } from "@prisma/client";
import { ROLE_LABELS } from "@/lib/permissions";
import { toast } from "sonner";

interface OtherUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface Conversation {
  id: string;
  other: OtherUser;
  lastMessage: { content: string; fromMe: boolean; createdAt: Date | string } | null;
  unread: number;
}

interface ProfileInfo {
  class: { name: string; year: number; courseName: string; courseCode: string } | null;
  teachingSubjects: { subject: string; className: string }[];
}

interface Props {
  conversations: Conversation[];
  messageableUsers: OtherUser[];
  profileMap: Record<string, ProfileInfo>;
}

export function MessagesList({ conversations, messageableUsers, profileMap }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [newConvOpen, setNewConvOpen] = useState(false);
  const [profileFor, setProfileFor] = useState<OtherUser | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      c.other.name.toLowerCase().includes(q) ||
      c.other.email.toLowerCase().includes(q) ||
      c.lastMessage?.content.toLowerCase().includes(q),
    );
  }, [conversations, query]);

  async function deleteConv(id: string) {
    if (!confirm("Apagar esta conversa? As mensagens não podem ser recuperadas.")) return;
    const res = await fetch(`/api/messages/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Erro ao apagar conversa");
      return;
    }
    toast.success("Conversa apagada");
    router.refresh();
  }

  async function startConversation(user: OtherUser) {
    // Cria conversa criando uma primeira mensagem (vazia ou placeholder)? Vamos abrir
    // a página de detalhe que cuida disso. Mas como o endpoint POST exige `content`,
    // criamos com um placeholder vazio que é rejeitado — em alternativa, vamos para
    // a página de detalhe pelo recipientId, que pode iniciar conversa quando o user
    // escrever a primeira mensagem.
    router.push(`/dashboard/messages/new?to=${user.id}`);
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Mensagens</h1>
          <p className="text-muted-foreground text-sm">{conversations.length} conversa{conversations.length !== 1 ? "s" : ""}</p>
        </div>
        <Button size="sm" onClick={() => setNewConvOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />Nova conversa
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pesquisar conversas..."
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-medium">{query ? "Sem resultados" : "Sem conversas"}</p>
            <p className="text-sm text-muted-foreground">
              {query ? `Nenhuma conversa corresponde a "${query}".` : "Clica em \"Nova conversa\" para começar."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Card key={c.id} className="hover:shadow-sm transition-shadow group">
              <CardContent className="flex items-center gap-3 py-3">
                <button
                  type="button"
                  onClick={() => setProfileFor(c.other)}
                  className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold shrink-0 hover:bg-blue-200 transition-colors"
                  title="Ver perfil"
                >
                  {c.other.name.charAt(0).toUpperCase()}
                </button>
                <Link href={`/dashboard/messages/${c.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{c.other.name}</p>
                    <Badge variant="outline" className="text-[10px]">{ROLE_LABELS[c.other.role]}</Badge>
                  </div>
                  {c.lastMessage && (
                    <p className={`text-xs truncate ${c.unread > 0 ? "font-semibold" : "text-muted-foreground"}`}>
                      {c.lastMessage.fromMe && "Tu: "}{c.lastMessage.content}
                    </p>
                  )}
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex flex-col items-end gap-1">
                    {c.lastMessage && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(c.lastMessage.createdAt), { addSuffix: false, locale: pt })}
                      </span>
                    )}
                    {c.unread > 0 && (
                      <Badge className="bg-blue-600 text-white text-[10px] h-5 min-w-5 px-1.5">{c.unread}</Badge>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteConv(c.id)}
                    className="opacity-0 group-hover:opacity-100 inline-flex h-7 w-7 items-center justify-center rounded text-red-600 hover:bg-red-50 transition-opacity"
                    title="Apagar conversa"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {newConvOpen && (
        <NewConversationDialog
          users={messageableUsers}
          onClose={() => setNewConvOpen(false)}
          onPick={(u) => {
            setNewConvOpen(false);
            startConversation(u);
          }}
        />
      )}

      {profileFor && (
        <ProfileDialog
          user={profileFor}
          info={profileMap[profileFor.id]}
          onClose={() => setProfileFor(null)}
          onMessage={() => {
            const existing = conversations.find((c) => c.other.id === profileFor.id);
            if (existing) {
              router.push(`/dashboard/messages/${existing.id}`);
            } else {
              startConversation(profileFor);
            }
            setProfileFor(null);
          }}
        />
      )}
    </div>
  );
}

function NewConversationDialog({
  users,
  onClose,
  onPick,
}: {
  users: OtherUser[];
  onClose: () => void;
  onPick: (u: OtherUser) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return users;
    return users.filter((u) =>
      u.name.toLowerCase().includes(t) || u.email.toLowerCase().includes(t),
    );
  }, [users, q]);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-md max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <CardContent className="p-4 flex flex-col gap-3 overflow-hidden">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Nova conversa</h3>
            <button type="button" onClick={onClose} className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar pessoa..." className="pl-9" autoFocus />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {filtered.length} de {users.length} contactáveis
          </p>
          <div className="overflow-y-auto flex-1 -mx-2 px-2 space-y-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Sem resultados</p>
            ) : (
              filtered.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => onPick(u)}
                  className="w-full flex items-center gap-3 p-2 rounded hover:bg-muted text-left"
                >
                  <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">{ROLE_LABELS[u.role]}</Badge>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileDialog({
  user,
  info,
  onClose,
  onMessage,
}: {
  user: OtherUser;
  info: ProfileInfo | undefined;
  onClose: () => void;
  onMessage: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{user.name}</p>
                <Badge variant="outline" className="text-[10px] mt-0.5">{ROLE_LABELS[user.role]}</Badge>
              </div>
            </div>
            <button type="button" onClick={onClose} className="h-7 w-7 inline-flex items-center justify-center rounded hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2 text-sm border-t pt-3">
            <div className="flex items-start gap-2">
              <User className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <span className="text-muted-foreground text-xs truncate">{user.email}</span>
            </div>

            {info?.class && (
              <>
                <div className="flex items-start gap-2">
                  <GraduationCap className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <p className="font-medium">{info.class.name}</p>
                    <p className="text-muted-foreground">{info.class.courseName} ({info.class.courseCode}) · {info.class.year}º ano</p>
                  </div>
                </div>
              </>
            )}

            {info && info.teachingSubjects.length > 0 && (
              <div className="flex items-start gap-2">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="text-xs space-y-0.5">
                  <p className="font-medium">Leciona</p>
                  {info.teachingSubjects.map((t, i) => (
                    <p key={i} className="text-muted-foreground">{t.subject} · {t.className}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button className="w-full" size="sm" onClick={onMessage}>
            <MessageSquare className="mr-1.5 h-3.5 w-3.5" />Enviar mensagem
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
