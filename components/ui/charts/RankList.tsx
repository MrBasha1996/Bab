"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { Trophy, UtensilsCrossed } from "lucide-react";

export interface RankItem {
  id: string;
  label: string;
  value: number;
  imageUrl?: string | null;
  hint?: string;
}

export function RankList({
  items,
  totalLabel,
  className,
  emptyLabel,
}: {
  items: RankItem[];
  totalLabel: string;
  className?: string;
  emptyLabel?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);

  if (items.length === 0 && emptyLabel) {
    return (
      <div className={cn("grid place-items-center gap-2 py-8 text-center", className)}>
        <span className="bg-muted/60 grid size-10 place-items-center rounded-full">
          <UtensilsCrossed className="size-4 text-muted-foreground/60" />
        </span>
        <p className="text-muted-foreground text-xs">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <ul className={cn("grid gap-3", className)}>
      {items.map((item, idx) => {
        const percent = (item.value / max) * 100;
        const rank = idx + 1;
        const medalColor =
          rank === 1 ? "text-warning" : rank === 2 ? "text-muted-foreground" : rank === 3 ? "text-warning/70" : "text-muted-foreground/50";
        return (
          <li key={item.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
            <span className={cn("grid size-8 place-items-center", medalColor)}>
              {rank <= 3 ? <Trophy className="size-5" /> : <span className="text-xs font-bold">{rank}</span>}
            </span>
            <div className="min-w-0 grid gap-1">
              <div className="flex items-center gap-2">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.label}
                    width={32}
                    height={32}
                    className="size-8 shrink-0 rounded-md object-cover ring-1 ring-border"
                  />
                ) : null}
                <div className="min-w-0 grid gap-0.5">
                  <span className="truncate text-sm font-semibold">{item.label}</span>
                  {item.hint ? (
                    <span className="text-muted-foreground text-[10px]">{item.hint}</span>
                  ) : null}
                </div>
              </div>
              <div className="bg-muted h-2 overflow-hidden rounded-full">
                <div
                  className="bg-brand-accent h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
            <span className="font-display text-base font-bold text-primary tabular-nums">
              {item.value}
            </span>
          </li>
        );
      })}
      <li className="text-muted-foreground text-[10px] text-center pt-1">
        {totalLabel}
      </li>
    </ul>
  );
}
