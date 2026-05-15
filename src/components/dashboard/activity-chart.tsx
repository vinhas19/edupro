"use client";

import { useState } from "react";

interface Point {
  label: string;
  value: number;
  isToday?: boolean;
}

interface Props {
  data: Point[];
  height?: number;
}

export function ActivityChart({ data, height = 140 }: Props) {
  const [hover, setHover] = useState<number | null>(null);

  const width = 600; // viewBox; chart will scale to container
  const padTop = 16;
  const padBottom = 28;
  const padLeft = 28;
  const padRight = 12;
  const innerH = height - padTop - padBottom;
  const innerW = width - padLeft - padRight;

  const maxVal = Math.max(4, ...data.map((d) => d.value));
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;
  const yFor = (v: number) => padTop + innerH - (v / maxVal) * innerH;
  const xFor = (i: number) => padLeft + i * stepX;

  // Build smooth area + line paths
  const pts = data.map((d, i) => [xFor(i), yFor(d.value)] as const);
  const linePath = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1][0]} ${padTop + innerH} L ${pts[0][0]} ${padTop + innerH} Z`;

  // Y-axis ticks: 0, max/2, max
  const yTicks = [0, Math.round(maxVal / 2), maxVal];

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} className="overflow-visible">
        <defs>
          <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.30" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={padLeft}
              y1={yFor(t)}
              x2={width - padRight}
              y2={yFor(t)}
              stroke="var(--separator)"
              strokeWidth={t === 0 ? 1 : 0.5}
              strokeDasharray={t === 0 ? "0" : "3 3"}
            />
            <text
              x={padLeft - 6}
              y={yFor(t) + 4}
              textAnchor="end"
              fill="var(--muted-foreground)"
              fontSize="10"
              fontFamily="var(--font-mono)"
            >
              {t}
            </text>
          </g>
        ))}

        {/* Area + line */}
        <path d={areaPath} fill="url(#activityFill)" />
        <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Today marker (vertical) */}
        {data.map((d, i) =>
          d.isToday ? (
            <line
              key={`tm-${i}`}
              x1={xFor(i)}
              y1={padTop}
              x2={xFor(i)}
              y2={padTop + innerH}
              stroke="var(--primary)"
              strokeWidth="1"
              strokeDasharray="2 3"
              opacity="0.6"
            />
          ) : null,
        )}

        {/* Points + hover targets */}
        {data.map((d, i) => {
          const [x, y] = pts[i];
          const isHovered = hover === i;
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 5 : 3}
                fill="var(--card)"
                stroke="var(--primary)"
                strokeWidth="2"
              />
              <rect
                x={x - stepX / 2}
                y={padTop}
                width={stepX}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: "pointer" }}
              />
            </g>
          );
        })}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text
            key={`x-${i}`}
            x={xFor(i)}
            y={padTop + innerH + 16}
            textAnchor="middle"
            fontSize="10"
            fontWeight={d.isToday ? 700 : 500}
            fill={d.isToday ? "var(--primary)" : "var(--muted-foreground)"}
          >
            {d.label}
          </text>
        ))}

        {/* Hover tooltip */}
        {hover !== null && (
          <g>
            <rect
              x={Math.min(width - padRight - 64, Math.max(padLeft, xFor(hover) - 32))}
              y={Math.max(0, yFor(data[hover].value) - 28)}
              width={64}
              height={22}
              rx="4"
              fill="var(--foreground)"
              opacity="0.92"
            />
            <text
              x={Math.min(width - padRight - 32, Math.max(padLeft + 32, xFor(hover)))}
              y={Math.max(15, yFor(data[hover].value) - 13)}
              textAnchor="middle"
              fill="var(--background)"
              fontSize="10"
              fontWeight="600"
            >
              {data[hover].value} aula{data[hover].value !== 1 ? "s" : ""}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
