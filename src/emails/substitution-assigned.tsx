import { Button, Text } from "@react-email/components";
import { EmailLayout, styles } from "./layout";

interface SubstitutionAssignedEmailProps {
  recipientName: string;
  schoolName?: string;
  audience: "STUDENT" | "TEACHER" | "GUARDIAN";
  className: string;
  subjectName: string;
  date: string;
  time: string;
  absentTeacherName: string;
  substituteTeacherName?: string;
  status: "ASSIGNED" | "CONFIRMED" | "CANCELLED" | "PENDING";
  url?: string;
}

const STATUS_LABEL = {
  PENDING: { text: "Sem substituto", color: "amber" as const },
  ASSIGNED: { text: "Substituto atribuído", color: "blue" as const },
  CONFIRMED: { text: "Substituição confirmada", color: "green" as const },
  CANCELLED: { text: "Aula cancelada", color: "red" as const },
};

export function SubstitutionAssignedEmail({
  recipientName,
  schoolName,
  audience,
  className,
  subjectName,
  date,
  time,
  absentTeacherName,
  substituteTeacherName,
  status,
  url,
}: SubstitutionAssignedEmailProps) {
  const heading =
    status === "CANCELLED"
      ? "Aula cancelada"
      : audience === "TEACHER" && status === "ASSIGNED"
        ? "Foste atribuído a uma substituição"
        : "Alteração na aula";

  return (
    <EmailLayout
      preview={`${heading} — ${subjectName} (${className})`}
      heading={heading}
      schoolName={schoolName}
    >
      <Text style={styles.paragraph}>
        Olá <strong style={styles.strong}>{recipientName}</strong>,
      </Text>

      {audience === "TEACHER" && status === "ASSIGNED" ? (
        <Text style={styles.paragraph}>
          Foste atribuído como substituto de{" "}
          <strong style={styles.strong}>{absentTeacherName}</strong> para a aula abaixo. Confirma
          a tua disponibilidade no painel.
        </Text>
      ) : (
        <Text style={styles.paragraph}>
          Houve uma alteração na aula de{" "}
          <strong style={styles.strong}>{subjectName}</strong> da turma{" "}
          <strong style={styles.strong}>{className}</strong>.
        </Text>
      )}

      <div style={{ marginTop: 16 }}>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Estado</span>
          <span style={styles.badge(STATUS_LABEL[status].color)}>
            {STATUS_LABEL[status].text}
          </span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Turma</span>
          <span style={styles.detailValue}>{className}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Disciplina</span>
          <span style={styles.detailValue}>{subjectName}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Data</span>
          <span style={styles.detailValue}>{date}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Hora</span>
          <span style={styles.detailValue}>{time}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Professor titular</span>
          <span style={styles.detailValue}>{absentTeacherName}</span>
        </div>
        {substituteTeacherName ? (
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Substituto</span>
            <span style={styles.detailValue}>{substituteTeacherName}</span>
          </div>
        ) : null}
      </div>

      {url ? (
        <Button href={url} style={styles.ctaButton}>
          Abrir EduPro
        </Button>
      ) : null}
    </EmailLayout>
  );
}

export default SubstitutionAssignedEmail;
