import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

interface LayoutProps {
  preview: string;
  heading: string;
  schoolName?: string;
  children: ReactNode;
}

export function EmailLayout({ preview, heading, schoolName, children }: LayoutProps) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "EduPro";
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={brand}>{appName}</Heading>
            {schoolName ? <Text style={subBrand}>{schoolName}</Text> : null}
          </Section>
          <Section style={card}>
            <Heading as="h2" style={h2}>
              {heading}
            </Heading>
            {children}
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Recebes este email porque tens uma conta em {appName}. Podes ajustar as
            preferências de notificações nas Definições da tua conta.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#f6f7f9",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen,Ubuntu,Cantarell,sans-serif',
  margin: 0,
  padding: 0,
};

const container: React.CSSProperties = {
  margin: "0 auto",
  maxWidth: 560,
  padding: "32px 16px",
};

const header: React.CSSProperties = {
  textAlign: "center",
  marginBottom: 16,
};

const brand: React.CSSProperties = {
  color: "#0a0a0a",
  fontSize: 24,
  fontWeight: 700,
  margin: 0,
};

const subBrand: React.CSSProperties = {
  color: "#6b7280",
  fontSize: 13,
  margin: "4px 0 0",
};

const card: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: 12,
  padding: 32,
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
};

const h2: React.CSSProperties = {
  color: "#0a0a0a",
  fontSize: 20,
  fontWeight: 600,
  margin: "0 0 16px",
};

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const footer: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: 12,
  lineHeight: 1.5,
  textAlign: "center",
};

// Estilos partilhados úteis nos templates
export const styles = {
  paragraph: {
    color: "#374151",
    fontSize: 14,
    lineHeight: 1.6,
    margin: "0 0 12px",
  } as React.CSSProperties,
  strong: { color: "#0a0a0a" } as React.CSSProperties,
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #f3f4f6",
  } as React.CSSProperties,
  detailLabel: {
    color: "#6b7280",
    fontSize: 13,
  } as React.CSSProperties,
  detailValue: {
    color: "#0a0a0a",
    fontSize: 13,
    fontWeight: 500,
  } as React.CSSProperties,
  ctaButton: {
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    color: "#ffffff",
    display: "inline-block",
    fontSize: 14,
    fontWeight: 500,
    padding: "10px 18px",
    textDecoration: "none",
    marginTop: 16,
  } as React.CSSProperties,
  badge: (color: "blue" | "green" | "red" | "amber") => {
    const map = {
      blue: { bg: "#dbeafe", fg: "#1d4ed8" },
      green: { bg: "#dcfce7", fg: "#15803d" },
      red: { bg: "#fee2e2", fg: "#b91c1c" },
      amber: { bg: "#fef3c7", fg: "#b45309" },
    };
    return {
      backgroundColor: map[color].bg,
      color: map[color].fg,
      borderRadius: 999,
      padding: "2px 10px",
      fontSize: 12,
      fontWeight: 600,
      display: "inline-block",
    } as React.CSSProperties;
  },
};
