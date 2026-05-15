"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { useR2Upload, type R2Visibility, type UploadedFile } from "@/lib/use-r2-upload";
import { toast } from "sonner";

interface Props {
  visibility: R2Visibility;
  classId?: string;
  subjectId?: string;
  moduleId?: string;
  folderId?: string;
  multiple?: boolean;
  accept?: string;
  label?: string;
  size?: "sm" | "default";
  variant?: "default" | "outline";
  onUploaded?: (files: UploadedFile[]) => void;
}

export function R2UploadButton({
  visibility,
  classId,
  subjectId,
  moduleId,
  folderId,
  multiple = true,
  accept,
  label = "Carregar ficheiro",
  size = "default",
  variant = "default",
  onUploaded,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadMany, uploading, progress } = useR2Upload({
    visibility,
    classId,
    subjectId,
    moduleId,
    folderId,
    onError: (msg) => toast.error(msg),
  });

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    const result = await uploadMany(files);
    if (result.length > 0) {
      toast.success(`${result.length} ficheiro(s) carregado(s)`);
      onUploaded?.(result);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple={multiple}
        accept={accept}
        onChange={onPick}
      />
      <Button
        type="button"
        size={size}
        variant={variant}
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            {progress > 0 ? `${progress}%` : "A carregar..."}
          </>
        ) : (
          <>
            <Upload className="mr-2 h-3.5 w-3.5" />
            {label}
          </>
        )}
      </Button>
    </>
  );
}
