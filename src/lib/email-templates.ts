/**
 * Plain HTML transactional email templates.
 * Avoids @react-email build complexity — keep it simple, mobile-safe, dark-aware.
 */

interface Branding {
  appName: string;
  schoolName?: string;
  appUrl: string;
}

function baseTemplate(opts: Branding & { title: string; bodyHtml: string }): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;color:#1d1d1f;">
  <div style="max-width:560px;margin:32px auto;padding:0 16px;">
    <div style="background:white;border-radius:14px;padding:28px;box-shadow:0 1px 2px rgba(0,0,0,0.04),0 8px 24px -8px rgba(0,0,0,0.06);">
      <div style="display:inline-block;padding:6px 12px;border-radius:8px;background:#007aff;color:white;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:14px;">
        ${escapeHtml(opts.appName)}${opts.schoolName ? ` &middot; ${escapeHtml(opts.schoolName)}` : ""}
      </div>
      ${opts.bodyHtml}
    </div>
    <p style="text-align:center;margin-top:18px;font-size:11px;color:#86868b;">
      ${escapeHtml(opts.appName)} &middot; <a href="${opts.appUrl}" style="color:#86868b;">${opts.appUrl}</a>
    </p>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function welcomeEmail(opts: Branding & {
  recipientName: string;
  email: string;
  loginUrl: string;
  schoolSlug: string;
  temporaryPassword?: string;
}): { html: string; text: string } {
  const html = baseTemplate({
    appName: opts.appName,
    schoolName: opts.schoolName,
    appUrl: opts.appUrl,
    title: "Bem-vindo ao " + opts.appName,
    bodyHtml: `
      <h1 style="font-size:22px;margin:0 0 10px;letter-spacing:-0.022em;">Olá, ${escapeHtml(opts.recipientName.split(" ")[0])}</h1>
      <p style="font-size:14px;line-height:1.5;color:#424245;margin:0 0 18px;">
        A tua conta foi criada na escola <strong>${escapeHtml(opts.schoolName ?? "")}</strong>.
        Podes aceder com os seguintes dados:
      </p>
      <div style="background:#f5f5f7;border-radius:10px;padding:14px 16px;margin:0 0 18px;font-size:13px;">
        <div style="margin-bottom:6px;"><strong>Email:</strong> ${escapeHtml(opts.email)}</div>
        <div style="margin-bottom:6px;"><strong>Escola:</strong> <code style="background:white;padding:2px 6px;border-radius:4px;font-size:12px;">${escapeHtml(opts.schoolSlug)}</code></div>
        ${opts.temporaryPassword
          ? `<div><strong>Palavra-passe temporária:</strong> <code style="background:white;padding:2px 6px;border-radius:4px;font-size:12px;">${escapeHtml(opts.temporaryPassword)}</code></div>`
          : `<div><em style="color:#86868b;">Usa a palavra-passe que te foi comunicada pelo administrador.</em></div>`}
      </div>
      <a href="${opts.loginUrl}" style="display:inline-block;background:#007aff;color:white;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        Entrar na plataforma
      </a>
      <p style="font-size:12px;color:#86868b;margin:18px 0 0;">
        Por segurança, altera a palavra-passe no primeiro login.
      </p>
    `,
  });
  const text = `Olá ${opts.recipientName},

A tua conta foi criada em ${opts.appName}${opts.schoolName ? ` (${opts.schoolName})` : ""}.

Email: ${opts.email}
Escola: ${opts.schoolSlug}
${opts.temporaryPassword ? `Palavra-passe temporária: ${opts.temporaryPassword}\n` : ""}
Entrar: ${opts.loginUrl}

Por segurança, altera a palavra-passe no primeiro login.`;
  return { html, text };
}

export function passwordResetEmail(opts: Branding & {
  recipientName: string;
  resetUrl: string;
  expiresInHours: number;
}): { html: string; text: string } {
  const html = baseTemplate({
    appName: opts.appName,
    schoolName: opts.schoolName,
    appUrl: opts.appUrl,
    title: "Redefinir palavra-passe",
    bodyHtml: `
      <h1 style="font-size:22px;margin:0 0 10px;letter-spacing:-0.022em;">Pedido de nova palavra-passe</h1>
      <p style="font-size:14px;line-height:1.5;color:#424245;margin:0 0 18px;">
        Olá ${escapeHtml(opts.recipientName.split(" ")[0])}, recebemos um pedido para redefinir a tua palavra-passe.
        Clica no botão abaixo para escolher uma nova.
      </p>
      <a href="${opts.resetUrl}" style="display:inline-block;background:#007aff;color:white;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        Redefinir palavra-passe
      </a>
      <p style="font-size:12px;color:#86868b;margin:18px 0 0;">
        Este link expira em ${opts.expiresInHours}h. Se não pediste esta alteração, ignora este email — a palavra-passe atual continua válida.
      </p>
    `,
  });
  const text = `Pedido de nova palavra-passe

Olá ${opts.recipientName},

Para redefinir a tua palavra-passe abre este link:
${opts.resetUrl}

O link expira em ${opts.expiresInHours}h.
Se não pediste esta alteração, ignora este email.`;
  return { html, text };
}
