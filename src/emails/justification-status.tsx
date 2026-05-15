import { Button, Text } from "@react-email/components";
import { EmailLayout, styles } from "./layout";

interface JustificationStatusEmailProps {
  recipientName: string;
  schoolName?: string;
  studentName: string;
  subjectName: string;
  lessonDate: string;
  decision: "APPROVED" | "REJECTED";
  approverName: string;
  comment?: string;
  url?: string;
}

export function JustificationStatusEmail({
  recipientName,
  schoolName,
  studentName,
  subjectName,
  lessonDate,
  decision,
  approverName,
  comment,
  url,
}: JustificationStatusEmailProps) {
  const heading =
    decision === "APPROVED" ? "Justificação aprovada" : "Justificação rejeitada";

  return (
    <EmailLayout
      preview={`${heading} — ${subjectName} (${lessonDate})`}
      heading={heading}
      schoolName={schoolName}
    >
      <Text style={styles.paragraph}>
        Olá <strong style={styles.strong}>{recipientName}</strong>,
      </Text>
      <Text style={styles.paragraph}>
        A justificação de falta de{" "}
        <strong style={styles.strong}>{studentName}</strong> na disciplina de{" "}
        <strong style={styles.strong}>{subjectName}</strong> foi{" "}
        <span style={styles.badge(decision === "APPROVED" ? "green" : "red")}>
          {decision === "APPROVED" ? "Aprovada" : "Rejeitada"}
        </span>
        .
      </Text>

      <div style={{ marginTop: 16 }}>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Data da aula</span>
          <span style={styles.detailValue}>{lessonDate}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Disciplina</span>
          <span style={styles.detailValue}>{subjectName}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Decidido por</span>
          <span style={styles.detailValue}>{approverName}</span>
        </div>
        {comment ? (
          <div style={{ ...styles.detailRow, flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
            <span style={styles.detailLabel}>Comentário</span>
            <span style={styles.detailValue}>{comment}</span>
          </div>
        ) : null}
      </div>

      {url ? (
        <Button href={url} style={styles.ctaButton}>
          Ver detalhes
        </Button>
      ) : null}
    </EmailLayout>
  );
}

export default JustificationStatusEmail;
