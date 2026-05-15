"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  classes: { id: string; name: string; year: number; course: { code: string } }[];
  defaultValue?: string;
}

export function ClassFilter({ classes, defaultValue }: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const [value, setValue] = useState<string>(defaultValue ?? "ALL");

  function onChange(v: string | null) {
    const next = v ?? "ALL";
    setValue(next);
    const params = new URLSearchParams(search?.toString());
    if (next === "ALL") {
      params.delete("classId");
    } else {
      params.set("classId", next);
    }
    const qs = params.toString();
    router.push(qs ? `/dashboard/schedule?${qs}` : `/dashboard/schedule`);
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-[200px] text-[12px]">
        <SelectValue placeholder="Todas as turmas" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ALL">Todas as turmas</SelectItem>
        {classes.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name} ({c.course.code})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
