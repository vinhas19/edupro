"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Pencil, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Room {
  id: string;
  name: string;
  capacity: number | null;
  type: string;
  usageCount: number;
}

interface Props {
  rooms: Room[];
  typeLabels: Record<string, string>;
}

export function RoomManager({ rooms, typeLabels }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [type, setType] = useState("CLASSROOM");
  const [loading, setLoading] = useState(false);

  async function create() {
    if (!name.trim()) {
      toast.error("Indica o nome da sala.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          capacity: capacity ? parseInt(capacity) : null,
          type,
        }),
      });
      if (!res.ok) {
        toast.error("Erro ao criar sala");
        return;
      }
      toast.success("Sala criada");
      setName("");
      setCapacity("");
      setType("CLASSROOM");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_180px_auto] gap-2 items-end">
        <div className="space-y-1.5">
          <Label htmlFor="room-name">Nome</Label>
          <Input id="room-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: Sala 1.1" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="room-cap">Capacidade</Label>
          <Input id="room-cap" type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="30" />
        </div>
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select value={type} items={typeLabels} onValueChange={(v: string | null) => setType(v ?? "CLASSROOM")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(typeLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={create} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-1.5 h-3.5 w-3.5" />Criar</>}
        </Button>
      </div>

      <div className="border-t border-[var(--separator)] pt-4">
        <h3 className="text-[14px] font-semibold mb-3">Salas existentes</h3>
        {rooms.length === 0 ? (
          <p className="text-[13px] text-[var(--muted-foreground)] py-4 text-center">
            Sem salas. Cria a primeira acima.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--separator)]">
            {rooms.map((r) => (
              <RoomRow key={r.id} room={r} typeLabels={typeLabels} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function RoomRow({ room, typeLabels }: { room: Room; typeLabels: Record<string, string> }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(room.name);
  const [capacity, setCapacity] = useState(room.capacity?.toString() ?? "");
  const [type, setType] = useState(room.type);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          capacity: capacity ? parseInt(capacity) : null,
          type,
        }),
      });
      if (!res.ok) {
        toast.error("Erro ao guardar");
        return;
      }
      toast.success("Sala atualizada");
      setEditing(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (room.usageCount > 0) {
      toast.error(`Não pode apagar: ${room.usageCount} aula(s) usam esta sala.`);
      return;
    }
    if (!confirm(`Apagar "${room.name}"?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/rooms/${room.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(typeof data.error === "string" ? data.error : "Erro ao apagar");
        return;
      }
      toast.success("Sala apagada");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <li className="py-2 grid grid-cols-[1fr_100px_140px_auto] gap-2 items-center">
        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" />
        <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="h-9" />
        <Select value={type} items={typeLabels} onValueChange={(v: string | null) => setType(v ?? "CLASSROOM")}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(typeLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={save} disabled={busy} aria-label="Guardar">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setEditing(false)} disabled={busy} aria-label="Cancelar">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="py-2.5 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-[14px] font-medium">{room.name}</span>
        <Badge variant="outline" className="text-[10px]">{typeLabels[room.type] ?? room.type}</Badge>
        {room.capacity != null && (
          <span className="text-[11px] text-[var(--muted-foreground)] tabular-nums">{room.capacity} lugares</span>
        )}
        {room.usageCount > 0 && (
          <span className="text-[11px] text-[var(--muted-foreground)] tabular-nums">· {room.usageCount} aulas</span>
        )}
      </div>
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" onClick={() => setEditing(true)} aria-label="Editar">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={remove}
          disabled={busy || room.usageCount > 0}
          aria-label="Apagar"
          className="text-[var(--destructive)] disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </li>
  );
}
