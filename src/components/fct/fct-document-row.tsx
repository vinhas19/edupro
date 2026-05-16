"use client";

import { Eye, Download } from "lucide-react";
import { downloadFile } from "@/lib/download-file";

interface Props {
  title: string;
  type: string;
  url: string;
}

export function FctDocumentRow({ title, type, url }: Props) {
  return (
    <li className="flex items-center gap-2 rounded border px-3 py-2 text-sm hover:bg-muted">
      <span className="flex-1 truncate">
        {title} <span className="text-xs text-muted-foreground">({type})</span>
      </span>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        title="Visualizar"
        className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-background"
      >
        <Eye className="h-3.5 w-3.5" />
      </a>
      <button
        type="button"
        title="Transferir"
        onClick={() => downloadFile(url, title)}
        className="inline-flex h-7 w-7 items-center justify-center rounded hover:bg-background"
      >
        <Download className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}
