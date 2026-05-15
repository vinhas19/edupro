import twilio, { type Twilio } from "twilio";

let client: Twilio | null = null;

function getClient(): Twilio | null {
  if (client) return client;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  client = twilio(sid, token);
  return client;
}

export interface SendSmsParams {
  to: string;            // E.164 (+351...)
  body: string;          // <= 160 chars idealmente para evitar segmentação
}

export interface SendSmsResult {
  ok: boolean;
  sid?: string;
  skipped?: boolean;
  error?: string;
}

export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  const t = getClient();
  if (!t) {
    console.warn("[sms] TWILIO_* not configured; skipping SMS to", params.to);
    return { ok: false, skipped: true, error: "TWILIO_* missing" };
  }

  if (!/^\+[1-9]\d{6,14}$/.test(params.to)) {
    return { ok: false, error: "Invalid E.164 phone number" };
  }

  // Twilio aceita either Messaging Service SID OR a from number; preferir Messaging Service para alphabetic sender + opt-out automático.
  const msgServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!msgServiceSid && !from) {
    return { ok: false, error: "TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_NUMBER required" };
  }

  try {
    const msg = await t.messages.create({
      to: params.to,
      body: params.body,
      ...(msgServiceSid ? { messagingServiceSid: msgServiceSid } : { from }),
    });
    return { ok: true, sid: msg.sid };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

export function isSmsConfigured(): boolean {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
}

// Normaliza um número PT → E.164. Aceita "912345678", "+351912345678", "00351 912 345 678".
export function normalizePhone(input: string): string | null {
  const cleaned = input.replace(/[\s\-().]/g, "");
  if (!cleaned) return null;
  // Já em E.164
  if (/^\+[1-9]\d{6,14}$/.test(cleaned)) return cleaned;
  // 00351... → +351...
  if (/^00[1-9]\d{6,14}$/.test(cleaned)) return "+" + cleaned.slice(2);
  // 9 dígitos PT (9XXXXXXXX) → +351
  if (/^9\d{8}$/.test(cleaned)) return "+351" + cleaned;
  // 2 dígitos + 8 = fixo PT (rare for SMS but accept)
  if (/^2\d{8}$/.test(cleaned)) return "+351" + cleaned;
  return null;
}
