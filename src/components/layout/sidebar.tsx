"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Role } from "@prisma/client";
import { hasRole, ROLE_LABELS } from "@/lib/permissions";
import {
  LayoutGrid, BookOpen, Users, Calendar, ClipboardList,
  Briefcase, Award, FolderOpen, Bell, Settings,
  GraduationCap, BarChart3, UserCheck, MessageSquare, UserX,
  CalendarDays, Search, ChevronRight, X,
  FileCheck, ScrollText, Upload, Heart, DoorOpen,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  tint: string;
  minRole: Role;
  badge?: number;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Geral",
    items: [
      { label: "Painel",        href: "/dashboard",                icon: LayoutGrid,    tint: "var(--tint-blue)",   minRole: Role.STUDENT },
      { label: "Horário",       href: "/dashboard/schedule",       icon: Calendar,      tint: "var(--tint-red)",    minRole: Role.STUDENT },
      { label: "Calendário",    href: "/dashboard/calendar",       icon: CalendarDays,  tint: "var(--tint-orange)", minRole: Role.STUDENT },
      { label: "Mensagens",     href: "/dashboard/messages",       icon: MessageSquare, tint: "var(--tint-green)",  minRole: Role.STUDENT },
      { label: "Comunicações",  href: "/dashboard/notifications",  icon: Bell,          tint: "var(--tint-yellow)", minRole: Role.STUDENT },
    ],
  },
  {
    label: "Ensino",
    items: [
      { label: "Sumários",          href: "/dashboard/lessons",                icon: ClipboardList, tint: "var(--tint-indigo)", minRole: Role.TEACHER },
      { label: "Assiduidade",       href: "/dashboard/attendance",             icon: UserCheck,     tint: "var(--tint-green)",  minRole: Role.STUDENT },
      { label: "Justificações",     href: "/dashboard/attendance/justifications", icon: FileCheck,  tint: "var(--tint-orange)", minRole: Role.CLASS_DIRECTOR },
      { label: "Notas & Módulos",   href: "/dashboard/modules",                icon: BarChart3,     tint: "var(--tint-pink)",   minRole: Role.STUDENT },
      { label: "Boletim",           href: "/dashboard/boletim",                icon: FileCheck,     tint: "var(--tint-green)",  minRole: Role.STUDENT },
      { label: "Disciplinas",       href: "/dashboard/subjects",               icon: BookOpen,      tint: "var(--tint-purple)", minRole: Role.TEACHER },
      { label: "Cursos & Turmas",   href: "/dashboard/courses",                icon: GraduationCap, tint: "var(--tint-orange)", minRole: Role.TEACHER },
    ],
  },
  {
    label: "Família",
    items: [
      { label: "Portal do EE", href: "/dashboard/guardian", icon: Heart, tint: "var(--tint-indigo)", minRole: Role.GUARDIAN },
    ],
  },
  {
    label: "Profissional",
    items: [
      { label: "FCT",         href: "/dashboard/fct",       icon: Briefcase,  tint: "var(--tint-teal)",  minRole: Role.STUDENT },
      { label: "PAP",         href: "/dashboard/pap",       icon: Award,      tint: "var(--tint-brown)", minRole: Role.STUDENT },
      { label: "Documentos",  href: "/dashboard/documents", icon: FolderOpen, tint: "var(--tint-gray)",  minRole: Role.STUDENT },
    ],
  },
  {
    label: "Administração",
    items: [
      { label: "Substituições", href: "/dashboard/substitutions", icon: UserX,      tint: "var(--tint-yellow)", minRole: Role.CLASS_DIRECTOR },
      { label: "Utilizadores",  href: "/dashboard/users",         icon: Users,      tint: "var(--tint-cyan)",   minRole: Role.SCHOOL_ADMIN },
      { label: "Salas",         href: "/dashboard/rooms",             icon: DoorOpen,   tint: "var(--tint-indigo)", minRole: Role.SCHOOL_ADMIN },
      { label: "Enc. Educação", href: "/dashboard/admin/guardians",   icon: Heart,      tint: "var(--tint-pink)",   minRole: Role.SCHOOL_ADMIN },
      { label: "Importar",      href: "/dashboard/admin/import",  icon: Upload,     tint: "var(--tint-teal)",   minRole: Role.SCHOOL_ADMIN },
      { label: "Auditoria",     href: "/dashboard/audit",         icon: ScrollText, tint: "var(--tint-purple)", minRole: Role.SCHOOL_ADMIN },
      { label: "Definições",    href: "/dashboard/settings",      icon: Settings,   tint: "var(--tint-gray)",   minRole: Role.SCHOOL_ADMIN },
    ],
  },
];

interface SidebarProps {
  userRole: Role;
  userName: string;
  userEmail: string;
  schoolName: string;
  unreadMessages?: number;
  unreadNotifications?: number;
}

