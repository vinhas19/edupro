"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Trash2, FileText, Image as ImageIcon, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface Props {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  createdAt: Date | string;
  ownerName?: string;
  canDelete: boolean;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function iconFor(mime: string) {
  if (mime.startsWith("image/")) return ImageIcon;
  if (mime.includes("sheet") || mime.includes("excel")) return FileSpreadsheet;
  return FileText;
}

export function FileRow({ id, name, url, size, mimeType, createdAt, ownerName, canDelete }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const Icon = iconFor(mimeType);

  async function remove() {
    if (!confirm(`Apagar "${name}"?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Erro ao apagar");
        return;
      }
      toast.success("Ficheiro apagado");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border px-3 py-2 hover:bg-gray-50">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs text-muted-foreground">
          {formatSize(size)} · {format(new Date(createdAt), "d MMM yyyy", { locale: pt })}
          {ownerName && ` · ${ownerName}`}
        </p>
      </div>
      <a href={url} target="_blank" rel="noreferrer">
        <Button size="icon" variant="ghost" className="h-8 w-8">
          <Download className="h-3.5 w-3.5" />
        </Button>
      </a>
      {canDelete && (
        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={remove} disabled={deleting}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
