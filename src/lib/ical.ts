import crypto from "crypto";

const DAY_MAP: Record<number, string> = {
  1: "MO",
  2: "TU",
  3: "WE",
  4: "TH",
  5: "FR",
  6: "SA",
  7: "SU",
};

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function localToUTC(year: number, month: number, day: number, h: number, m: number): string {
  // Treat as local time (Europe/Lisbon assumed for school) — emit as floating local (no Z)
  return `${year}${pad(month)}${pad(day)}T${pad(h)}${pad(m)}00`;
}

export interface ICalBlock {
  id: string;
  dayOfWeek: number;       // 1..7
  startTime: string;       // "HH:MM"
  endTime: string;
  subject: string;
  teacher?: string | null;
  room?: string | null;
  className?: string | null;
  meetingUrl?: string | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
}

/**
 * Build an iCalendar (.ics) text from recurring school blocks.
 * Uses weekly recurrence with BYDAY based on dayOfWeek.
 */
export function buildICal(opts: {
  calName: string;
  blocks: ICalBlock[];
  defaultStartDate: Date;
  defaultEndDate: Date;
}): string {
  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//EduPro//Schedule//PT");
  lines.push(`X-WR-CALNAME:${escapeText(opts.calName)}`);
  lines.push("X-WR-TIMEZONE:Europe/Lisbon");

  const dtStamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  for (const b of opts.blocks) {
    const from = b.validFrom ?? opts.defaultStartDate;
    const until = b.validUntil ?? opts.defaultEndDate;
    if (!DAY_MAP[b.dayOfWeek]) continue;

    // Find the first matching weekday on/after `from`
    const first = new Date(from);
    const jsDay = first.getDay() === 0 ? 7 : first.getDay();
    let delta = b.dayOfWeek - jsDay;
    if (delta < 0) delta += 7;
    first.setDate(first.getDate() + delta);

    const [sh, sm] = b.startTime.split(":").map(Number);
    const [eh, em] = b.endTime.split(":").map(Number);

    const startStr = localToUTC(first.getFullYear(), first.getMonth() + 1, first.getDate(), sh, sm);
    const endStr = localToUTC(first.getFullYear(), first.getMonth() + 1, first.getDate(), eh, em);

    const untilStr =
      `${until.getFullYear()}${pad(until.getMonth() + 1)}${pad(until.getDate())}T235959Z`;

    const uid = crypto.createHash("sha1").update(b.id + dtStamp).digest("hex") + "@edupro";

    let summary = b.subject;
    if (b.className) summary += ` · ${b.className}`;
    const descBits: string[] = [];
    if (b.teacher) descBits.push(`Prof: ${b.teacher}`);
    if (b.room) descBits.push(`Sala: ${b.room}`);
    if (b.meetingUrl) descBits.push(`Aula online: ${b.meetingUrl}`);

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtStamp}`);
    lines.push(`DTSTART;TZID=Europe/Lisbon:${startStr}`);
    lines.push(`DTEND;TZID=Europe/Lisbon:${endStr}`);
    lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${DAY_MAP[b.dayOfWeek]};UNTIL=${untilStr}`);
    lines.push(`SUMMARY:${escapeText(summary)}`);
    if (descBits.length) lines.push(`DESCRIPTION:${escapeText(descBits.join("\\n"))}`);
    if (b.room) lines.push(`LOCATION:${escapeText(b.room)}`);
    if (b.meetingUrl) lines.push(`URL:${b.meetingUrl}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  // RFC 5545 recommends CRLF line endings
  return lines.join("\r\n");
}

export function generateICalToken(): string {
  return crypto.randomBytes(24).toString("hex");
}
