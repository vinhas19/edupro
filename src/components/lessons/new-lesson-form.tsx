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
  subjectAssignmentId: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  summary: z.string().min(1, "Sumário obrigatório"),
  lessonNumber: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Assignment {
  id: string;
  subject: { id: string; name: string };
  class: { id: string; name: string };
}

interface Props {
  assignments: Assignment[];
  teacherId: string;
}

export function NewLessonForm({ assignments, teacherId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      startTime: "08:00",
      endTime: "08:50",
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const assignment = assignments.find((a) => a.id === data.subjectAssignmentId);
      if (!assignment) return;

      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: assignment.subject.id,
          classId: assignment.class.id,
          teacherId,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          summary: data.summary,
          lessonNumber: data.lessonNumber ? parseInt(data.lessonNumber) : undefined,
        }),
      });

      if (!res.ok) throw new Error();
      toast.success("Aula registada com sucesso!");
      router.push("/dashboard/lessons");
      router.refresh();
    } catch {
      toast.error("Erro ao registar aula.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Disciplina / Turma</Label>
            <Select onValueChange={(v: string | null) => setValue("subjectAssignmentId", v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar disciplina..." />
              </SelectTrigger>
              <SelectContent>
                {assignments.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.subject.name} — {a.class.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.subjectAssignmentId && (
              <p className="text-xs text-red-500">Selecione uma disciplina</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" {...register("date")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lessonNumber">Nº da Aula</Label>
              <Input id="lessonNumber" type="number" placeholder="ex: 42" {...register("lessonNumber")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Início</Label>
              <Input id="startTime" type="time" {...register("startTime")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Fim</Label>
              <Input id="endTime" type="time" {...register("endTime")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Sumário</Label>
            <Textarea
              id="summary"
              rows={4}
              placeholder="Descreva os conteúdos lecionados nesta aula..."
              {...register("summary")}
            />
            {errors.summary && <p className="text-xs text-red-500">{errors.summary.message}</p>}
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A guardar...</> : "Registar Aula"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
