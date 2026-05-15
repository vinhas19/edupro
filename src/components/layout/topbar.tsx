"use client";

import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, LogOut, User, ChevronDown } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Role } from "@prisma/client";
import { ROLE_LABELS } from "@/lib/permissions";
import { TweaksPopover } from "@/components/layout/tweaks-popover";

// Map first-segment of pathname to a human-readable title (PT-PT)
const TITLE_MAP: Record<string, string> = {
  "/dashboard": "Painel",
  "/dashboard/schedule": "Horário",
  "/dashboard/calendar": "Calendário",
  "/dashboard/messages": "Mensagens",
  "/dashboard/notifications": "Comunicações",
  "/dashboard/lessons": "Sumários",
  "/dashboard/attendance": "Assiduidade",
  "/dashboard/modules": "Notas & Módulos",
  "/dashboard/subjects": "Disciplinas",
  "/dashboard/courses": "Cursos & Turmas",
  "/dashboard/classes": "Turmas",
  "/dashboard/fct": "FCT",
  "/dashboard/pap": "PAP",
  "/dashboard/documents": "Documentos",
  "/dashboard/substitutions": "Substituições",
  "/dashboard/users": "Utilizadores",
  "/dashboard/settings": "Definições",
  "/dashboard/profile": "Perfil",
};

function getTitle(pathname: string): string {
  // Find best match (longest prefix)
  const entries = Object.entries(TITLE_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [prefix, title] of entries) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return title;
  }
  return "EduPro";
}

interface TopbarProps {
  userName: string;
  userEmail: string;
  userRole: Role;
}

export function Topbar({ userName, userEmail, userRole }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  function openSidebar() {
    window.dispatchEvent(new CustomEvent("edupro:open-sidebar"));
  }

  const title = getTitle(pathname);
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <header data-slot="topbar" className="h-[52px] flex items-center gap-2 px-3 sm:px-5 lg:px-7 border-b border-[var(--separator)] bg-[var(--card)] shrink-0">
      {/* Mobile hamburger */}
      <button
        onClick={openSidebar}
        aria-label="Abrir menu"
        className="lg:hidden h-9 w-9 rounded-[6px] flex items-center justify-center hover:bg-[var(--muted)]"
      >
        <Menu className="h-4 w-4" />
      </button>

      <h2 data-topbar-title className="text-[15px] sm:text-[17px] font-semibold tracking-[-0.012em] truncate">
        {title}
      </h2>

      <div className="flex-1" />

      {/* Tweaks: dark mode, accent, layout */}
      <TweaksPopover />

      {/* User menu (desktop shows full, mobile shows just avatar) */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-[6px] px-1 sm:px-2 py-1 hover:bg-[var(--muted)] transition-colors outline-none">
          <div
            className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[11px] font-semibold shrink-0"
            style={{ background: "var(--tint-indigo)" }}
          >
            {initials || "U"}
          </div>
          <div className="hidden md:flex flex-col items-start leading-tight">
            <span className="text-[13px] font-medium">{userName}</span>
            <span className="text-[11px] text-[var(--muted-foreground)]">
              {ROLE_LABELS[userRole]}
            </span>
          </div>
          <ChevronDown className="hidden md:block h-3 w-3 text-[var(--muted-foreground)]" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-1.5 py-1.5 leading-tight">
            <p className="text-[13px] font-medium">{userName}</p>
            <p className="text-[11px] text-[var(--muted-foreground)] truncate">{userEmail}</p>
            <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-[var(--muted)]">
              {ROLE_LABELS[userRole]}
            </span>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
            <User className="mr-2 h-4 w-4" />O Meu Perfil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-[var(--destructive)] focus:text-[var(--destructive)]"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="mr-2 h-4 w-4" />Terminar Sessão
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
