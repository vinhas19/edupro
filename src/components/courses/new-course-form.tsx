"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(2),
  code: z.string().min(1),
  formationArea: z.string().min(1),
  level: z.string(),
  totalHours: z.string(),
  description: z.string().optional(),
  directorId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  directors: { id: string; name: string }[];
}

export function NewCourseForm({ directors }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { level: "4", totalHours: "3250" },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          code: data.code,
          formationArea: data.formationArea,
          level: parseInt(data.level),
          totalHours: parseInt(data.totalHours),
          description: data.description,
          directorId: data.directorId || undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        toast.error(j.error || "Erro ao criar curso");
        return;
      }
      toast.success("Curso criado com sucesso!");
      router.push("/dashboard/courses");
      router.refresh();
    } catch {
      toast.error("Erro ao criar curso.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Curso</Label>
            <Input id="name" placeholder="ex: Técnico de Análise Laboratorial" {...register("name")} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input id="code" placeholder="ex: TAI" {...register("code")} />
              {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="formationArea">Área de Formação</Label>
              <Input id="formationArea" placeholder="ex: Química" {...register("formationArea")} />
              {errors.formationArea && <p className="text-xs text-red-500">{errors.formationArea.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="level">Nível QNQ</Label>
              <Input id="level" type="number" min="1" max="5" {...register("level")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalHours">Carga Horária Total</Label>
              <Input id="totalHours" type="number" {...register("totalHours")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Diretor de Curso (opcional)</Label>
            <Select
              items={Object.fromEntries(directors.map((d) => [d.id, d.name]))}
              onValueChange={(v: string | null) => setValue("directorId", v ?? "")}
            >
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>
                {directors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea id="description" rows={3} {...register("description")} />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A criar...</> : "Criar Curso"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
