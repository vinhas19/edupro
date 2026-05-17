import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Layout minimal para vistas imprimíveis (Pautas, Horários, etc).
 * NÃO usa o chrome do dashboard (sidebar/topbar) — só auth + conteúdo.
 * Não renderiza <html>/<body> — esses estão no root layout.
 */
export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <>
      <style>{`
        @page { size: A4 landscape; margin: 14mm; }
        @media print {
          .no-print { display: none !important; }
        }
        /* override do dashboard quando esta vista é aberta em iframe/popup */
        html, body { background: white !important; color: black !important; }
      `}</style>
      {children}
    </>
  );
}
