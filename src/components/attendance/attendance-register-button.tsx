"use client";

import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";
import { useRouter } from "next/navigation";

export function AttendanceRegisterButton({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => router.push(`/dashboard/lessons/${lessonId}/attendance`)}
    >
      <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
      Registar
    </Button>
  );
}
