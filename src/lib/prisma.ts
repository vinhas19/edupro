import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    // Supabase Transaction pooler (port 6543): cada instância usa só 1 ligação
    // porque o pooler multiplexa internamente — evita estourar pool_size do
    // Supabase (15 em Session, ~200 em Transaction).
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    // TLS sem verificar CA chain. O Netlify Functions runtime não tem o CA
    // intermédio que o pooler do Supabase usa, e dava
    // "self-signed certificate in certificate chain". O tráfego continua
    // encriptado — só não verificamos a cadeia de assinatura.
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
