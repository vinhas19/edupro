"use client";

import { signOut } from "next-auth/react";
import { Bell, LogOut, User, ChevronDown } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/permissions";
import { Role } from "@prisma/client";
import { useRouter } from "next/navigation";

interface TopbarProps {
  userName: string;
  userEmail: string;
  userRole: Role;
  userImage?: string | null;
  unreadCount?: number;
}

export function Topbar({ userName, userEmail, userRole, userImage, unreadCount = 0 }: TopbarProps) {
  const router = useRouter();
  const initials = userName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <header className="flex h-16 items-center justify-end border-b bg-white px-6 gap-3">
      {/* Notifications */}
      <Button variant="ghost" size="icon" className="relative" onClick={() => router.push("/dashboard/notifications")}>
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-muted transition-colors outline-none"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={userImage ?? undefined} />
            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-sm font-medium leading-none">{userName}</span>
            <span className="text-xs text-muted-foreground">{ROLE_LABELS[userRole]}</span>
          </div>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div>
              <p className="font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
              <Badge variant="secondary" className="mt-1 text-xs">
                {ROLE_LABELS[userRole]}
              </Badge>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
            <User className="mr-2 h-4 w-4" />
            O Meu Perfil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Terminar Sessão
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
