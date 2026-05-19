"use client";

import {
  CSSProperties,
  ElementType,
  Fragment,
  ReactNode,
  Ref,
  useEffect,
  useRef,
  useState,
} from "react";
import "./landing.css";

/* ─── Inline icon set (lifted from the design bundle) ───────────────── */

type IconName =
  | "grid"
  | "calendar"
  | "calendar-days"
  | "message"
  | "bell"
  | "clipboard"
  | "check"
  | "chart"
  | "book"
  | "graduation"
  | "briefcase"
  | "award"
  | "folder"
  | "user-x"
  | "users"
  | "settings"
  | "arrow"
  | "sparkle"
  | "play"
  | "plus"
  | "search"
  | "shield"
  | "download"
  | "bolt"
  | "eye"
  | "lock"
  | "globe";

function Icon({ name, size = 14 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    strokeWidth: 1.8,
    fill: "none" as const,
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const paths: Record<IconName, ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </>
    ),
    "calendar-days": (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </>
    ),
    message: (
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    ),
    bell: (
      <>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </>
    ),
    clipboard: (
      <>
        <rect x="8" y="2" width="8" height="4" rx="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      </>
    ),
    check: <path d="M20 6 9 17l-5-5" />,
    chart: (
      <>
        <path d="M3 3v18h18" />
        <path d="M7 14l4-4 4 4 5-7" />
      </>
    ),
    book: (
      <>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </>
    ),
    graduation: (
      <>
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </>
    ),
    briefcase: (
      <>
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </>
    ),
    award: (
      <>
        <circle cx="12" cy="8" r="6" />
        <path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5" />
      </>
    ),
    folder: (
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    ),
    "user-x": (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="m17 8 5 5M22 8l-5 5" />
      </>
    ),
    users: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
    arrow: <path d="M5 12h14M13 5l7 7-7 7" />,
    sparkle: (
      <>
        <path d="M12 3v3M12 18v3M21 12h-3M6 12H3M18.36 5.64l-2.12 2.12M7.76 16.24l-2.12 2.12M18.36 18.36l-2.12-2.12M7.76 7.76 5.64 5.64" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    play: <path d="M5 3l14 9-14 9z" fill="currentColor" />,
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
      <>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </>
    ),
    shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    download: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="m7 10 5 5 5-5M12 15V3" />
      </>
    ),
    bolt: <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />,
    eye: (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    lock: (
      <>
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" style={common}>
      {paths[name] ?? null}
    </svg>
  );
}

/* ─── Parallax + scroll progress + reveal hooks ─────────────────────── */

function useParallax(intensityPct = 60) {
  const [scrollY, setScrollY] = useState(0);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const intensity = intensityPct / 100;

  useEffect(() => {
    let rafId: number | null = null;
    const onScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        rafId = null;
      });
    };
    const onMouse = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      setMouse({ x, y });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("mousemove", onMouse, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  return { scrollY, mouse, intensity };
}

type ParallaxState = ReturnType<typeof useParallax>;

type RevealProps = {
  children: ReactNode;
  delay?: 0 | 1 | 2 | 3 | 4 | 5;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
};

function Reveal({ children, delay = 0, as: Tag = "div", className = "", style }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const delayClass = delay ? ` delay-${delay}` : "";
  const TagAny = Tag as ElementType;
  return (
    <TagAny
      ref={ref as Ref<HTMLElement>}
      className={`reveal${shown ? " in" : ""}${delayClass} ${className}`.trim()}
      style={style}
    >
      {children}
    </TagAny>
  );
}

function ScrollProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    let raf: number | null = null;
    const update = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      const p = total > 0 ? window.scrollY / total : 0;
      setPct(Math.max(0, Math.min(1, p)));
      raf = null;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
    };
  }, []);
  return <div className="scroll-progress" style={{ width: `${pct * 100}%` }} />;
}

