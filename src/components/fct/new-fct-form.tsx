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
  companyName: z.string().min(1),
  supervisorName: z.string().optional(),
  supervisorEmail: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  requiredHours: z.string(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  student: { name: string };
  class: { name: string };
}

interface Props {
  enrollments: Enrollment[];
}

export function NewFctForm({ enrollments }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { requiredHours: "420" },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const enrollment = enrollments.find((e) => e.id === data.enrollmentId);
      if (!enrollment) return;
      const res = await fetch("/api/fct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: enrollment.studentId,
          classId: enrollment.classId,
          companyName: data.companyName,
          supervisorName: data.supervisorName,
          supervisorEmail: data.supervisorEmail || undefined,
          startDate: data.startDate,
          endDate: data.endDate,
          requiredHours: parseInt(data.requiredHours),
          notes: data.notes,
        }),
      });
      if (!res.ok) {
        toast.error("Erro ao criar FCT");
        return;
      }
      toast.success("FCT registada!");
      router.push("/dashboard/fct");
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
            <Label htmlFor="companyName">Empresa</Label>
            <Input id="companyName" placeholder="ex: Laboratório XYZ, Lda." {...register("companyName")} />
            {errors.companyName && <p className="text-xs text-red-500">{errors.companyName.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supervisorName">Supervisor</Label>
              <Input id="supervisorName" {...register("supervisorName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supervisorEmail">Email do Supervisor</Label>
              <Input id="supervisorEmail" type="email" {...register("supervisorEmail")} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Início</Label>
              <Input id="startDate" type="date" {...register("startDate")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Fim</Label>
              <Input id="endDate" type="date" {...register("endDate")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requiredHours">Horas Obrigatórias</Label>
              <Input id="requiredHours" type="number" {...register("requiredHours")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" rows={3} {...register("notes")} />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A guardar...</> : "Registar FCT"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
