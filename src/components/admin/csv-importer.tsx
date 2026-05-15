"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: { line: number; email: string; error: string }[];
}

export function CsvImporter() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  function onFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const v = typeof reader.result === "string" ? reader.result : "";
      setText(v);
    };
    reader.readAsText(file, "utf-8");
  }

  async function importNow() {
    if (!text.trim()) {
      toast.error("Cola CSV ou seleciona um ficheiro.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/import/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "Erro na importação");
        return;
      }
      setResult(data);
      toast.success(`Importados: ${data.created} criados, ${data.updated} atualizados`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />Selecionar ficheiro CSV
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
        <span className="text-[11px] text-[var(--muted-foreground)]">
          ou cola o conteúdo CSV abaixo
        </span>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        spellCheck={false}
        className="w-full text-[12px] font-mono rounded-[8px] border border-[var(--separator)] bg-[var(--card)] p-2 outline-none focus:ring-2 focus:ring-[var(--ring)] tabular-nums"
        placeholder={"name,email,role\nAna Silva,ana@escola.pt,student"}
      />

      <div className="flex justify-end">
        <Button onClick={importNow} disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A importar…</> : "Importar"}
        </Button>
      </div>

      {result && (
        <div className="rounded-[8px] border border-[var(--separator)] p-3 space-y-1 text-[13px]">
          <p>✅ Criados: <strong>{result.created}</strong></p>
          <p>♻️ Atualizados: <strong>{result.updated}</strong></p>
          <p>⏭️ Ignorados: <strong>{result.skipped}</strong></p>
          {result.errors.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-[12px] text-[var(--destructive)]">
                {result.errors.length} erro{result.errors.length !== 1 ? "s" : ""} (detalhes)
              </summary>
              <ul className="mt-1 ml-4 list-disc text-[12px] text-[var(--muted-foreground)]">
                {result.errors.map((e, i) => (
                  <li key={i}>L{e.line} — {e.email}: {e.error}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
