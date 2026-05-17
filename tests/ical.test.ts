import { describe, it, expect } from "vitest";
import { buildICal, generateICalToken } from "@/lib/ical";

describe("ical", () => {
  it("gera VCALENDAR válido com VEVENT semanal", () => {
    const ics = buildICal({
      calName: "Teste",
      blocks: [
        {
          id: "block-1",
          dayOfWeek: 1, // Segunda
          startTime: "08:00",
          endTime: "08:50",
          subject: "Português",
          teacher: "Prof Silva",
          room: "Sala 1.1",
          className: "10ºA",
          meetingUrl: null,
          validFrom: null,
          validUntil: null,
        },
      ],
      defaultStartDate: new Date("2025-09-15"),
      defaultEndDate: new Date("2026-06-30"),
    });
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO");
    expect(ics).toContain("SUMMARY:Português · 10ºA");
    expect(ics).toContain("LOCATION:Sala 1.1");
  });

  it("escapa caracteres especiais no SUMMARY", () => {
    const ics = buildICal({
      calName: "Teste",
      blocks: [
        {
          id: "x",
          dayOfWeek: 2,
          startTime: "09:00",
          endTime: "10:00",
          subject: "Math; Lab, advanced",
          teacher: null,
          room: null,
          className: null,
          meetingUrl: null,
          validFrom: null,
          validUntil: null,
        },
      ],
      defaultStartDate: new Date("2025-09-15"),
      defaultEndDate: new Date("2026-06-30"),
    });
    expect(ics).toContain("SUMMARY:Math\\; Lab\\, advanced");
  });

  it("token tem comprimento adequado", () => {
    const t = generateICalToken();
    expect(t).toMatch(/^[a-f0-9]{48}$/);
  });
});
