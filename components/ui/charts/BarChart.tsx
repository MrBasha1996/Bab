"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export interface BarDatum {
  label: string;
  value: number;
  hint?: string;
}

export function BarChart({
  data,
  height = 180,
  className,
  highlightLast = false,
}: {
  data: BarDatum[];
  height?: number;
  className?: string;
  highlightLast?: boolean;
}) {
  const gradientId = useId();
  const width = 320;
  const padX = 16;
  const padY = 24;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const max = Math.max(...data.map((d) => d.value), 1);
  const barGap = 8;
  const barWidth = (innerW - barGap * (data.length - 1)) / data.length;

  return (
    <div className={cn("w-full overflow-hidden", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        role="img"
        aria-label="bar chart"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-accent)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--brand-accent)" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const barH = (d.value / max) * innerH;
          const x = padX + i * (barWidth + barGap);
          const y = padY + innerH - barH;
          const isHighlight = highlightLast && i === data.length - 1;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={4}
                fill={isHighlight ? "var(--brand-accent)" : `url(#${gradientId})`}
                opacity={d.value === 0 ? 0.25 : 1}
              />
              <text
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize={10}
                fontWeight={700}
                fill="var(--text-primary)"
              >
                {d.value > 0 ? d.value : ""}
              </text>
              <text
                x={x + barWidth / 2}
                y={height - 6}
                textAnchor="middle"
                fontSize={9}
                fill="var(--text-muted)"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
