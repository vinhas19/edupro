"use client";

import { useState } from "react";
import { Paperclip, Eye, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { downloadFile } from "@/lib/download-file";

interface Props {
  name: string;
  url: string;
  maxWidth?: string;
}

export function AttachmentChip({ name, url, maxWidth = "200px" }: Props) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDownloading(true);
    try {
      await downloadFile(url, name);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Badge variant="outline" className="gap-1.5 pl-2 pr-1 py-1 hover:bg-muted">
      <Paperclip className="h-3 w-3 shrink-0" />
      <span className="truncate" style={{ maxWidth }}>{name}</span>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        title="Visualizar"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-muted-foreground/10"
      >
        <Eye className="h-3 w-3" />
      </a>
      <button
        type="button"
        title="Transferir"
        onClick={handleDownload}
        disabled={downloading}
        className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-muted-foreground/10 disabled:opacity-50"
      >
        <Download className="h-3 w-3" />
      </button>
    </Badge>
  );
}
