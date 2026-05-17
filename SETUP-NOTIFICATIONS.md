# Setup — Sistema de Notificações Multi-Canal

Este documento descreve como ativar o sistema de notificações (in-app, push, email, SMS) que foi adicionado ao Lectiva.

## 1. Instalar dependências

Foram adicionadas ao `package.json`:
- `resend` — envio de email transacional
- `twilio` — envio de SMS
- `@react-email/components` + `@react-email/render` — templates de email em React

Corre:

```bash
npm install
```

## 2. Aplicar o schema ao DB

Foram adicionados ao `prisma/schema.prisma`:
- Campos `phoneE164` e `phoneVerified` no `User`
- Modelo `NotificationPreference` (preferências por categoria + master toggles + quiet hours)
- Modelo `NotificationDelivery` (auditoria de entregas por canal)
- Modelo `PhoneVerification` (OTP de 6 dígitos com bcrypt + TTL 10min + max 5 tentativas)
- Enums `NotificationChannel`, `NotificationCategory`, `DeliveryStatus`

Aplica:

```bash
npx prisma db push
npx prisma generate
```

> Se houver dados de produção, considera usar `npx prisma migrate dev --name notifications-multichannel` em vez de `db push` (mas o projeto está atualmente configurado para `db push`).

## 3. Provisionar Resend (Email)

1. Cria conta em [resend.com](https://resend.com)
2. Verifica o teu domínio (precisas de acesso aos DNS — SPF, DKIM, MX)
3. Em **API Keys** gera uma chave
4. Adiciona ao `.env`:
   ```
   RESEND_API_KEY="re_..."
   RESEND_FROM_EMAIL="Lectiva <noreply@teudominio.pt>"
   RESEND_REPLY_TO="suporte@teudominio.pt"
   ```

> **Sem chave configurada**, os envios de email são **pulados** (gravados como `SKIPPED` em `NotificationDelivery`), sem erro. A app continua a funcionar.

## 4. Provisionar Twilio (SMS)

1. Cria conta em [twilio.com](https://twilio.com)
2. Em **Phone Numbers**, compra um número OU cria um **Messaging Service** (recomendado — permite sender ID alfanumérico "Lectiva" e opt-out automático em mercados que o exigem)
3. Em **Console**, copia o Account SID e Auth Token
4. Adiciona ao `.env`:
   ```
   TWILIO_ACCOUNT_SID="AC..."
   TWILIO_AUTH_TOKEN="..."
   TWILIO_MESSAGING_SERVICE_SID="MG..."   # OU TWILIO_FROM_NUMBER="+351..."
   ```

> **Sem credenciais Twilio**, os SMS são **pulados**. Em modo dev, o endpoint de OTP devolve o código no JSON (`devCode`) para testares localmente sem créditos da Twilio.

## 5. Verificar que funciona

Após `npm run dev`:

1. Entra como qualquer utilizador
2. Vai a **Perfil → Notificações → Preferências detalhadas** (`/dashboard/settings/notifications`)
3. Confere a página: switches de canais, telefone para SMS, quiet hours, matriz de categorias
4. **Para testar SMS** sem Twilio:
   - Introduz um número PT (`912345678` ou `+351912345678`)
   - Clica em "Enviar código" → vê o toast com `dev: 123456`
   - Mete o código → fica verificado
5. **Para testar email** sem Resend, deixa as preferências como estão e verifica em `notification_deliveries` que o status é `SKIPPED` quando uma ação é executada (ex: marcar uma falta).

## 6. Eventos que disparam notificações

| Evento | Categoria | Destinatários | Canais default |
|---|---|---|---|
| Sala/horário alterado em `ScheduleBlock` PATCH | `SCHEDULE_CHANGE` | Turma + EE + professor | Push, IN_APP, Email |
| Bloco de horário removido (DELETE) | `SCHEDULE_CHANGE` | Turma + EE + professor | Push, IN_APP, Email |
| Falta/atraso registado (`AttendanceRecord` POST com ABSENT/LATE) | `ABSENCE` | Aluno + EE | Push, IN_APP, Email |
| Justificação aprovada/rejeitada | `JUSTIFICATION` | Aluno + EE | Push, IN_APP, Email |
| Substituto atribuído | `SUBSTITUTION` | Substituto | Push, IN_APP, Email |
| Substituição alterada / aula cancelada | `LESSON_CANCELLED` | Turma + EE | Push, IN_APP, Email, **SMS** (cancelamentos passam quiet hours) |
| Submissão avaliada com nota | `GRADE` | Aluno + EE | IN_APP, Email |
| Broadcast manual (`POST /api/notifications`) | `ANNOUNCEMENT` | Conforme `recipientType` | Push, IN_APP |

## 7. Arquitetura do dispatcher

`src/lib/notify.ts` exporta `notify({ ... })`:

1. **Persiste** sempre `Notification` + `NotificationRecipient` (IN_APP garantido)
2. **Carrega preferências** por utilizador (com defaults se não existirem)
3. **Aplica filtros**: master toggles, quiet hours (exceto se `urgentBypassQuietHours: true`), telefone verificado para SMS
4. **Cria `NotificationDelivery`** com status QUEUED antes de tentar enviar
5. **Dispara em paralelo** push (web-push) + email (Resend) + SMS (Twilio)
6. **Atualiza deliveries** para SENT/FAILED/SKIPPED conforme o resultado
7. Erros nunca quebram a operação principal (`void notify(...).catch(...)` no caller)

## 8. Auditoria

Cada entrega gera um registo em `notification_deliveries`. Consulta-os para debug:

```sql
SELECT d.channel, d.status, d.target, d.error, d.sentAt, n.title
FROM notification_deliveries d
JOIN notification_recipients r ON r.id = d.recipientId
JOIN notifications n ON n.id = r.notificationId
ORDER BY d.createdAt DESC
LIMIT 50;
```

Sugestão para Sprint 2: criar `/dashboard/admin/notifications/logs` para SCHOOL_ADMIN inspecionar entregas.

## 9. Próximas Sprints sugeridas

- **Sprint 2**: Cron jobs (reminders diários, prazos PAP/FCT a aproximar-se, digest semanal)
- **Sprint 3**: Service Worker PWA + opt-in flow no onboarding
- **Sprint 4**: Endpoint de webhooks Resend/Twilio (status updates → atualizar `DeliveryStatus` para DELIVERED/BOUNCED)
- **Sprint 5**: Painel admin de logs + reenvio manual
