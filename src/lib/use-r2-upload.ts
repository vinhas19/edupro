"use client";

import { useState } from "react";

export type R2Visibility =
  | "PRIVATE"
  | "STAFF_SHARED"
  | "ADMIN_SHARED"
  | "CLASS_SHARED"
  | "POST_ATTACHMENT"
  | "SUBMISSION";

export interface UploadedFile {
  id: string;
  name: string;
  url: string;
}

interface UploadOptions {
  visibility: R2Visibility;
  classId?: string;
  subjectId?: string;
  onError?: (msg: string) => void;
}

export function useR2Upload({ visibility, classId, subjectId, onError }: UploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function uploadOne(file: File): Promise<UploadedFile | null> {
    setUploading(true);
    setProgress(0);
    try {
      // 1. Get presigned URL
      const presignRes = await fetch("/api/files/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          contentType: file.type || "application/octet-stream",
          size: file.size,
          visibility,
        }),
      });
      if (!presignRes.ok) {
        const j = await presignRes.json().catch(() => ({}));
        onError?.(j.error?.toString() ?? "Falha ao iniciar upload");
        return null;
      }
      const { uploadUrl, key } = await presignRes.json();

      // 2. PUT to R2 with progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`R2 ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.send(file);
      });

      // 3. Notify server to create DB record
      const completeRes = await fetch("/api/files/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: file.name,
          key,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
          visibility,
          classId,
          subjectId,
        }),
      });
      if (!completeRes.ok) {
        onError?.("Falha ao registar ficheiro");
        return null;
      }
      const data = await completeRes.json();
      return { id: data.id, name: data.name, url: data.url };
    } catch (err: any) {
      onError?.(err?.message ?? "Erro no upload");
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  async function uploadMany(files: FileList | File[]): Promise<UploadedFile[]> {
    const arr = Array.from(files);
    const results: UploadedFile[] = [];
    for (const f of arr) {
      const r = await uploadOne(f);
      if (r) results.push(r);
    }
    return results;
  }

  return { uploadOne, uploadMany, uploading, progress };
}
