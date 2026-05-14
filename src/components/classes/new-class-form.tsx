"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(1),
  courseId: z.string().min(1),
  academicYearId: z.string().min(1),
  year: z.string(),
  classDirectorId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  courses: { id: string; name: string; code: string }[];
  years: { id: string; label: string }[];
  directors: { id: string; name: string }[];
  defaultCourseId?: string;
}

export function NewClassForm({ courses, years, directors, defaultCourseId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const activeYearId = years[0]?.id ?? "";

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      year: "1",
      courseId: defaultCourseId ?? "",
      academicYearId: activeYearId,
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          courseId: data.courseId,
          academicYearId: data.academicYearId,
          year: parseInt(data.year),
          classDirectorId: data.classDirectorId || undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error || "Erro ao criar turma");
        return;
      }
      toast.success("Turma criada com sucesso!");
      router.push("/dashboard/classes");
      router.refresh();
    } catch {
      toast.error("Erro ao criar turma.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Turma</Label>
            <Input id="name" placeholder="ex: TAI 1ºA" {...register("name")} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Curso</Label>
            <Select defaultValue={defaultCourseId} onValueChange={(v: string | null) => setValue("courseId", v ?? "")}>
              <SelectTrigger><SelectValue placeholder="Selecionar curso..." /></SelectTrigger>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.courseId && <p className="text-xs text-red-500">Selecione um curso</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ano Letivo</Label>
              <Select defaultValue={activeYearId} onValueChange={(v: string | null) => setValue("academicYearId", v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y.id} value={y.id}>{y.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Ano (1, 2 ou 3)</Label>
              <Input id="year" type="number" min="1" max="3" {...register("year")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Diretor de Turma (opcional)</Label>
            <Select onValueChange={(v: string | null) => setValue("classDirectorId", v ?? "")}>
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>
                {directors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A criar...</> : "Criar Turma"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
