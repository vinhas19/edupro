import { S3Client, DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID ?? "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID ?? "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY ?? "";

export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? "lectiva-files";
export const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? "").replace(/\/+$/, "");
export const R2_CONFIGURED = !!(accountId && accessKeyId && secretAccessKey && R2_PUBLIC_URL);

export const r2 = new S3Client({
  region: "auto",
  endpoint: accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined,
  credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
});

export async function presignUpload(key: string, contentType: string, expiresIn = 60 * 5) {
  const cmd = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2, cmd, { expiresIn });
}

export async function deleteObject(key: string) {
  if (!R2_CONFIGURED) return;
  await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
}

export function publicUrl(key: string) {
  return `${R2_PUBLIC_URL}/${key}`;
}

export function buildKey(userId: string, originalName: string, scope = "files") {
  const ext = originalName.includes(".") ? originalName.split(".").pop() : "";
  const safe = originalName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const stamp = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  return `${scope}/${userId}/${stamp}-${safe || "file" + (ext ? "." + ext : "")}`;
}
