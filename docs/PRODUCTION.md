# EduPro — Checklist de produção

Este documento lista os passos obrigatórios antes de pôr a aplicação no ar para uma escola real.

## 1. Variáveis de ambiente

Todas estas têm de estar definidas em produção:

```bash
# Base de dados
DATABASE_URL="postgresql://user:pass@host:5432/edupro?schema=public&sslmode=require"

# Auth
AUTH_SECRET="<gerar com: openssl rand -base64 48>"
AUTH_URL="https://app.edupro.pt"
NEXT_PUBLIC_APP_URL="https://app.edupro.pt"

# Cloudflare R2
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="edupro-files"
R2_PUBLIC_URL="https://cdn.edupro.pt"

# Web Push (gerar uma vez: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:admin@edupro.pt"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="<igual ao VAPID_PUBLIC_KEY>"

# Email transacional (Resend)
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="EduPro <noreply@app.edupro.pt>"
RESEND_REPLY_TO="suporte@edupro.pt"

# Error tracking (opcional mas RECOMENDADO)
SENTRY_DSN="https://...@sentry.io/..."
NEXT_PUBLIC_SENTRY_DSN="<igual ao SENTRY_DSN>"
SENTRY_ENVIRONMENT="production"
```

## 2. Migrar de `db push` para `migrate`

A app foi desenvolvida com `prisma db push` (sem migrações versionadas). Antes de produção:

```bash
# 1. Cria a baseline a partir do schema actual
mkdir -p prisma/migrations/0_init
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/0_init/migration.sql

# 2. Marca como aplicada na BD existente (NÃO faz drop)
npx prisma migrate resolve --applied 0_init

# 3. Daqui em diante usa SEMPRE
npx prisma migrate dev --name <descricao>   # em dev
npx prisma migrate deploy                   # em produção (CI)
```

## 3. CORS no R2

```bash
R2_CORS_ORIGINS="https://app.edupro.pt" npm run r2:cors
```

## 4. Healthcheck

Configura o uptime monitor (UptimeRobot, BetterStack, Pingdom, etc.) para:

```
GET https://app.edupro.pt/api/health
```

Retorna 200 se DB está OK, 503 se não. Alerta no Slack/email se 503 > 2 minutos.

## 5. Backup

Garante backups automáticos do Postgres:

- **Neon/Supabase/Railway**: já têm point-in-time recovery (7 dias). Confirma.
- **Self-hosted**: `pg_dump` diário para S3/R2, retenção 30 dias.

## 6. Sentry (recomendado)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Depois de instalar, define `SENTRY_DSN` no `.env` de produção.

## 7. Domínio + HTTPS

- DNS aponta para o host (Vercel/Railway/etc.).
- Certificado TLS automático (Let's Encrypt via host) — confirma renovação.
- Cookies `secure` apenas em HTTPS (Auth.js já configura).

## 8. Rate limits (já implementados)

- Login: 6 tentativas/5min por (email + escola). Bloqueia conta temporariamente.
- `/api/files/presign`: 60/min por utilizador.
- `/api/import/users`: 5/min por admin.
- `/api/auth/forgot-password`: 3/min, 10/hora por IP.
- `/api/me/export` e `/api/me/delete`: 3/hora por utilizador.

O store é em memória — para multi-instance produção, migra `src/lib/rate-limit.ts` para Redis (Upstash).

## 9. RGPD

Implementado:
- `/api/me/export` — utilizador transfere os seus dados.
- `/api/me/delete` — anonimiza a conta (mantém histórico académico anonimamente).
- `AuditLog` regista quem alterou o quê.

Falta (a fazer manualmente):
- Política de privacidade visível no rodapé das páginas públicas.
- Termos de utilização aceites no primeiro login.
- TTL no `AuditLog` (recomendado: 5 anos para escola).

## 10. Smoke test antes de lançar

- [ ] Criar utilizador via admin → recebe welcome email
- [ ] Login + esqueci-me da palavra-passe → email chega → reset funciona
- [ ] Upload de ficheiro grande (~10 MB) — funciona sem timeout
- [ ] Marcar presença com 30+ alunos — sem N+1 visível
- [ ] Healthcheck retorna 200
- [ ] /api/me/export devolve JSON
- [ ] Apagar conta → user fica "Utilizador apagado", login bloqueado
