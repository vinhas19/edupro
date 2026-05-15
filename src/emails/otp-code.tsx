import { Text } from "@react-email/components";
import { EmailLayout, styles } from "./layout";

interface OtpCodeEmailProps {
  recipientName: string;
  schoolName?: string;
  code: string;
  purpose: "PHONE_VERIFICATION" | "LOGIN" | "PASSWORD_RESET";
  expiresInMinutes: number;
}

const PURPOSE_TEXT = {
  PHONE_VERIFICATION: "Para confirmares o teu número de telefone",
  LOGIN: "Para entrares na tua conta",
  PASSWORD_RESET: "Para redefinires a tua palavra-passe",
};

export function OtpCodeEmail({
  recipientName,
  schoolName,
  code,
  purpose,
  expiresInMinutes,
}: OtpCodeEmailProps) {
  return (
    <EmailLayout
      preview={`Código de verificação: ${code}`}
      heading="O teu código de verificação"
      schoolName={schoolName}
    >
      <Text style={styles.paragraph}>
        Olá <strong style={styles.strong}>{recipientName}</strong>,
      </Text>
      <Text style={styles.paragraph}>{PURPOSE_TEXT[purpose]}, usa o seguinte código:</Text>

      <div
        style={{
          margin: "24px 0",
          padding: "20px",
          backgroundColor: "#f9fafb",
          borderRadius: 8,
          textAlign: "center",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: "0.3em",
          color: "#0a0a0a",
        }}
      >
        {code}
      </div>

      <Text style={{ ...styles.paragraph, fontSize: 13, color: "#6b7280" }}>
        Este código expira em {expiresInMinutes} minutos. Se não foste tu a pedir, ignora este
        email.
      </Text>
    </EmailLayout>
  );
}

export default OtpCodeEmail;
