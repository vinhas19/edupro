import Link from "next/link";
import { FileQuestion, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <div className="max-w-md w-full rounded-[14px] bg-[var(--card)] shadow-[var(--card-shadow)] p-6 space-y-4 text-center">
        <div
          className="h-14 w-14 mx-auto rounded-full flex items-center justify-center text-white"
          style={{ background: "var(--tint-orange)" }}
        >
          <FileQuestion className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-[20px] font-bold tracking-[-0.022em]">Página não encontrada</h1>
          <p className="text-[13px] text-[var(--muted-foreground)] mt-1">
            O recurso pedido não existe ou foi movido.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-1.5 rounded-[8px] bg-[var(--primary)] text-white px-4 py-2 text-[13px] font-semibold"
        >
          <Home className="h-3.5 w-3.5" />Voltar ao painel
        </Link>
      </div>
    </div>
  );
}
