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
  enrollmentId: z.string().min(1),
  advisorId: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  enrollments: { id: string; studentId: string; classId: string; student: { name: string }; class: { name: string } }[];
  teachers: { id: string; name: string }[];
}

export function NewPapForm({ enrollments, teachers }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const enrollment = enrollments.find((e) => e.id === data.enrollmentId);
      if (!enrollment) return;
      const res = await fetch("/api/pap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: enrollment.studentId,
          classId: enrollment.classId,
          advisorId: data.advisorId,
          title: data.title,
          description: data.description,
        }),
      });
      if (!res.ok) {
        toast.error("Erro ao criar PAP");
        return;
      }
      toast.success("PAP registada!");
      router.push("/dashboard/pap");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Aluno</Label>
            <Select onValueChange={(v: string | null) => setValue("enrollmentId", v ?? "")}>
              <SelectTrigger><SelectValue placeholder="Selecionar aluno..." /></SelectTrigger>
              <SelectContent>
                {enrollments.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.student.name} — {e.class.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.enrollmentId && <p className="text-xs text-red-500">Selecione um aluno</p>}
          </div>

          <div className="space-y-2">
            <Label>Orientador</Label>
            <Select onValueChange={(v: string | null) => setValue("advisorId", v ?? "")}>
              <SelectTrigger><SelectValue placeholder="Selecionar professor..." /></SelectTrigger>
              <SelectContent>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.advisorId && <p className="text-xs text-red-500">Selecione um orientador</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Tema (opcional)</Label>
            <Input id="title" placeholder="Pode ser definido mais tarde" {...register("title")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea id="description" rows={4} {...register("description")} />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A guardar...</> : "Registar PAP"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