function AnimatedCounter({
  to,
  duration = 1200,
  prefix = "",
  suffix = "",
}: {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [val, setVal] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            const start = performance.now();
            const tick = (now: number) => {
              const t = Math.min(1, (now - start) / duration);
              const eased = 1 - Math.pow(1 - t, 3);
              setVal(Math.round(to * eased));
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {val}
      {suffix}
    </span>
  );
}

/* ─── Mock UI primitives that power the hero / bento visuals ────────── */

function MockSidebar({ active = "painel" }: { active?: string }) {
  type NavItem = { id: string; label: string; icon: IconName; tint: string; badge?: number };
  const items: { sec: string; list: NavItem[] }[] = [
    {
      sec: "Geral",
      list: [
        { id: "painel", label: "Painel", icon: "grid", tint: "var(--tint-blue)" },
        { id: "horario", label: "Horário", icon: "calendar", tint: "var(--tint-red)" },
        { id: "mensagens", label: "Mensagens", icon: "message", tint: "var(--tint-green)", badge: 3 },
      ],
    },
    {
      sec: "Ensino",
      list: [
        { id: "sumarios", label: "Sumários", icon: "clipboard", tint: "var(--tint-indigo)" },
        { id: "assiduidade", label: "Assiduidade", icon: "check", tint: "var(--tint-green)" },
        { id: "modulos", label: "Notas", icon: "chart", tint: "var(--tint-pink)" },
      ],
    },
  ];
  return (
    <div className="mock-side">
      <div style={{ display: "flex", gap: 4, padding: "4px 6px 8px" }}>
        <div className="tl red" style={{ width: 8, height: 8 }} />
        <div className="tl yellow" style={{ width: 8, height: 8 }} />
        <div className="tl green" style={{ width: 8, height: 8 }} />
      </div>
      {items.map((s) => (
        <Fragment key={s.sec}>
          <div className="mock-side-section">{s.sec}</div>
          {s.list.map((it) => (
            <div key={it.id} className={`mock-nav-item ${active === it.id ? "active" : ""}`}>
              <span className="mock-tile" style={{ background: it.tint }}>
                <Icon name={it.icon} size={9} />
              </span>
              <span>{it.label}</span>
              {it.badge != null && <span className="mock-badge">{it.badge}</span>}
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  );
}

function MockDashboard() {
  return (
    <div className="hero-window">
      <div className="hero-window-chrome">
        <span className="tl red" />
        <span className="tl yellow" />
        <span className="tl green" />
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 11,
            color: "var(--label-tertiary)",
            fontWeight: 500,
          }}
        >
          lectiva.pt · Painel
        </div>
      </div>
      <div className="hero-window-body">
        <MockSidebar active="painel" />
        <div className="mock-main">
          <div className="mock-topbar">
            <span style={{ color: "var(--accent)" }}>PAINEL · DIRETOR DE TURMA</span>
          </div>
          <h2 className="mock-h1">Olá, Sofia</h2>
          <div className="mock-sub">terça, 18 mai · 12.º TGPSI · A</div>

          <div className="mock-stats">
            <div className="mock-stat">
              <div className="mock-stat-row">
                <span
                  className="mock-tile"
                  style={{ background: "var(--tint-blue)", width: 20, height: 20, borderRadius: 5 }}
                >
                  <Icon name="users" size={10} />
                </span>
                <span className="mock-stat-label">Alunos</span>
              </div>
              <div className="mock-stat-val">28</div>
              <div className="mock-stat-delta">2 novos esta semana</div>
            </div>
            <div className="mock-stat">
              <div className="mock-stat-row">
                <span
                  className="mock-tile"
                  style={{
                    background: "var(--tint-indigo)",
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                  }}
                >
                  <Icon name="clipboard" size={10} />
                </span>
                <span className="mock-stat-label">Sumários</span>
              </div>
              <div className="mock-stat-val">2</div>
              <div className="mock-stat-delta">por registar</div>
            </div>
            <div className="mock-stat">
              <div className="mock-stat-row">
                <span
                  className="mock-tile"
                  style={{
                    background: "var(--tint-green)",
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                  }}
                >
                  <Icon name="check" size={10} />
                </span>
                <span className="mock-stat-label">Presenças</span>
              </div>
              <div className="mock-stat-val">93%</div>
              <div className="mock-stat-delta" style={{ color: "var(--tint-green)" }}>
                ↑ 2 pts
              </div>
            </div>
            <div className="mock-stat">
              <div className="mock-stat-row">
                <span
                  className="mock-tile"
                  style={{
                    background: "var(--tint-orange)",
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                  }}
                >
                  <Icon name="bell" size={10} />
                </span>
                <span className="mock-stat-label">Pendentes</span>
              </div>
              <div className="mock-stat-val">4</div>
              <div className="mock-stat-delta">justificações</div>
            </div>
          </div>

          <div className="mock-cards-row">
            <div className="mock-card">
              <div className="mock-card-h">Hoje</div>
              <div className="mock-row">
                <span className="dot" style={{ background: "var(--tint-indigo)" }} />
                <span style={{ fontWeight: 500 }}>Programação · 12.º TGPSI A</span>
                <span className="ml-auto">08:30 · B12</span>
              </div>
              <div className="mock-row">
                <span className="dot" style={{ background: "var(--tint-pink)" }} />
                <span style={{ fontWeight: 500 }}>Matemática · 12.º TGPSI A</span>
                <span className="ml-auto">10:15 · B07</span>
              </div>
              <div className="mock-row">
                <span className="dot" style={{ background: "var(--tint-teal)" }} />
                <span style={{ fontWeight: 500 }}>Sist. Operativos · 11.º B</span>
                <span className="ml-auto">13:30 · L01</span>
              </div>
              <div className="mock-row">
                <span className="dot" style={{ background: "var(--tint-orange)" }} />
                <span style={{ fontWeight: 500 }}>Reunião · DT</span>
                <span className="ml-auto">15:30 · A07</span>
              </div>
            </div>
            <div className="mock-card">
              <div className="mock-card-h">Progresso do curso</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                {[
                  { label: "Programação", pct: 78, color: "var(--tint-indigo)" },
                  { label: "Matemática", pct: 65, color: "var(--tint-pink)" },
                  { label: "Redes", pct: 92, color: "var(--tint-cyan)" },
                ].map((row) => (
                  <div key={row.label}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 10,
                        marginBottom: 3,
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{row.label}</span>
                      <span className="mono" style={{ color: "var(--label-tertiary)" }}>
                        {row.pct}%
                      </span>
                    </div>
                    <div className="mock-bar">
                      <div
                        className="mock-bar-fill"
                        style={{ width: `${row.pct}%`, background: row.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mock-quick">
            {(
              [
                { label: "Registar sumário", icon: "clipboard", tint: "var(--tint-indigo)" },
                { label: "Marcar presenças", icon: "check", tint: "var(--tint-green)" },
                { label: "Ver horário", icon: "calendar", tint: "var(--tint-red)" },
                { label: "Lançar notas", icon: "chart", tint: "var(--tint-pink)" },
              ] as { label: string; icon: IconName; tint: string }[]
            ).map((a) => (
              <div key={a.label} className="mock-quick-btn">
                <span
                  className="mock-tile"
                  style={{ background: a.tint, width: 18, height: 18, borderRadius: 5 }}
                >
                  <Icon name={a.icon} size={9} />
                </span>
                <span>{a.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MockSchedule() {
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex"];
  const hours = ["08:30", "09:30", "10:30", "11:30", "12:30", "14:30"];
  type Slot = [number, number, number, string, string, string];
  const slots: Slot[] = [
    [0, 0, 2, "Programação", "B12", "var(--tint-indigo)"],
    [0, 3, 2, "Inglês", "A04", "var(--tint-orange)"],
    [1, 0, 2, "Matemática", "B07", "var(--tint-pink)"],
    [1, 2, 2, "S. Operativos", "L01", "var(--tint-teal)"],
    [2, 0, 1, "Português", "A02", "var(--tint-red)"],
    [2, 1, 2, "Redes", "L02", "var(--tint-cyan)"],
    [2, 4, 2, "Ed. Física", "Pav", "var(--tint-green)"],
    [3, 0, 3, "Programação", "B12", "var(--tint-indigo)"],
    [3, 4, 2, "Área Integ.", "A07", "var(--tint-purple)"],
    [4, 0, 2, "Matemática", "B07", "var(--tint-pink)"],
    [4, 2, 2, "Inglês", "A04", "var(--tint-orange)"],
  ];

  return (
    <div className="hero-window">
      <div className="hero-window-chrome">
        <span className="tl red" />
        <span className="tl yellow" />
        <span className="tl green" />
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 11,
            color: "var(--label-tertiary)",
            fontWeight: 500,
          }}
        >
          lectiva.pt · Horário
        </div>
      </div>
      <div style={{ padding: "20px 24px 24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--tint-red)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Horário · Semana 20
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 4 }}>
              13 – 17 maio
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <div className="chip">‹</div>
            <div
              className="chip"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              Esta semana
            </div>
            <div className="chip">›</div>
          </div>
        </div>
        <div className="mock-sched">
          <div />
          {days.map((d, i) => (
            <div
              key={d}
              className="head"
              style={{ color: i === 1 ? "var(--accent)" : undefined }}
            >
              {d}
              <br />
              <span style={{ fontSize: 8, fontWeight: 500, color: "var(--label-tertiary)" }}>
                {13 + i}
              </span>
            </div>
          ))}

          {hours.map((h, hi) => (
            <Fragment key={h}>
              <div className="hh">{h}</div>
              {days.map((_, di) => {
                const slot = slots.find((s) => s[0] === di && s[1] === hi);
                const occupied = slots.some(
                  (s) => s[0] === di && hi > s[1] && hi < s[1] + s[2],
                );
                if (occupied) return <div key={di} style={{ display: "none" }} />;
                if (slot) {
                  return (
                    <div
                      key={di}
                      className="slot"
                      style={{ background: slot[5], gridRow: `span ${slot[2]}` }}
                    >
                      <div className="sub">{slot[3]}</div>
                      <div className="room">{slot[4]}</div>
                    </div>
                  );
                }
                return <div key={di} className="cell" />;
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockAttendance() {
  const students = [
    { num: 1, name: "Ana Beatriz Soares", color: "var(--tint-pink)", initials: "AB", state: "p" },
    { num: 2, name: "Bruno Carvalho", color: "var(--tint-blue)", initials: "BC", state: "p" },
    { num: 3, name: "Catarina Dias", color: "var(--tint-purple)", initials: "CD", state: "a" },
    { num: 4, name: "Diogo Esteves", color: "var(--tint-orange)", initials: "DE", state: "l" },
    { num: 5, name: "Eduarda Fernandes", color: "var(--tint-green)", initials: "EF", state: "p" },
    { num: 6, name: "Filipe Gomes", color: "var(--tint-teal)", initials: "FG", state: "j" },
    { num: 7, name: "Gabriela Henriques", color: "var(--tint-red)", initials: "GH", state: "p" },
    { num: 8, name: "Hugo Inácio", color: "var(--tint-indigo)", initials: "HI", state: "p" },
  ];
  return (
    <div className="hero-window">
      <div className="hero-window-chrome">
        <span className="tl red" />
        <span className="tl yellow" />
        <span className="tl green" />
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 11,
            color: "var(--label-tertiary)",
            fontWeight: 500,
          }}
        >
          lectiva.pt · Assiduidade
        </div>
      </div>
      <div style={{ padding: "20px 24px 24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 14,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--tint-green)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Marcar presenças
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 2 }}>
              Programação · 08:30 – 10:00 · B12
            </div>
          </div>
          <div
            className="chip"
            style={{ background: "var(--accent)", color: "white", fontWeight: 600 }}
          >
            Concluir
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
            marginBottom: 14,
          }}
        >
          {[
            { label: "Presentes", val: 5, color: "var(--tint-green)" },
            { label: "Faltas", val: 1, color: "var(--tint-red)" },
            { label: "Atrasos", val: 1, color: "var(--tint-orange)" },
            { label: "Justif.", val: 1, color: "var(--tint-blue)" },
          ].map((b) => (
            <div key={b.label} className="mock-stat" style={{ padding: 8 }}>
              <div className="mock-stat-label">{b.label}</div>
              <div className="mock-stat-val" style={{ color: b.color }}>
                {b.val}
              </div>
            </div>
          ))}
        </div>

        <div className="mock-att">
          {students.map((s) => (
            <div key={s.num} className="row">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  className="mono"
                  style={{ fontSize: 9, color: "var(--label-tertiary)", width: 14 }}
                >
                  {String(s.num).padStart(2, "0")}
                </span>
                <div className="avatar" style={{ background: s.color }}>
                  {s.initials}
                </div>
              </div>
              <div className="name">{s.name}</div>
              <div className="toggles">
                <button type="button" className={s.state === "p" ? "active p" : ""}>P</button>
                <button type="button" className={s.state === "a" ? "active a" : ""}>F</button>
                <button type="button" className={s.state === "l" ? "active l" : ""}>A</button>
                <button type="button" className={s.state === "j" ? "active j" : ""}>J</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockGrades() {
  const grades = [
    { sub: "Programação", mod: "M6 · POO Avançada", val: 17, badge: "Aprovado", color: "green", bar: "var(--tint-indigo)" },
    { sub: "Matemática", mod: "M5 · Cálculo Dif.", val: 14, badge: "Aprovado", color: "green", bar: "var(--tint-pink)" },
    { sub: "S. Operativos", mod: "M3 · Linux Av.", val: 11, badge: "Recurso", color: "yellow", bar: "var(--tint-teal)" },
    { sub: "Redes Comun.", mod: "M4 · Routing", val: 16, badge: "Aprovado", color: "green", bar: "var(--tint-cyan)" },
    { sub: "Inglês", mod: "M5 · Business", val: 13, badge: "Aprovado", color: "green", bar: "var(--tint-orange)" },
  ];
  const badgeColors: Record<string, { bg: string; fg: string }> = {
    green: { bg: "rgba(52, 199, 89, 0.16)", fg: "#1d8a3a" },
    yellow: { bg: "rgba(255, 204, 0, 0.22)", fg: "#8a6500" },
    red: { bg: "rgba(255, 59, 48, 0.16)", fg: "#c41a13" },
  };
  return (
    <div className="mock-grades">
      {grades.map((g) => {
        const cls = g.val >= 14 ? "high" : g.val >= 12 ? "mid" : "low";
        const bc = badgeColors[g.color];
        return (
          <div key={g.mod} className="mock-grade-row">
            <div className="mock-grade-bar" style={{ background: g.bar }} />
            <div className="mock-grade-sub">
              {g.sub}
              <small>{g.mod}</small>
            </div>
            <div className="mock-grade-badge" style={{ background: bc.bg, color: bc.fg }}>
              {g.badge}
            </div>
            <div className={`mock-grade-val ${cls}`}>{g.val}</div>
          </div>
        );
      })}
    </div>
  );
}

function MockLessons() {
  const lessons = [
    { sub: "Programação", date: "13 mai", hours: "08:30–10:00", state: "registado", color: "var(--tint-indigo)" },
    { sub: "Matemática", date: "13 mai", hours: "10:15–11:45", state: "registado", color: "var(--tint-pink)" },
    { sub: "Programação", date: "12 mai", hours: "15:15–16:45", state: "pendente", color: "var(--tint-indigo)" },
    { sub: "Redes Comun.", date: "10 mai", hours: "08:30–10:00", state: "registado", color: "var(--tint-cyan)" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {lessons.map((l, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "4px 1fr auto",
            gap: 10,
            alignItems: "center",
            padding: "10px 0",
            borderBottom: i < lessons.length - 1 ? "0.5px solid var(--separator)" : "none",
          }}
        >
          <div style={{ width: 4, height: 28, borderRadius: 2, background: l.color }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "-0.005em" }}>{l.sub}</div>
            <div
              style={{
                fontSize: 10,
                color: "var(--label-tertiary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {l.date} · {l.hours}
            </div>
          </div>
          {l.state === "registado" ? (
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "rgba(52,199,89,0.18)",
                color: "var(--tint-green)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="check" size={10} />
            </span>
          ) : (
            <span
              className="mock-grade-badge"
              style={{ background: "rgba(255,149,0,0.18)", color: "#b86b00" }}
            >
              Pendente
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function MockComms() {
  const items: { title: string; body: string; time: string; tint: string; icon: IconName }[] = [
    { title: "Falta justificada", body: "Aprovada pela DT", time: "há 2h", tint: "var(--tint-green)", icon: "check" },
    { title: "Reunião de turma", body: "Sala A07 · 14:30", time: "ontem", tint: "var(--tint-orange)", icon: "calendar" },
    { title: "Termo FCT em falta", body: "Entregar até 20 mai", time: "há 3d", tint: "var(--tint-red)", icon: "folder" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((i, idx) => (
        <div
          key={idx}
          style={{
            display: "grid",
            gridTemplateColumns: "28px 1fr auto",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <span
            className="mock-tile"
            style={{ background: i.tint, width: 24, height: 24, borderRadius: 6 }}
          >
            <Icon name={i.icon} size={11} />
          </span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{i.title}</div>
            <div style={{ fontSize: 11, color: "var(--label-secondary)", marginTop: 1 }}>
              {i.body}
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              color: "var(--label-tertiary)",
              fontFamily: "var(--font-mono)",
              marginTop: 3,
            }}
          >
            {i.time}
          </span>
        </div>
      ))}
    </div>
  );
}

function FloatStatCard() {
  return (
    <div>
      <div className="float-stat-row">
        <span className="float-stat-tile" style={{ background: "var(--tint-green)" }}>
          <Icon name="check" size={11} />
        </span>
        <span className="float-stat-label">Presenças</span>
      </div>
      <div className="float-stat-val" style={{ marginTop: 10 }}>
        93%
      </div>
      <div className="float-stat-meta up">↑ 2 pts esta semana</div>
    </div>
  );
}

function FloatLessonCard() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span className="float-stat-tile" style={{ background: "var(--tint-indigo)" }}>
          <Icon name="clipboard" size={11} />
        </span>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700 }}>Sumário registado</div>
          <div style={{ fontSize: 10, color: "var(--label-tertiary)" }}>Programação · M8</div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: "var(--label-secondary)", lineHeight: 1.4 }}>
        “Estruturas de controlo: ciclos for, while…”
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
        <span className="chip" style={{ padding: "2px 8px", fontSize: 10 }}>
          28 alunos
        </span>
        <span
          className="chip"
          style={{
            padding: "2px 8px",
            fontSize: 10,
            background: "rgba(52,199,89,0.16)",
            color: "#1d8a3a",
          }}
        >
          ✓ Registado
        </span>
      </div>
    </div>
  );
}

function FloatNoteCard() {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "var(--label-tertiary)",
        }}
      >
        Nota lançada
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
        <span className="float-stat-val" style={{ color: "var(--tint-green)", fontSize: 32 }}>
          17
        </span>
        <span style={{ fontSize: 13, color: "var(--label-tertiary)" }}>/20</span>
      </div>
      <div style={{ fontSize: 11, color: "var(--label-secondary)", marginTop: 2 }}>
        M6 · POO Avançada
      </div>
    </div>
  );
}

/* ─── Page sections ─────────────────────────────────────────────────── */

function Nav() {
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <a href="#top" className="nav-brand">
          <span className="nav-mark">L</span>
          <span>Lectiva</span>
        </a>
        <div className="nav-links">
          <a className="nav-link" href="#funcionalidades">Funcionalidades</a>
          <a className="nav-link" href="#perfis">Perfis</a>
          <a className="nav-link" href="#fct-pap">FCT &amp; PAP</a>
          <a className="nav-link" href="#escolas">Para escolas</a>
        </div>
        <div className="nav-cta">
          <a className="btn ghost sm" href="/login">Entrar</a>
          <a className="btn primary sm" href="#demo">
            Pedir demo
            <span className="btn-arrow">→</span>
          </a>
        </div>
      </div>
    </nav>
  );
}

function Hero({ parallax }: { parallax: ParallaxState }) {
  const { scrollY, mouse, intensity } = parallax;
  const px = mouse.x * intensity;
  const py = mouse.y * intensity;
  const sy = Math.min(scrollY, 800);

  const windowTransform: CSSProperties = {
    transform: `perspective(1400px) rotateX(${py * 4}deg) rotateY(${px * -6}deg) translateY(${sy * -0.08}px)`,
  };
  const float1: CSSProperties = {
    transform: `translate3d(${px * -36}px, ${sy * -0.32 + py * -18}px, 0)`,
  };
  const float2: CSSProperties = {
    transform: `translate3d(${px * 42}px, ${sy * -0.18 + py * 22}px, 0)`,
  };
  const float3: CSSProperties = {
    transform: `translate3d(${px * 50}px, ${sy * -0.4 + py * -10}px, 0)`,
  };

  return (
    <section className="hero" id="top">
      <div className="hero-bg">
        <div className="blob b1" style={{ transform: `translate3d(${px * 30}px, ${sy * -0.15}px, 0)` }} />
        <div className="blob b2" style={{ transform: `translate3d(${px * -20}px, ${sy * -0.25}px, 0)` }} />
        <div className="blob b3" style={{ transform: `translate3d(${px * 15}px, ${sy * -0.05}px, 0)` }} />
      </div>
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">Para escolas profissionais portuguesas</div>
          <h1 className="display">
            A plataforma escolar que <span className="accent">funciona</span> à primeira.
          </h1>
          <p className="lead">
            Horário, sumários, presenças, notas, FCT e PAP — tudo num só sítio, com a clareza de
            uma app moderna. Sem manuais. Sem ecrãs do PowerPoint 2007.
          </p>
          <div className="hero-actions">
            <a className="btn primary lg" href="#demo">
              Pedir demo gratuita
              <span className="btn-arrow">→</span>
            </a>
            <a className="btn lg" href="#tour">
              <Icon name="play" size={14} /> Ver tour de 90s
            </a>
          </div>
          <div className="hero-meta">
            <span className="hero-meta-dot" />
            <span>Conformidade RGPD · Dados em Portugal · Migração assistida</span>
          </div>
        </div>
        <div className="hero-stage">
          <div style={windowTransform}>
            <MockDashboard />
          </div>
          <div className="hero-float f1" style={float1}>
            <FloatNoteCard />
          </div>
          <div className="hero-float f2" style={float2}>
            <FloatLessonCard />
          </div>
          <div className="hero-float f3" style={float3}>
            <FloatStatCard />
          </div>
        </div>
      </div>
    </section>
  );
}

function LogoMarquee() {
  const logos = [
    "Esc. Prof. Lisboa", "EPRALIMA", "CIOR", "Forave", "EPB Setúbal",
    "Esc. Profissional do Alto Lima", "EPTOLIVA", "ETPR", "CENATEX", "Esc. Prof. Bento de Jesus Caraça",
  ];
  const items = [...logos, ...logos];
  return (
    <div className="marquee">
      <div className="marquee-track">
        {items.map((l, i) => (
          <span key={i} className="logo-ph">{l}</span>
        ))}
      </div>
    </div>
  );
}

function TrustMarquee() {
  return (
    <section className="trust" style={{ padding: "32px 0" }}>
      <div className="container" style={{ marginBottom: 18 }}>
        <div className="trust-label" style={{ textAlign: "center" }}>
          Em uso em escolas profissionais por todo o país
        </div>
      </div>
      <LogoMarquee />
    </section>
  );
}

function BentoFeatures() {
  return (
    <section className="section" id="funcionalidades">
      <div className="container">
        <Reveal className="section-head">
          <div className="eyebrow">Tudo num só lugar</div>
          <h2 className="h1">Pensado para o dia-a-dia da escola.</h2>
          <p className="lead">
            Cada ecrã foi desenhado a partir do que professores, diretores de turma e alunos
            realmente fazem todos os dias.
          </p>
        </Reveal>

        <div className="bento">
          <Reveal className="bento-card span-4 row-2" delay={1}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div className="bento-tile" style={{ background: "var(--tint-red)" }}>
                <Icon name="calendar" size={18} />
              </div>
              <div>
                <h3 className="bento-title">Horário visual</h3>
                <p className="bento-desc">
                  Grelha semanal de cinco dias com cores por disciplina, salas e professores. Toda
                  a turma, num olhar.
                </p>
              </div>
            </div>
            <div
              className="bento-viz"
              style={{
                margin: "8px -12px -16px",
                transform: "scale(0.92)",
                transformOrigin: "center bottom",
              }}
            >
              <div
                style={{
                  boxShadow: "var(--card-shadow-strong)",
                  borderRadius: 14,
                  overflow: "hidden",
                  background: "var(--card-bg)",
                }}
              >
                <MockSchedule />
              </div>
            </div>
          </Reveal>

          <Reveal className="bento-card span-2" delay={2}>
            <div className="bento-tile" style={{ background: "var(--tint-indigo)" }}>
              <Icon name="clipboard" size={18} />
            </div>
            <h3 className="bento-title">Sumários</h3>
            <p className="bento-desc">
              Registar a aula em 30 segundos. Lições, módulo e anexos automaticamente associados.
            </p>
            <div className="bento-viz">
              <MockLessons />
            </div>
          </Reveal>

          <Reveal className="bento-card span-2" delay={3}>
            <div
              className="bento-tile"
              style={{ background: "var(--tint-yellow)", color: "#7a5500" }}
            >
              <Icon name="bell" size={18} />
            </div>
            <h3 className="bento-title">Comunicações</h3>
            <p className="bento-desc">
              Avisos da escola, justificações e mensagens da turma — tudo num feed organizado.
            </p>
            <div className="bento-viz">
              <MockComms />
            </div>
          </Reveal>

          <Reveal className="bento-card span-3" delay={1}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div className="bento-tile" style={{ background: "var(--tint-green)" }}>
                <Icon name="check" size={18} />
              </div>
              <div>
                <h3 className="bento-title">Assiduidade</h3>
                <p className="bento-desc">
                  Quatro estados, um clique cada. Justificações tratadas pela aplicação.
                </p>
              </div>
            </div>
            <div className="bento-viz" style={{ marginTop: 16 }}>
              <div
                className="mock-att"
                style={{
                  background: "var(--card-bg)",
                  border: "0.5px solid var(--separator)",
                  borderRadius: 10,
                  padding: "4px 8px",
                }}
              >
                {[
                  { n: 1, name: "Ana B. Soares", c: "var(--tint-pink)", i: "AB", s: "p" },
                  { n: 2, name: "Bruno Carvalho", c: "var(--tint-blue)", i: "BC", s: "p" },
                  { n: 3, name: "Catarina Dias", c: "var(--tint-purple)", i: "CD", s: "a" },
                  { n: 4, name: "Diogo Esteves", c: "var(--tint-orange)", i: "DE", s: "l" },
                ].map((st) => (
                  <div key={st.n} className="row" style={{ padding: "5px 4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span
                        className="mono"
                        style={{ fontSize: 9, color: "var(--label-tertiary)", width: 14 }}
                      >
                        {String(st.n).padStart(2, "0")}
                      </span>
                      <div
                        className="avatar"
                        style={{ background: st.c, width: 20, height: 20, fontSize: 8 }}
                      >
                        {st.i}
                      </div>
                    </div>
                    <div className="name" style={{ fontSize: 11 }}>{st.name}</div>
                    <div className="toggles">
                      <button type="button" className={st.s === "p" ? "active p" : ""}>P</button>
                      <button type="button" className={st.s === "a" ? "active a" : ""}>F</button>
                      <button type="button" className={st.s === "l" ? "active l" : ""}>A</button>
                      <button type="button" className={st.s === "j" ? "active j" : ""}>J</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal className="bento-card span-3" delay={2}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div className="bento-tile" style={{ background: "var(--tint-pink)" }}>
                <Icon name="chart" size={18} />
              </div>
              <div>
                <h3 className="bento-title">Notas &amp; Módulos</h3>
                <p className="bento-desc">
                  Acompanhamento modular, recursos e épocas especiais — alinhado ao currículo
                  profissional.
                </p>
              </div>
            </div>
            <div className="bento-viz" style={{ marginTop: 8 }}>
              <MockGrades />
            </div>
          </Reveal>

          <Reveal className="bento-card span-2" delay={3}>
            <div className="bento-tile" style={{ background: "var(--tint-teal)" }}>
              <Icon name="briefcase" size={18} />
            </div>
            <h3 className="bento-title">FCT</h3>
            <p className="bento-desc">
              Formação em Contexto de Trabalho — horas, entidades, tutores e relatórios assinados
              digitalmente.
            </p>
            <div className="bento-viz">
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 6 }}>
                <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
                  <svg width="64" height="64" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="32" cy="32" r="27" fill="none" stroke="var(--bg-fill)" strokeWidth="6" />
                    <circle
                      cx="32"
                      cy="32"
                      r="27"
                      fill="none"
                      stroke="var(--tint-teal)"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray="169.65"
                      strokeDashoffset="64.5"
                    />
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 14,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    62%
                  </div>
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 600 }}>372 / 600 horas</div>
                  <div style={{ color: "var(--label-tertiary)", fontSize: 11, marginTop: 2 }}>
                    Sintex Lda · até 14 jun
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal className="bento-card span-2" delay={4}>
            <div className="bento-tile" style={{ background: "var(--tint-brown)" }}>
              <Icon name="award" size={18} />
            </div>
            <h3 className="bento-title">PAP</h3>
            <p className="bento-desc">
              Prova de Aptidão Profissional, do anteprojeto à defesa, sem perder um único marco.
            </p>
            <div className="bento-viz">
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                {[
                  { label: "Anteprojeto", done: true, date: "15 out" },
                  { label: "Projeto", done: true, date: "12 fev" },
                  { label: "Implementação", done: true, date: "02 mai" },
                  { label: "Defesa", done: false, date: "21 jun" },
                ].map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: p.done ? "var(--tint-green)" : "var(--bg-fill-secondary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                      }}
                    >
                      {p.done && <Icon name="check" size={9} />}
                    </span>
                    <span
                      style={{
                        fontWeight: 500,
                        color: p.done ? "var(--label)" : "var(--label-secondary)",
                      }}
                    >
                      {p.label}
                    </span>
                    <span
                      className="mono"
                      style={{
                        marginLeft: "auto",
                        fontSize: 10,
                        color: "var(--label-tertiary)",
                      }}
                    >
                      {p.date}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal className="bento-card span-2" delay={5}>
            <div className="bento-tile" style={{ background: "var(--tint-green)" }}>
              <Icon name="message" size={18} />
            </div>
            <h3 className="bento-title">Mensagens</h3>
            <p className="bento-desc">
              Chat moderado entre alunos, professores e encarregados — sem WhatsApps perdidos.
            </p>
            <div className="bento-viz">
              <div
                style={{ background: "var(--bg-fill)", borderRadius: 10, padding: 10, marginTop: 4 }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                  Prof.ª Sofia Reis
                </div>
                <div
                  style={{ fontSize: 11, color: "var(--label-secondary)", lineHeight: 1.4 }}
                >
                  “A reunião de turma fica marcada para sexta às 14:30. Confirmem presença.”
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: "var(--label-tertiary)",
                    marginTop: 6,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  há 12 min · 27 lidos
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function StoryScroller({ parallax }: { parallax: ParallaxState }) {
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  const steps = [
    {
      eyebrow: "01 · Manhã",
      title: "Abre, vê a aula. Marca presenças.",
      desc: "Painel mostra a próxima aula com sala, módulo e turma. Um clique abre a marcação.",
    },
    {
      eyebrow: "02 · Em aula",
      title: "Regista o sumário sem sair da turma.",
      desc: "Sumário e presenças no mesmo ecrã. Lições, módulo e anexos prendem-se sozinhos.",
    },
    {
      eyebrow: "03 · Pelo dia",
      title: "Toda a semana, num só olhar.",
      desc: "Cinco dias, cores por disciplina, salas e professores. Mude de turma, mude de semana — sempre o mesmo ecrã limpo.",
    },
  ];

  useEffect(() => {
    const onScroll = () => {
      const idx = stepRefs.current.findIndex((el) => {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.top < window.innerHeight * 0.5 && r.bottom > window.innerHeight * 0.5;
      });
      if (idx !== -1 && idx !== activeIdx) setActiveIdx(idx);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [activeIdx]);

  const { mouse, intensity } = parallax;
  const tilt: CSSProperties = {
    transform: `perspective(1400px) rotateX(${mouse.y * intensity * 3}deg) rotateY(${mouse.x * intensity * -4}deg)`,
  };

  return (
    <section className="story-section">
      <div className="story-wrap">
        <div className="story-steps">
          <Reveal style={{ paddingBottom: 0, marginBottom: -40 }}>
            <div className="eyebrow">Um dia com Lectiva</div>
            <h2 className="h1" style={{ maxWidth: 480 }}>
              Do toque da manhã ao final do período.
            </h2>
          </Reveal>
          {steps.map((s, i) => (
            <div
              key={i}
              ref={(el) => {
                stepRefs.current[i] = el;
              }}
              className="story-step"
            >
              <div
                className="eyebrow"
                style={{ opacity: activeIdx === i ? 1 : 0.4, transition: "opacity 300ms ease" }}
              >
                {s.eyebrow}
              </div>
              <h3
                className="h2"
                style={{ opacity: activeIdx === i ? 1 : 0.35, transition: "opacity 300ms ease" }}
              >
                {s.title}
              </h3>
              <p
                className="lead"
                style={{ opacity: activeIdx === i ? 1 : 0.35, transition: "opacity 300ms ease" }}
              >
                {s.desc}
              </p>
            </div>
          ))}
        </div>
        <div className="story-pinned">
          <div className="story-stage" style={tilt}>
            <div
              className={`story-screen ${activeIdx === 0 ? "active" : activeIdx > 0 ? "prev" : ""}`}
            >
              <MockDashboard />
            </div>
            <div
              className={`story-screen ${activeIdx === 1 ? "active" : activeIdx > 1 ? "prev" : ""}`}
            >
              <MockAttendance />
            </div>
            <div className={`story-screen ${activeIdx === 2 ? "active" : ""}`}>
              <MockSchedule />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DeepHorario({ parallax }: { parallax: ParallaxState }) {
  const { scrollY, intensity } = parallax;
  const ref = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const center = window.innerHeight / 2;
    const distance = r.top + r.height / 2 - center;
    setOffset(distance * -0.05 * intensity);
  }, [scrollY, intensity]);

  return (
    <section className="section alt" id="horario">
      <div className="container deep" ref={ref}>
        <Reveal className="deep-copy">
          <div className="eyebrow" style={{ color: "var(--tint-red)" }}>Horário</div>
          <h2 className="h1">A semana inteira, num só ecrã.</h2>
          <p className="lead">
            Cinco dias, cores por disciplina, salas e professores. Os alunos vêem o que têm a
            seguir; os professores vêem onde têm de estar.
          </p>
          <ul className="deep-bullets">
            <li className="deep-bullet">
              <span className="bullet-check"><Icon name="check" size={12} /></span>
              <div className="bullet-text">
                <b>Adapta-se a tempos letivos variáveis</b>
                <small>50, 60 ou 90 minutos — conforme o curso e o ciclo.</small>
              </div>
            </li>
            <li className="deep-bullet">
              <span className="bullet-check"><Icon name="check" size={12} /></span>
              <div className="bullet-text">
                <b>Substituições e permutas com um clique</b>
                <small>Notifica imediatamente alunos, DT e administração.</small>
              </div>
            </li>
            <li className="deep-bullet">
              <span className="bullet-check"><Icon name="check" size={12} /></span>
              <div className="bullet-text">
                <b>Exporta para iCal, Google e Outlook</b>
                <small>O horário entra direto no calendário pessoal.</small>
              </div>
            </li>
          </ul>
        </Reveal>
        <div className="deep-visual">
          <div className="visual-window" style={{ transform: `translateY(${offset}px)` }}>
            <MockSchedule />
          </div>
        </div>
      </div>
    </section>
  );
}

function DeepAssiduidade({ parallax }: { parallax: ParallaxState }) {
  const { scrollY, intensity } = parallax;
  const ref = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const center = window.innerHeight / 2;
    const distance = r.top + r.height / 2 - center;
    setOffset(distance * -0.06 * intensity);
  }, [scrollY, intensity]);

  return (
    <section className="section">
      <div className="container deep reverse" ref={ref}>
        <Reveal className="deep-copy">
          <div className="eyebrow" style={{ color: "var(--tint-green)" }}>Assiduidade</div>
          <h2 className="h1">Marcar presenças deixou de doer.</h2>
          <p className="lead">
            Quatro estados — Presente, Falta, Atraso, Justificada. Um toggle por aluno, com
            avatares, números e contagem em tempo real.
          </p>
          <ul className="deep-bullets">
            <li className="deep-bullet">
              <span className="bullet-check"><Icon name="check" size={12} /></span>
              <div className="bullet-text">
                <b>“Marcar todos presentes” começa o trabalho a 90%</b>
                <small>Depois é só corrigir as exceções. Demora menos de um minuto.</small>
              </div>
            </li>
            <li className="deep-bullet">
              <span className="bullet-check"><Icon name="check" size={12} /></span>
              <div className="bullet-text">
                <b>Justificações tratadas dentro da app</b>
                <small>O aluno submete; o DT aprova. Sem papel, sem emails.</small>
              </div>
            </li>
            <li className="deep-bullet">
              <span className="bullet-check"><Icon name="check" size={12} /></span>
              <div className="bullet-text">
                <b>Alertas automáticos ao limite de faltas</b>
                <small>Cumpre a Portaria 235‑A/2018 sem ter de fazer contas.</small>
              </div>
            </li>
          </ul>
        </Reveal>
        <div className="deep-visual">
          <div className="visual-window" style={{ transform: `translateY(${offset}px)` }}>
            <MockAttendance />
          </div>
        </div>
      </div>
    </section>
  );
}

function Roles() {
  const roles: { name: string; tint: string; icon: IconName; desc: string; items: string[] }[] = [
    {
      name: "Aluno",
      tint: "var(--tint-pink)",
      icon: "graduation",
      desc: "Vê o que tem hoje, as notas dos módulos, a sua FCT e a evolução do curso.",
      items: ["Horário e calendário", "Notas dos módulos", "Justificar faltas", "Comunicações da turma"],
    },
    {
      name: "Professor",
      tint: "var(--tint-indigo)",
      icon: "clipboard",
      desc: "Regista sumários, marca presenças, lança notas e comunica com a turma.",
      items: ["Sumários e lições", "Marcação de presenças", "Lançamento modular", "Recursos pedagógicos"],
    },
    {
      name: "Diretor de Turma",
      tint: "var(--tint-orange)",
      icon: "users",
      desc: "Vê a saúde da turma num painel só — justificações, notas em risco, faltas.",
      items: ["Painel da turma", "Justificações pendentes", "Atas e reuniões", "Contacto com EE"],
    },
    {
      name: "Administrador",
      tint: "var(--tint-teal)",
      icon: "settings",
      desc: "Gere cursos, turmas, professores, substituições e relatórios da escola.",
      items: ["Cursos e turmas", "Utilizadores e permissões", "Substituições", "Relatórios DGEstE"],
    },
  ];
  return (
    <section className="section alt" id="perfis">
      <div className="container">
        <Reveal className="section-head">
          <div className="eyebrow">Quatro perfis, um sistema</div>
          <h2 className="h1">Cada papel vê exatamente o que precisa.</h2>
          <p className="lead">
            Aluno, Professor, Diretor de Turma e Administrador — interfaces dedicadas, sem ecrãs
            partilhados nem “se não és tu, ignora”.
          </p>
        </Reveal>
        <div className="roles">
          {roles.map((r, i) => (
            <Reveal
              key={r.name}
              className="role-card"
              delay={((i + 1) as 1 | 2 | 3 | 4)}
            >
              <div className="role-tile" style={{ background: r.tint }}>
                <Icon name={r.icon} size={20} />
              </div>
              <h3 className="h3">{r.name}</h3>
              <p className="muted small">{r.desc}</p>
              <ul>
                {r.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Comparar() {
  const rows = [
    { dim: "Interface", legacy: "Desenhada nos anos 2000. Java applets, popups, frames.", lectiva: "App moderna. Rápida em qualquer browser, fluida no telemóvel." },
    { dim: "Mobile", legacy: "Aplicação à parte que ninguém instala — ou simplesmente não existe.", lectiva: "Web responsivo. Instala como app no telemóvel sem passar pela loja." },
    { dim: "Sumários", legacy: "Múltiplos cliques, navegação em árvore, campos repetidos a cada aula.", lectiva: "Um ecrã, um clique. Lições, módulo e anexos pegam-se automaticamente." },
    { dim: "Assiduidade", legacy: "Tabela cheia, sem feedback. “Salvar” no fim e cruzar os dedos.", lectiva: "Quatro estados claros, contagem em direto, justificações na própria app." },
    { dim: "FCT e PAP", legacy: "Formulários genéricos. Tutores e marcos noutro lado qualquer.", lectiva: "Desenhado à medida do ensino profissional, do anteprojeto à defesa." },
    { dim: "Comunicação", legacy: "Emails, WhatsApps paralelos, recados em papel.", lectiva: "Mensagens dentro do sistema. Histórico, sem grupos perdidos." },
    { dim: "Atualizações", legacy: "Pagas à parte. Migrações forçadas com perda de dados.", lectiva: "Contínuas e incluídas. Tudo o que lançamos chega sem custo extra." },
    { dim: "Suporte", legacy: "Tickets que esperam dias. Manual de 200 páginas.", lectiva: "Chat com pessoas reais, em Portugal. Resposta no próprio dia." },
    { dim: "Migração", legacy: "Trate você. Ou contrate alguém para tratar.", lectiva: "Importamos de Inovar, GIAE ou Excel em menos de uma semana." },
    { dim: "RGPD", legacy: "Servidores antigos. Encarregado difícil de encontrar.", lectiva: "Dados encriptados na União Europeia. DPO contactável em 24h." },
  ];
  return (
    <section className="section alt" id="comparar">
      <div className="container">
        <Reveal className="section-head">
          <div className="eyebrow" style={{ color: "var(--tint-orange)" }}>Comparar</div>
          <h2 className="h1">Lectiva vs. Inovar, GIAE e outros legados.</h2>
          <p className="lead">
            Conhecemos bem os sistemas que ainda dominam o ensino profissional português. Foi por
            causa deles que construímos o Lectiva.
          </p>
        </Reveal>

        <Reveal className="compare-table">
          <div className="compare-head">
            <div className="compare-head-cell">
              <div className="compare-head-dim">Dimensão</div>
              <h3 className="compare-head-name">O que comparamos</h3>
            </div>
            <div className="compare-head-cell legacy">
              <div className="compare-head-dim">Plataforma</div>
              <h3 className="compare-head-name">
                <span className="legacy-mark">I/G</span>
                Inovar &amp; GIAE
              </h3>
            </div>
            <div className="compare-head-cell lectiva">
              <div className="compare-head-dim" style={{ color: "var(--accent)" }}>
                Plataforma
              </div>
              <h3 className="compare-head-name">
                <span className="lectiva-mark">L</span>
                Lectiva
              </h3>
            </div>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="compare-row">
              <div className="compare-cell dim">{r.dim}</div>
              <div className="compare-cell legacy">
                <span className="compare-mark x">
                  <Icon name="user-x" size={11} />
                </span>
                <span>{r.legacy}</span>
              </div>
              <div className="compare-cell lectiva">
                <span className="compare-mark v">
                  <Icon name="check" size={11} />
                </span>
                <span>{r.lectiva}</span>
              </div>
            </div>
          ))}
        </Reveal>

        <Reveal style={{ textAlign: "center", marginTop: 48 }}>
          <p className="muted small" style={{ marginBottom: 16 }}>
            Inovar e GIAE são marcas das respetivas empresas. A comparação reflete o estado típico
            observado em 2024–2026.
          </p>
          <a className="btn primary lg" href="#demo">
            Ver Lectiva em 30 minutos
            <span className="btn-arrow">→</span>
          </a>
        </Reveal>
      </div>
    </section>
  );
}

function FctPap() {
  return (
    <section className="section" id="fct-pap">
      <div className="container">
        <Reveal className="section-head">
          <div className="eyebrow">FCT &amp; PAP</div>
          <h2 className="h1">Pensado para o ensino profissional. Não adaptado.</h2>
          <p className="lead">
            A Formação em Contexto de Trabalho e a Prova de Aptidão Profissional não são extras —
            são o centro do percurso. Tratamo‑las como tal.
          </p>
        </Reveal>

        <div className="number-grid">
          <Reveal className="number-block" delay={1}>
            <div className="num">
              <AnimatedCounter to={600} suffix="h" />
            </div>
            <div className="lbl">
              Contagem automática de horas FCT, com avisos quando o aluno ultrapassa metade do
              percurso.
            </div>
          </Reveal>
          <Reveal className="number-block" delay={2}>
            <div className="num">
              <AnimatedCounter to={4} />
            </div>
            <div className="lbl">
              Marcos PAP cobertos do início ao fim — anteprojeto, projeto, implementação e defesa.
            </div>
          </Reveal>
          <Reveal className="number-block" delay={3}>
            <div className="num">
              <AnimatedCounter to={0} />
            </div>
            <div className="lbl">
              Folhas de Excel partilhadas por email. As assinaturas digitais ficam guardadas para
              sempre.
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function ParaEscolas() {
  const items: { icon: IconName; title: string; desc: string }[] = [
    { icon: "download", title: "Migração assistida", desc: "Importamos dados de Inovar, GIAE ou folhas Excel em menos de uma semana." },
    { icon: "shield", title: "RGPD em primeiro lugar", desc: "Dados em servidores na União Europeia. Encarregados de proteção contactáveis." },
    { icon: "lock", title: "Autenticação forte", desc: "MFA opcional, login com Google ou Microsoft, SSO para escolas com Active Directory." },
    { icon: "bolt", title: "Atualizações contínuas", desc: "Lançamos melhorias todas as semanas, sem custos extra ou migrações forçadas." },
  ];
  return (
    <section className="section alt" id="escolas">
      <div className="container">
        <Reveal className="section-head">
          <div className="eyebrow">Para escolas</div>
          <h2 className="h1">Trocar de sistema não tem de ser um drama.</h2>
        </Reveal>
        <div
          className="para-escolas-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 24,
            maxWidth: 1080,
            margin: "0 auto",
          }}
        >
          {items.map((it, i) => (
            <Reveal
              key={it.title}
              delay={((i + 1) as 1 | 2 | 3 | 4)}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <div
                className="role-tile"
                style={{ background: "var(--bg-fill)", color: "var(--accent)" }}
              >
                <Icon name={it.icon} size={20} />
              </div>
              <h3 className="h3" style={{ fontSize: 17 }}>{it.title}</h3>
              <p className="muted small" style={{ lineHeight: 1.55 }}>{it.desc}</p>
            </Reveal>
          ))}
        </div>
        <style>{`
          @media (max-width: 880px) { .lectiva-landing .para-escolas-grid { grid-template-columns: 1fr 1fr !important; } }
          @media (max-width: 520px) { .lectiva-landing .para-escolas-grid { grid-template-columns: 1fr !important; } }
        `}</style>
      </div>
    </section>
  );
}

function Testimonial() {
  return (
    <section className="section">
      <div className="container">
        <Reveal className="testimonial">
          <p className="testimonial-quote">
            A primeira plataforma escolar que não me obriga a abrir o manual. Os meus professores
            adotaram em três dias — e nunca mais pediram para voltar atrás.
          </p>
          <div className="testimonial-who">
            <div className="testimonial-avatar">HF</div>
            <div className="testimonial-who-text">
              <div className="testimonial-name">Dr. Henrique Faria</div>
              <div className="testimonial-role">Diretor · Escola Profissional de Lisboa</div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="cta" id="demo">
      <div className="container">
        <Reveal>
          <h2 className="h1">Pronto para deixar o Excel e o legado para trás?</h2>
          <p className="lead">
            Marque uma demonstração de 30 minutos. Mostramos o sistema, respondemos às suas
            dúvidas e desenhamos o plano de migração à medida.
          </p>
          <div className="cta-actions">
            <a className="btn primary lg" href="mailto:geral@lectiva.pt?subject=Pedido%20de%20demo%20Lectiva">
              Pedir demo gratuita
              <span className="btn-arrow">→</span>
            </a>
            <a className="btn lg" href="#pricing">Ver preços</a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <span className="nav-mark">L</span>
              Lectiva
            </div>
            <p style={{ maxWidth: 280, lineHeight: 1.5 }}>
              A plataforma de gestão para escolas profissionais portuguesas. Construída em
              Portugal, para o ensino profissional.
            </p>
          </div>
          <div className="footer-col">
            <h4>Produto</h4>
            <ul>
              <li><a href="#funcionalidades">Funcionalidades</a></li>
              <li><a href="#perfis">Perfis</a></li>
              <li><a href="#fct-pap">FCT &amp; PAP</a></li>
              <li><a href="#pricing">Preços</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Escola</h4>
            <ul>
              <li><a href="#demo">Pedir demo</a></li>
              <li><a href="#migrate">Migração</a></li>
              <li><a href="#security">Segurança &amp; RGPD</a></li>
              <li><a href="#support">Suporte</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Empresa</h4>
            <ul>
              <li><a href="#about">Sobre</a></li>
              <li><a href="#blog">Notas de versão</a></li>
              <li><a href="#legal">Termos &amp; Privacidade</a></li>
              <li><a href="#contact">Contacto</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Lectiva · Feito em Lisboa, com cuidado.</span>
          <span className="mono small">lectiva.pt</span>
        </div>
      </div>
    </footer>
  );
}

/* ─── Page entry ────────────────────────────────────────────────────── */

export default function LandingPage() {
  const parallax = useParallax(60);

  return (
    <div className="lectiva-landing">
      <ScrollProgress />
      <Nav />
      <Hero parallax={parallax} />
      <TrustMarquee />
      <BentoFeatures />
      <StoryScroller parallax={parallax} />
      <DeepHorario parallax={parallax} />
      <DeepAssiduidade parallax={parallax} />
      <Roles />
      <Comparar />
      <FctPap />
      <ParaEscolas />
      <Testimonial />
      <CTA />
      <Footer />
    </div>
  );
}
