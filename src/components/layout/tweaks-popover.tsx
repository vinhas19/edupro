"use client";

import { useEffect, useState } from "react";
import { Sliders, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const ACCENTS = [
  { key: "blue", label: "Azul", color: "#007aff" },
  { key: "indigo", label: "Índigo", color: "#5856d6" },
  { key: "purple", label: "Roxo", color: "#af52de" },
  { key: "pink", label: "Rosa", color: "#ff2d55" },
  { key: "red", label: "Vermelho", color: "#ff3b30" },
  { key: "orange", label: "Laranja", color: "#ff9500" },
  { key: "green", label: "Verde", color: "#34c759" },
  { key: "teal", label: "Verde-azul", color: "#30b0c7" },
];

const DENSITIES = [
  { key: "compact", label: "Compacta", radius: "0.5rem", pad: "1.25rem" },
  { key: "normal", label: "Normal", radius: "0.625rem", pad: "1.75rem" },
  { key: "spacious", label: "Espaçosa", radius: "0.875rem", pad: "2.25rem" },
];

function applyAccent(accent: string) {
  const a = ACCENTS.find((x) => x.key === accent) ?? ACCENTS[0];
  document.documentElement.style.setProperty("--primary", a.color);
  document.documentElement.style.setProperty("--ring", a.color);
  document.documentElement.style.setProperty("--sidebar-primary", a.color);
  document.documentElement.style.setProperty("--sidebar-ring", a.color);
  // Translucent accent variant
  const r = parseInt(a.color.slice(1, 3), 16);
  const g = parseInt(a.color.slice(3, 5), 16);
  const b = parseInt(a.color.slice(5, 7), 16);
  document.documentElement.style.setProperty("--accent", `rgba(${r}, ${g}, ${b}, 0.10)`);
  document.documentElement.style.setProperty("--accent-foreground", a.color);
}

function applyDensity(density: string) {
  const d = DENSITIES.find((x) => x.key === density) ?? DENSITIES[1];
  document.documentElement.style.setProperty("--radius", d.radius);
  document.documentElement.style.setProperty("--content-pad", d.pad);
}

export function TweaksPopover() {
  const [accent, setAccent] = useState("blue");
  const [density, setDensity] = useState("normal");

  useEffect(() => {
    const a = localStorage.getItem("edupro:accent") ?? "blue";
    const d = localStorage.getItem("edupro:density") ?? "normal";
    setAccent(a);
    setDensity(d);
    applyAccent(a);
    applyDensity(d);
  }, []);

  function pickAccent(key: string) {
    setAccent(key);
    localStorage.setItem("edupro:accent", key);
    applyAccent(key);
  }

  function pickDensity(key: string) {
    setDensity(key);
    localStorage.setItem("edupro:density", key);
    applyDensity(key);
  }

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Personalizar aspeto"
        className="h-9 w-9 rounded-[6px] flex items-center justify-center hover:bg-[var(--muted)] transition-colors"
      >
        <Sliders className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3">
        <div className="space-y-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--muted-foreground)] mb-2">
              Cor de destaque
            </p>
            <div className="grid grid-cols-8 gap-1.5">
              {ACCENTS.map((a) => (
                <button
                  key={a.key}
                  onClick={() => pickAccent(a.key)}
                  title={a.label}
                  aria-label={a.label}
                  className="relative h-7 w-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ background: a.color }}
                >
                  {accent === a.key && <Check className="h-3.5 w-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--separator)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--muted-foreground)] mb-2">
              Densidade
            </p>
            <div className="grid grid-cols-3 gap-1">
              {DENSITIES.map((d) => (
                <button
                  key={d.key}
                  onClick={() => pickDensity(d.key)}
                  className={
                    "rounded-[6px] px-2 py-1.5 text-[12px] font-medium transition-colors " +
                    (density === d.key
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--secondary)]")
                  }
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-[var(--muted-foreground)] pt-1">
            As preferências são guardadas neste navegador.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
