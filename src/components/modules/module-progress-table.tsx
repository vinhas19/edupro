"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MODULE_STATUS_LABELS, MODULE_STATUS_COLORS } from "@/lib/permissions";
import { ModuleStatus } from "@prisma/client";

interface ModuleProgressTableProps {
  classData: {
    id: string;
    name: string;
    course: { name: string };
    enrollments: Array<{
      student: {
        id: string;
        name: string;
        moduleProgress: Array<{
          moduleId: string;
          status: ModuleStatus;
          grade: number | null;
          module: { number: number; subject: { name: string } };
        }>;
      };
    }>;
  };
}

export function ModuleProgressTable({ classData }: ModuleProgressTableProps) {
  const students = classData.enrollments.map((e) => e.student);

  // Collect all unique modules
  const moduleMap = new Map<string, { number: number; subjectName: string }>();
  students.forEach((s) => {
    s.moduleProgress.forEach((p) => {
      if (!moduleMap.has(p.moduleId)) {
        moduleMap.set(p.moduleId, {
          number: p.module.number,
          subjectName: p.module.subject.name,
        });
      }
    });
  });

  const modules = Array.from(moduleMap.entries());

  if (students.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{classData.name} — {classData.course.name}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 pr-4 font-semibold min-w-[150px]">Aluno</th>
              {modules.slice(0, 12).map(([id, m]) => (
                <th key={id} className="px-2 py-2 text-center font-semibold min-w-[80px]">
                  <div className="text-[10px] text-muted-foreground truncate max-w-[80px]">{m.subjectName}</div>
                  <div>M{m.number}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((student) => {
              const progressMap = new Map(student.moduleProgress.map((p) => [p.moduleId, p]));
              return (
                <tr key={student.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 pr-4 font-medium">{student.name}</td>
                  {modules.slice(0, 12).map(([id]) => {
                    const p = progressMap.get(id);
                    const status = p?.status ?? "NOT_STARTED";
                    return (
                      <td key={id} className="px-2 py-2 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          {p?.grade != null && (
                            <span className="font-mono font-bold text-xs">{p.grade.toFixed(0)}</span>
                          )}
                          <span className={`rounded px-1 py-0.5 text-[9px] font-medium ${MODULE_STATUS_COLORS[status]}`}>
                            {MODULE_STATUS_LABELS[status].substring(0, 3)}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
