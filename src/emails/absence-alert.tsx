import { Button, Text } from "@react-email/components";
import { EmailLayout, styles } from "./layout";

interface AbsenceAlertEmailProps {
  recipientName: string;
  schoolName?: string;
  studentName: string;
  className: string;
  subjectName: string;
  lessonDate: string;        // ex: "15/05/2026"
  lessonTime: string;        // ex: "10:00 - 10:50"
  status: "ABSENT" | "LATE";
  totalAbsences?: number;    // contagem total no módulo, opcional
  justifyUrl?: string;
}

export function AbsenceAlertEmail({
  recipientName,
  schoolName,
  studentName,
  className,
  subjectName,
  lessonDate,
  lessonTime,
  status,
  totalAbsences,
  justifyUrl,
}: AbsenceAlertEmailProps) {
  const heading = status === "LATE" ? "Atraso registado" : "Falta registada";
  return (
    <EmailLayout
      preview={`${heading} — ${studentName}`}
      heading={heading}
      schoolName={schoolName}
    >
      <Text style={styles.paragraph}>
        Olá <strong style={styles.strong}>{recipientName}</strong>,
      </Text>
      <Text style={styles.paragraph}>
        Foi registada uma{" "}
        <span style={styles.badge(status === "LATE" ? "amber" : "red")}>
          {status === "LATE" ? "Atraso" : "Falta"}
        </span>{" "}
        a <strong style={styles.strong}>{studentName}</strong> na disciplina de{" "}
        <strong style={styles.strong}>{subjectName}</strong>.
      </Text>

      <div style={{ marginTop: 16 }}>
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
          <span style={styles.detailValue}>{lessonDate}</span>
        </div>
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Hora</span>
          <span style={styles.detailValue}>{lessonTime}</span>
        </div>
        {totalAbsences != null ? (
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>Total de faltas no módulo</span>
            <span style={styles.detailValue}>{totalAbsences}</span>
          </div>
        ) : null}
      </div>

      {justifyUrl ? (
        <Button href={justifyUrl} style={styles.ctaButton}>
          Justificar falta
        </Button>
      ) : null}

      <Text style={{ ...styles.paragraph, marginTop: 16, color: "#6b7280", fontSize: 12 }}>
        Se considera que a falta foi registada por engano, contacte o(a) diretor(a) de turma.
      </Text>
    </EmailLayout>
  );
}

export default AbsenceAlertEmail;
