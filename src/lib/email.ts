import { Resend } from "resend";
import { render } from "@react-email/render";
import type { ReactElement } from "react";

let client: Resend | null = null;

function getClient(): Resend | null {
  if (client) return client;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  client = new Resend(key);
  return client;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  react?: ReactElement;
  html?: string;
  text?: string;
  replyTo?: string;
  tag?: string;
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  skipped?: boolean;
  error?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const resend = getClient();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured; skipping email to", params.to);
    return { ok: false, skipped: true, error: "RESEND_API_KEY missing" };
  }

  const from = process.env.RESEND_FROM_EMAIL ?? "EduPro <noreply@edupro.local>";
  const replyTo = params.replyTo ?? process.env.RESEND_REPLY_TO;

  let html = params.html;
  let text = params.text;
  if (!html && params.react) {
    html = await render(params.react);
    text = text ?? (await render(params.react, { plainText: true }));
  }

  if (!html && !text) {
    return { ok: false, error: "No content (html/text/react required)" };
  }

  try {
    // Resend v6's TS types use a discriminated union (template vs html/text) that
    // doesn't narrow cleanly through our wrapper. Runtime accepts the shape below.
    const payload: Parameters<typeof resend.emails.send>[0] = {
      from,
      to: params.to,
      subject: params.subject,
      html: html ?? "",
      text,
      replyTo,
      ...(params.tag ? { tags: [{ name: "category", value: params.tag }] } : {}),
    } as Parameters<typeof resend.emails.send>[0];

    const res = await resend.emails.send(payload);
    if (res.error) {
      return { ok: false, error: res.error.message ?? String(res.error) };
    }
    return { ok: true, id: res.data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
