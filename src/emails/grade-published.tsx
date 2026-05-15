import { Button, Text } from "@react-email/components";
import { EmailLayout, styles } from "./layout";

interface GradePublishedEmailProps {
  recipientName: string;
  schoolName?: string;
  studentName: string;
  subjectName: string;
  moduleName?: string;
  grade: number;
  maxGrade?: number;
  status?: "APPROVED" | "FAILED" | "RECURSO" | "SPECIAL_EPOCH";
  evaluatorName?: string;
  url?: string;
}

const STATUS_LABEL: Record<NonNullable<GradePublishedEmailProps["status"]>, { text: string; color: "green" | "red" | "amber" | "blue" }> = {
  APPROVED: { text: "Aprovado", color: "green" },
  FAILED: { text: "Não aprovado", color: "red" },
  RECURSO: { text: "Em recurso", color: "amber" },
  SPECIAL_EPOCH: { text: "Época especial", color: "blue" },
};

export function GradePublishedEmail({
  recipientName,
  schoolName,
  studentName,
  subjectName,
  moduleName,
  grade,
  maxGrade = 20,
  status,
  evaluatorName,
  url,
}: GradePublishedEmailProps) {
  const heading = moduleName ? "Nova nota de módulo" : "Nova nota publicada";
  return (
    <EmailLayout
      preview={`${heading} — ${subjectName}: ${grade}`}
      heading={heading}
      schoolName={schoolName}
    >
      <Text style={styles.paragraph}>
        Olá <strong style={styles.strong}>{recipientName}</strong>,
      </Text>
      <Text style={styles.paragraph}>
        Foi publicada uma nova nota para{" "}
        <strong style={styles.strong}>{studentName}</strong>.
      </Text>

      <div
        style={{
          marginTop: 16,
          padding: 20,
          backgroundColor: "#f9fafb",
          borderRadius: 8,
          textAlign: "center",
        }}
      >
        <Text style={{ ...styles.paragraph, margin: 0, color: "#6b7280" }}>
          {subjectName}
          {moduleName ? ` · ${moduleName}` : ""}
        </Text>
        <Text
          style={{
            margin: "8px 0",
            fontSize: 36,
            fontWeight: 700,
            color: "#0a0a0a",
          }}
        >
          {grade}
          <span style={{ fontSize: 18, fontWeight: 400, color: "#9ca3af" }}>
            {" "}
            / {maxGrade}
          </span>
        </Text>
        {status ? (
          <span style={styles.badge(STATUS_LABEL[status].color)}>
            {STATUS_LABEL[status].text}
          </span>
        ) : null}
      </div>

      {evaluatorName ? (
        <Text style={{ ...styles.paragraph, marginTop: 16, color: "#6b7280", fontSize: 13 }}>
          Avaliação registada por {evaluatorName}.
        </Text>
      ) : null}

      {url ? (
        <Button href={url} style={styles.ctaButton}>
          Ver boletim
        </Button>
      ) : null}
    </EmailLayout>
  );
}

export default GradePublishedEmail;
