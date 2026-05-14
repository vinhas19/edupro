"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Role } from "@prisma/client";
import { hasRole } from "@/lib/permissions";
import {
  LayoutDashboard, BookOpen, Users, Calendar, ClipboardList,
  FileText, Briefcase, Award, FolderOpen, Bell, Settings,
  GraduationCap, BarChart3, UserCheck, MessageSquare, UserX,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  minRole: Role;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, minRole: Role.STUDENT },
  { label: "Cursos & Turmas", href: "/dashboard/courses", icon: GraduationCap, minRole: Role.TEACHER },
  { label: "Disciplinas", href: "/dashboard/subjects", icon: BookOpen, minRole: Role.TEACHER },
  { label: "Horário", href: "/dashboard/schedule", icon: Calendar, minRole: Role.STUDENT },
  { label: "Calendário", href: "/dashboard/calendar", icon: Calendar, minRole: Role.STUDENT },
  { label: "Substituições", href: "/dashboard/substitutions", icon: UserX, minRole: Role.CLASS_DIRECTOR },
  { label: "Assiduidade", href: "/dashboard/attendance", icon: UserCheck, minRole: Role.STUDENT },
  { label: "Sumários", href: "/dashboard/lessons", icon: ClipboardList, minRole: Role.TEACHER },
  { label: "Notas & Módulos", href: "/dashboard/modules", icon: BarChart3, minRole: Role.STUDENT },
  { label: "FCT", href: "/dashboard/fct", icon: Briefcase, minRole: Role.STUDENT },
  { label: "PAP", href: "/dashboard/pap", icon: Award, minRole: Role.STUDENT },
  { label: "Documentos", href: "/dashboard/documents", icon: FolderOpen, minRole: Role.STUDENT },
  { label: "Mensagens", href: "/dashboard/messages", icon: MessageSquare, minRole: Role.STUDENT },
  { label: "Comunicações", href: "/dashboard/notifications", icon: Bell, minRole: Role.STUDENT },
  { label: "Utilizadores", href: "/dashboard/users", icon: Users, minRole: Role.SCHOOL_ADMIN },
  { label: "Configurações", href: "/dashboard/settings", icon: Settings, minRole: Role.SCHOOL_ADMIN },
];

interface SidebarProps {
  userRole: Role;
  schoolName: string;
  schoolLogo?: string | null;
}

export function Sidebar({ userRole, schoolName, schoolLogo }: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter((item) =>
    hasRole(userRole, item.minRole)
  );

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b px-4">
        {schoolLogo ? (
          <img src={schoolLogo} alt={schoolName} className="h-8 w-8 rounded object-contain" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-white">
            <GraduationCap className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{schoolName}</p>
          <p className="text-xs text-muted-foreground">EduPro</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {visibleItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <item.icon
                    className={cn("h-4 w-4 shrink-0", isActive ? "text-blue-600" : "")}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
