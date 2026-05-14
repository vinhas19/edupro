"use client";

import { useRouter } from "next/navigation";
import { R2UploadButton } from "./r2-upload-button";
import type { R2Visibility } from "@/lib/use-r2-upload";

// Maps the old "endpoint" prop names to R2 visibility values
type Endpoint = "personalFile" | "staffFile" | "adminFile";

const VISIBILITY_MAP: Record<Endpoint, R2Visibility> = {
  personalFile: "PRIVATE",
  staffFile: "STAFF_SHARED",
  adminFile: "ADMIN_SHARED",
};

export function FileUploader({ endpoint, label }: { endpoint: Endpoint; label: string }) {
  const router = useRouter();
  return (
    <R2UploadButton
      visibility={VISIBILITY_MAP[endpoint]}
      label={label}
      size="sm"
      onUploaded={() => router.refresh()}
    />
  );
}
