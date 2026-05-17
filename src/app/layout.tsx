import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Lectiva — Gestão Escolar",
  description: "Plataforma de gestão para escolas profissionais portuguesas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className="h-full" suppressHydrationWarning>
      <body className="h-full bg-background font-sans antialiased">
        {/* Theme + Tweaks bootstrap — applies stored prefs before paint to avoid flash */}
        <Script id="lectiva-bootstrap" strategy="beforeInteractive">
          {`(function(){try{
              var t=localStorage.getItem('lectiva:theme');
              var d=window.matchMedia('(prefers-color-scheme: dark)').matches;
              if(t==='dark'||(!t&&d))document.documentElement.classList.add('dark');
              var sb=localStorage.getItem('lectiva:sidebar-style')||'floating';
              document.documentElement.dataset.sidebarStyle=sb;
              var cs=localStorage.getItem('lectiva:card-style')||'elevated';
              document.documentElement.dataset.cardStyle=cs;
            }catch(e){}})();`}
        </Script>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
