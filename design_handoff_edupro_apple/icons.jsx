/* ─── Inline SF-style icons ───
   Stroke-based, 1.6px. Match Apple SF Symbols feel without copying glyphs. */

function Icon({ name, size = 14, color = "currentColor", strokeWidth = 1.6 }) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  const paths = ICONS[name] || ICONS["dot"];
  return <svg {...props}>{paths}</svg>;
}

const ICONS = {
  "grid": <>
    <rect x="3" y="3" width="7" height="7" rx="1.5"/>
    <rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5"/>
    <rect x="14" y="14" width="7" height="7" rx="1.5"/>
  </>,
  "calendar": <>
    <rect x="3" y="5" width="18" height="16" rx="2"/>
    <path d="M3 10h18"/>
    <path d="M8 3v4"/>
    <path d="M16 3v4"/>
  </>,
  "calendar-days": <>
    <rect x="3" y="5" width="18" height="16" rx="2"/>
    <path d="M3 10h18"/>
    <path d="M8 3v4"/>
    <path d="M16 3v4"/>
    <circle cx="8" cy="15" r="0.8" fill="currentColor"/>
    <circle cx="12" cy="15" r="0.8" fill="currentColor"/>
    <circle cx="16" cy="15" r="0.8" fill="currentColor"/>
  </>,
  "message": <>
    <path d="M21 12c0 4.4-4 8-9 8-1.4 0-2.7-.3-3.9-.8L3 21l1.8-4.5C3.7 15 3 13.6 3 12c0-4.4 4-8 9-8s9 3.6 9 8z"/>
  </>,
  "bell": <>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
    <path d="M10 21a2 2 0 0 0 4 0"/>
  </>,
  "clipboard": <>
    <rect x="6" y="4" width="12" height="17" rx="2"/>
    <path d="M9 4v2h6V4"/>
    <path d="M9 12h6"/>
    <path d="M9 16h4"/>
  </>,
  "check": <>
    <path d="M5 12.5l4.5 4.5L19 7.5"/>
  </>,
  "chart": <>
    <path d="M4 20V10"/>
    <path d="M10 20V4"/>
    <path d="M16 20v-8"/>
    <path d="M3 20h18"/>
  </>,
  "book": <>
    <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2V5z"/>
    <path d="M4 17h14"/>
  </>,
  "graduation": <>
    <path d="M12 4l10 5-10 5L2 9l10-5z"/>
    <path d="M6 11v5c0 1 3 2 6 2s6-1 6-2v-5"/>
  </>,
  "briefcase": <>
    <rect x="3" y="7" width="18" height="13" rx="2"/>
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
  </>,
  "award": <>
    <circle cx="12" cy="9" r="6"/>
    <path d="M8.5 13.5L7 22l5-3 5 3-1.5-8.5"/>
  </>,
  "folder": <>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>
  </>,
  "user-x": <>
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M17 9l4 4"/>
    <path d="M21 9l-4 4"/>
  </>,
  "users": <>
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M16 3.5a4 4 0 0 1 0 7"/>
    <path d="M21 21v-2a4 4 0 0 0-3-3.9"/>
  </>,
  "settings": <>
    <circle cx="12" cy="12" r="3"/>
    <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/>
  </>,
  "search": <>
    <circle cx="11" cy="11" r="7"/>
    <path d="M21 21l-4.3-4.3"/>
  </>,
  "chevron-left": <path d="M15 6l-6 6 6 6"/>,
  "chevron-right": <path d="M9 6l6 6-6 6"/>,
  "chevron-down": <path d="M6 9l6 6 6-6"/>,
  "plus": <>
    <path d="M12 5v14"/>
    <path d="M5 12h14"/>
  </>,
  "arrow-up": <path d="M12 19V5M5 12l7-7 7 7"/>,
  "arrow-down": <path d="M12 5v14M19 12l-7 7-7-7"/>,
  "circle": <circle cx="12" cy="12" r="4"/>,
  "dot": <circle cx="12" cy="12" r="2" fill="currentColor"/>,
  "alert": <>
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 8v4"/>
    <circle cx="12" cy="16" r="0.6" fill="currentColor"/>
  </>,
  "x": <>
    <path d="M6 6l12 12"/>
    <path d="M18 6L6 18"/>
  </>,
  "filter": <>
    <path d="M3 5h18"/>
    <path d="M6 12h12"/>
    <path d="M10 19h4"/>
  </>,
  "sun": <>
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>
  </>,
  "play": <path d="M7 4l13 8-13 8z" fill="currentColor"/>,
  "sparkle": <>
    <path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>
  </>,
  "trending": <path d="M3 17l6-6 4 4 8-8M21 7v6h-6"/>,
};

window.Icon = Icon;
window.ICONS = ICONS;
