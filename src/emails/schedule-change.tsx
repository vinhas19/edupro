import { Button, Text } from "@react-email/components";
import { EmailLayout, styles } from "./layout";

interface ScheduleChangeEmailProps {
  recipientName: string;
  schoolName?: string;
  className: string;
  subjectName: string;
  changeType: "CREATED" | "UPDATED" | "DELETED" | "ROOM_CHANGED" | "TEACHER_CHANGED";
  before?: { day: string; time: string; room?: string; teacher?: string };
  after?: { day: string; time: string; room?: string; teacher?: string };
  url?: string;
}

const TYPE_LABEL = {
  CREATED: "Nova aula adicionada",
  UPDATED: "Horário atualizado",
  DELETED: "Aula removida do horário",
  ROOM_CHANGED: "Sala alterada",
  TEACHER_CHANGED: "Professor alterado",
} as const;

export function ScheduleChangeEmail({
  recipientName,
  schoolName,
  className,
  subjectName,
  changeType,
  before,
  after,
  url,
}: ScheduleChangeEmailProps) {
  const heading = TYPE_LABEL[changeType];
  return (
    <EmailLayout
      preview={`${heading} — ${subjectName} (${className})`}
      heading={heading}
      schoolName={schoolName}
    >
      <Text style={styles.paragraph}>
        Olá <strong style={styles.strong}>{recipientName}</strong>, houve uma alteração ao
        horário da turma <strong style={styles.strong}>{className}</strong>.
      </Text>

      <div style={{ marginTop: 16 }}>
        <Text style={{ ...styles.paragraph, marginBottom: 8 }}>
          <strong style={styles.strong}>Disciplina:</strong> {subjectName}
        </Text>

        {before && changeType !== "CREATED" ? (
          <div style={{ marginBottom: 12 }}>
            <Text style={{ ...styles.paragraph, marginBottom: 4, color: "#9ca3af" }}>
              Antes
            </Text>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Dia / Hora</span>
              <span style={{ ...styles.detailValue, textDecoration: "line-through" }}>
                {before.day} · {before.time}
              </span>
            </div>
            {before.room ? (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Sala</span>
                <span style={{ ...styles.detailValue, textDecoration: "line-through" }}>
                  {before.room}
                </span>
              </div>
            ) : null}
            {before.teacher ? (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Professor</span>
                <span style={{ ...styles.detailValue, textDecoration: "line-through" }}>
                  {before.teacher}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}

        {after && changeType !== "DELETED" ? (
          <div>
            <Text style={{ ...styles.paragraph, marginBottom: 4, color: "#15803d" }}>
              Depois
            </Text>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Dia / Hora</span>
              <span style={styles.detailValue}>
                {after.day} · {after.time}
              </span>
            </div>
            {after.room ? (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Sala</span>
                <span style={styles.detailValue}>{after.room}</span>
              </div>
            ) : null}
            {after.teacher ? (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Professor</span>
                <span style={styles.detailValue}>{after.teacher}</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {url ? (
        <Button href={url} style={styles.ctaButton}>
          Ver horário completo
        </Button>
      ) : null}
    </EmailLayout>
  );
}

export default ScheduleChangeEmail;
