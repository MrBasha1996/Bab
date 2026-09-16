import * as React from "react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { TONE_CLASSES, type Tone } from "@/lib/ui/tone"

function Sparkline({ points, className }: { points: number[]; className?: string }) {
  if (points.length < 2) return null
  const max = Math.max(...points)
  const min = Math.min(...points)
  const span = max - min || 1
  const step = 100 / (points.length - 1)
  const d = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${(i * step).toFixed(2)} ${(28 - ((p - min) / span) * 24).toFixed(2)}`)
    .join(" ")
  return (
    <svg
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      aria-hidden
      className={cn("pointer-events-none h-7 w-full opacity-40", className)}
    >
      <path d={d} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  change,
  hint,
  spark,
  className,
}: {
  label: string
  value: React.ReactNode
  icon: React.ComponentType<{ className?: string }>
  tone?: Tone
  change?: { value: string; direction: "up" | "down" }
  hint?: string
  spark?: number[]
  className?: string
}) {
  return (
    <Card className={cn("relative transition-shadow hover:shadow-[var(--shadow-lg)]", className)}>
      <CardContent className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full",
            TONE_CLASSES[tone].chip
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-2xl leading-tight font-bold">{value}</p>
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          {(change || hint) && (
            <p className="mt-1 flex items-center gap-1.5 text-xs">
              {change && (
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-medium",
                    change.direction === "up"
                      ? "bg-success/10 text-success"
                      : "bg-destructive/10 text-destructive"
                  )}
                >
                  {change.direction === "up" ? "▲" : "▼"} {change.value}
                </span>
              )}
              {hint && <span className="truncate text-muted-foreground">{hint}</span>}
            </p>
          )}
        </div>
        {spark && (
          <div className={cn("hidden w-20 self-stretch sm:block", TONE_CLASSES[tone].text)}>
            <Sparkline points={spark} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
