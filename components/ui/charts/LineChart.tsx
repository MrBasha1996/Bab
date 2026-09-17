"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export interface LineDatum {
  label: string;
  value: number;
}

export function LineChart({
  data,
  height = 160,
  className,
}: {
  data: LineDatum[];
  height?: number;
  className?: string;
}) {
  const lineGradientId = useId();
  const fillGradientId = useId();
  const width = 320;
  const padX = 20;
  const padY = 16;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const span = max - min || 1;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const x = padX + i * stepX;
    const y = padY + innerH - ((d.value - min) / span) * innerH;
    return { x, y, ...d };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${(padY + innerH).toFixed(2)} L ${points[0].x.toFixed(2)} ${(padY + innerH).toFixed(2)} Z`
      : "";

  return (
    <div className={cn("w-full overflow-hidden", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        role="img"
        aria-label="line chart"
      >
        <defs>
          <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--brand-accent)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={lineGradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--brand-accent)" />
            <stop offset="100%" stopColor="var(--brand-accent)" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((r) => (
          <line
            key={r}
            x1={padX}
            y1={padY + innerH * r}
            x2={padX + innerW}
            y2={padY + innerH * r}
            stroke="var(--text-muted)"
            strokeOpacity={0.15}
            strokeDasharray="3 3"
          />
        ))}

        {/* Area fill */}
        {areaPath && <path d={areaPath} fill={`url(#${fillGradientId})`} />}

        {/* Line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={`url(#${lineGradientId})`}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Points + labels */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3} fill="var(--brand-accent)" />
            <circle cx={p.x} cy={p.y} r={6} fill="var(--brand-accent)" opacity={0.15} />
            {(i === 0 || i === points.length - 1 || i % Math.ceil(points.length / 4) === 0) && (
              <text
                x={p.x}
                y={height - 4}
                textAnchor="middle"
                fontSize={9}
                fill="var(--text-muted)"
              >
                {p.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
