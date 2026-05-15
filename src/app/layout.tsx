import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "EduPro — Gestão Escolar",
  description: "Plataforma de gestão para escolas profissionais portuguesas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className="h-full" suppressHydrationWarning>
      <head>
        {/* Theme + Tweaks bootstrap — applies stored prefs before paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
              var t=localStorage.getItem('edupro:theme');
              var d=window.matchMedia('(prefers-color-scheme: dark)').matches;
              if(t==='dark'||(!t&&d))document.documentElement.classList.add('dark');
              var sb=localStorage.getItem('edupro:sidebar-style')||'floating';
              document.documentElement.dataset.sidebarStyle=sb;
              var cs=localStorage.getItem('edupro:card-style')||'elevated';
              document.documentElement.dataset.cardStyle=cs;
            }catch(e){}})();`,
          }}
        />
      </head>
      <body className="h-full bg-background font-sans antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