export function Sidebar({ userRole, userName, userEmail, schoolName, unreadMessages = 0, unreadNotifications = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Close mobile drawer on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Listen to topbar event to open drawer
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("edupro:open-sidebar", handler);
    return () => window.removeEventListener("edupro:open-sidebar", handler);
  }, []);

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const filteredSections = NAV_SECTIONS.map((sec) => ({
    ...sec,
    items: sec.items
      .filter((it) => hasRole(userRole, it.minRole))
      .filter((it) => !search || it.label.toLowerCase().includes(search.toLowerCase())),
  })).filter((s) => s.items.length > 0);

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setOpen(false)}
      />

      <aside
        className={cn(
          "flex flex-col bg-sidebar text-sidebar-foreground z-50",
          // Mobile: drawer (off-canvas, 280px)
          "fixed inset-y-0 left-0 w-[280px] -translate-x-full transition-transform duration-200",
          open && "translate-x-0",
          // Desktop: fixed inside grid
          "lg:relative lg:translate-x-0 lg:w-60",
          "border-r border-[var(--separator)]"
        )}
        style={{ height: "100dvh" }}
      >
        {/* Close button (mobile only) */}
        <button
          onClick={() => setOpen(false)}
          aria-label="Fechar menu"
          className="absolute top-3 right-3 lg:hidden h-8 w-8 rounded-full flex items-center justify-center hover:bg-[var(--muted)]"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Traffic lights (decorative, desktop only) */}
        <div className="hidden lg:flex items-center gap-1.5 px-4 pt-3.5 pb-2">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57] border-[0.5px] border-black/10" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e] border-[0.5px] border-black/10" />
          <span className="h-3 w-3 rounded-full bg-[#28c840] border-[0.5px] border-black/10" />
        </div>

        {/* Brand */}
        <div data-sidebar-brand className="flex items-center gap-2.5 px-4 pt-4 pb-3 lg:pt-2">
          <div
            className="h-7 w-7 rounded-[7px] flex items-center justify-center text-white shrink-0"
            style={{
              background: "linear-gradient(135deg, var(--tint-blue), #0058c9)",
            }}
          >
            <GraduationCap className="h-3.5 w-3.5" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="text-[13px] font-semibold truncate">{schoolName}</div>
            <div className="text-[11px] text-[var(--muted-foreground)] truncate">EduPro</div>
          </div>
        </div>

        {/* Search */}
        <div data-sidebar-search className="px-3 pb-2">
          <div className="flex items-center gap-1.5 rounded-[7px] bg-[var(--muted)] px-2 py-1.5">
            <Search className="h-3 w-3 text-[var(--muted-foreground)] shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Procurar…"
              className="bg-transparent outline-none text-[13px] flex-1 min-w-0 placeholder:text-[var(--muted-foreground)]"
            />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
          {filteredSections.map((sec) => (
            <div key={sec.label}>
              <div data-sidebar-section-label className="px-2 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--muted-foreground)]">
                {sec.label}
              </div>
              <ul className="space-y-0.5">
                {sec.items.map((it) => {
                  const active = isActive(it.href);
                  const badge =
                    it.href === "/dashboard/messages" && unreadMessages > 0 ? unreadMessages
                    : it.href === "/dashboard/notifications" && unreadNotifications > 0 ? unreadNotifications
                    : it.badge;
                  return (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        className={cn(
                          "flex items-center gap-2 rounded-[6px] px-2 py-1.5 text-[13px] font-medium transition-colors",
                          active
                            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                            : "hover:bg-[var(--muted)] text-[var(--foreground)]"
                        )}
                      >
                        <span
                          className="h-5 w-5 rounded-[5px] flex items-center justify-center shrink-0"
                          style={{ background: it.tint }}
                        >
                          <it.icon className="h-[11px] w-[11px] text-white" strokeWidth={2.2} />
                        </span>
                        <span className="flex-1 truncate">{it.label}</span>
                        {badge ? (
                          <span
                            className={cn(
                              "min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-semibold flex items-center justify-center tabular-nums",
                              active
                                ? "bg-white/25 text-white"
                                : "bg-[var(--primary)] text-white"
                            )}
                          >
                            {badge > 9 ? "9+" : badge}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-[var(--separator)] p-2.5">
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-2.5 rounded-[8px] p-1.5 hover:bg-[var(--muted)]"
          >
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold shrink-0"
              style={{ background: "var(--tint-indigo)" }}
            >
              {initials || "U"}
            </div>
            <div data-sidebar-user-info className="min-w-0 flex-1 leading-tight">
              <div className="text-[13px] font-medium truncate">{userName}</div>
              <div className="text-[11px] text-[var(--muted-foreground)] truncate">
                {ROLE_LABELS[userRole]}
              </div>
            </div>
            <ChevronRight data-sidebar-chevron className="h-3 w-3 text-[var(--muted-foreground)] shrink-0" />
          </Link>
        </div>
      </aside>
    </>
  );
}
