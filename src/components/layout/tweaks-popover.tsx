"use client";

import { useEffect, useState } from "react";
import { Sliders, Check, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

const ACCENTS = [
  { key: "blue",   label: "Azul",       color: "#007aff" },
  { key: "indigo", label: "Índigo",     color: "#5856d6" },
  { key: "green",  label: "Verde",      color: "#34c759" },
  { key: "purple", label: "Roxo",       color: "#af52de" },
  { key: "pink",   label: "Rosa",       color: "#ff2d55" },
  { key: "orange", label: "Laranja",    color: "#ff9500" },
];

const CARD_STYLES = [
  { key: "flat",     label: "Plano" },
  { key: "elevated", label: "Elevado" },
  { key: "glass",    label: "Vidro" },
];

const SIDEBAR_STYLES = [
  { key: "icons",    label: "Ícones" },
  { key: "labels",   label: "Etiquetas" },
  { key: "floating", label: "Flutuante" },
];

function applyAccent(accent: string) {
  const a = ACCENTS.find((x) => x.key === accent) ?? ACCENTS[0];
  document.documentElement.style.setProperty("--primary", a.color);
  document.documentElement.style.setProperty("--ring", a.color);
  document.documentElement.style.setProperty("--sidebar-primary", a.color);
  document.documentElement.style.setProperty("--sidebar-ring", a.color);
  const r = parseInt(a.color.slice(1, 3), 16);
  const g = parseInt(a.color.slice(3, 5), 16);
  const b = parseInt(a.color.slice(5, 7), 16);
  document.documentElement.style.setProperty("--accent", `rgba(${r}, ${g}, ${b}, 0.10)`);
  document.documentElement.style.setProperty("--accent-foreground", a.color);
}

function applyDark(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
  localStorage.setItem("lectiva:theme", isDark ? "dark" : "light");
}

function applyCardStyle(style: string) {
  document.documentElement.dataset.cardStyle = style;
  // Tweak shadow tokens per style
  if (style === "flat") {
    document.documentElement.style.setProperty("--card-shadow", "0 0 0 1px var(--separator)");
  } else if (style === "elevated") {
    document.documentElement.style.setProperty(
      "--card-shadow",
      "0 0 0 0.5px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -8px rgba(0,0,0,0.1)",
    );
  } else if (style === "glass") {
    document.documentElement.style.setProperty(
      "--card-shadow",
      "0 0 0 0.5px rgba(255,255,255,0.4), 0 4px 24px -4px rgba(0,0,0,0.08)",
    );
  }
}

function applySidebarStyle(style: string) {
  document.documentElement.dataset.sidebarStyle = style;
}

export function TweaksPopover() {
  const [open, setOpen] = useState(false);
  const [accent, setAccent] = useState("blue");
  const [isDark, setIsDark] = useState(false);
  const [cardStyle, setCardStyle] = useState("elevated");
  const [sidebarStyle, setSidebarStyle] = useState("floating");

  useEffect(() => {
    const a = localStorage.getItem("lectiva:accent") ?? "blue";
    const dark = localStorage.getItem("lectiva:theme") === "dark"
      || (!localStorage.getItem("lectiva:theme") && document.documentElement.classList.contains("dark"));
    const card = localStorage.getItem("lectiva:card-style") ?? "elevated";
    const sb = localStorage.getItem("lectiva:sidebar-style") ?? "floating";
    setAccent(a);
    setIsDark(dark);
    setCardStyle(card);
    setSidebarStyle(sb);
    applyAccent(a);
    applyCardStyle(card);
    applySidebarStyle(sb);
  }, []);

  function pickAccent(key: string) {
    setAccent(key);
    localStorage.setItem("lectiva:accent", key);
    applyAccent(key);
  }
  function toggleDark(v: boolean) {
    setIsDark(v);
    applyDark(v);
  }
  function pickCard(key: string) {
    setCardStyle(key);
    localStorage.setItem("lectiva:card-style", key);
    applyCardStyle(key);
  }
  function pickSidebar(key: string) {
    setSidebarStyle(key);
    localStorage.setItem("lectiva:sidebar-style", key);
    applySidebarStyle(key);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label="Personalizar aspeto"
        className="h-9 w-9 rounded-[6px] flex items-center justify-center hover:bg-[var(--muted)] transition-colors"
      >
        <Sliders className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[280px] gap-0 p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--separator)]">
          <h3 className="text-[14px] font-semibold tracking-[-0.012em]">Tweaks</h3>
          <button
            onClick={() => setOpen(false)}
            aria-label="Fechar"
            className="h-6 w-6 rounded-full flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* APARÊNCIA */}
        <div className="px-4 py-3 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--muted-foreground)]">
            Aparência
          </p>

          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium">Modo escuro</span>
            <Switch checked={isDark} onCheckedChange={toggleDark} />
          </div>

          <div className="space-y-1.5">
            <p className="text-[12px] text-[var(--muted-foreground)]">Cor de destaque</p>
            <div className="flex gap-1.5">
              {ACCENTS.map((a) => {
                const active = accent === a.key;
                return (
                  <button
                    key={a.key}
                    onClick={() => pickAccent(a.key)}
                    aria-label={a.label}
                    title={a.label}
                    className={
                      "h-9 w-9 rounded-[10px] flex items-center justify-center transition-transform hover:scale-105 " +
                      (active ? "ring-2 ring-offset-2 ring-[var(--ring)] ring-offset-[var(--popover)]" : "")
                    }
                    style={{ background: a.color }}
                  >
                    {active && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* LAYOUT */}
        <div className="px-4 py-3 border-t border-[var(--separator)] space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--muted-foreground)]">
            Layout
          </p>

          <div className="space-y-1.5">
            <p className="text-[12px] text-[var(--muted-foreground)]">Cartões</p>
            <Segmented options={CARD_STYLES} value={cardStyle} onChange={pickCard} />
          </div>

          <div className="space-y-1.5">
            <p className="text-[12px] text-[var(--muted-foreground)]">Aspeto</p>
            <Segmented options={SIDEBAR_STYLES} value={sidebarStyle} onChange={pickSidebar} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-0 rounded-[8px] bg-[var(--muted)] p-0.5">
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={
              "rounded-[6px] px-2 py-1.5 text-[12px] font-medium transition-colors " +
              (active
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]")
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
