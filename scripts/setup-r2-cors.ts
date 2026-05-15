/**
 * Configure CORS on the R2 bucket so the browser can upload directly via presigned URLs.
 * Run with: npm run r2:cors
 *
 * Add/Remove origins by editing the ALLOWED_ORIGINS list below or via $env.
 */
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3";
import * as fs from "node:fs";
import * as path from "node:path";

// Tiny .env loader (avoids dotenv dep)
function loadEnv() {
  const file = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}
loadEnv();

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME ?? "edupro-files";

if (!accountId || !accessKeyId || !secretAccessKey) {
  console.error("[setup-r2-cors] Missing env. Need R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in .env");
  process.exit(1);
}

// Add prod domains here (without trailing slash). Comma-separated env var overrides.
const ALLOWED_ORIGINS: string[] = (process.env.R2_CORS_ORIGINS
  ? process.env.R2_CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
  : [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      // "https://app.edupro.pt",
    ]);

const client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

async function main() {
  const cors = {
    CORSRules: [
      {
        AllowedOrigins: ALLOWED_ORIGINS,
        AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
        AllowedHeaders: ["*"],
        ExposeHeaders: ["ETag", "x-amz-version-id", "x-amz-request-id", "x-amz-id-2"],
        MaxAgeSeconds: 3600,
      },
    ],
  };

  console.log(`[setup-r2-cors] Bucket:  ${bucket}`);
  console.log(`[setup-r2-cors] Origins: ${ALLOWED_ORIGINS.join(", ")}`);

  await client.send(
    new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: cors,
    }),
  );
  console.log("[setup-r2-cors] CORS rule applied.");

  try {
    const current = await client.send(new GetBucketCorsCommand({ Bucket: bucket }));
    console.log("[setup-r2-cors] Current CORS:");
    console.log(JSON.stringify(current.CORSRules, null, 2));
  } catch (err) {
    console.warn("[setup-r2-cors] Could not read back CORS:", (err as Error).message);
  }
}

main().catch((err) => {
  console.error("[setup-r2-cors] Failed:", err);
  process.exit(1);
});
