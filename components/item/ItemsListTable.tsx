"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { UtensilsCrossed } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-radix";
import { AvailabilityToggle } from "@/components/item/AvailabilityToggle";

export interface ItemRow {
  id: string;
  branchId: string;
  branchName: string;
  nameAr: string;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  isVisible: boolean;
  categoryIds: string[];
  categoryNames: string[];
}

export function ItemsListTable({
  rows,
  categoryOptions,
}: {
  rows: ItemRow[];
  categoryOptions: { id: string; name: string }[];
}) {
  const t = useTranslations();
  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState("all");
  const [branchId, setBranchId] = useState("all");
  const [categoryId, setCategoryId] = useState("all");

  const branchOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) map.set(r.branchId, r.branchName);
    return [...map.entries()];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (availability === "available" && !r.isAvailable) return false;
      if (availability === "unavailable" && r.isAvailable) return false;
      if (branchId !== "all" && r.branchId !== branchId) return false;
      if (categoryId !== "all" && !r.categoryIds.includes(categoryId)) return false;
      if (!q) return true;
      return r.nameAr.toLowerCase().includes(q);
    });
  }, [rows, search, availability, branchId, categoryId]);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("common.searchPlaceholder")}
          className="max-w-xs"
        />
        {branchOptions.length > 1 && (
          <Select value={branchId} onValueChange={setBranchId}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {branchOptions.map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {categoryOptions.length > 0 && (
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {categoryOptions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={availability} onValueChange={setAvailability}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            <SelectItem value="available">{t("menus.item.available")}</SelectItem>
            <SelectItem value="unavailable">{t("menus.item.unavailable")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredRows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("common.noResults")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRows.map((row) => (
            <Card key={row.id} size="sm" className="flex-row gap-3 p-3">
              <Link href={`/items/${row.id}`} className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                {row.imageUrl ? (
                  <Image src={row.imageUrl} alt={row.nameAr} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <UtensilsCrossed className="size-5 text-muted-foreground/40" />
                  </div>
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Link href={`/items/${row.id}`} className="truncate text-sm font-medium hover:underline">
                  {row.nameAr}
                </Link>
                <span className="truncate text-xs text-muted-foreground">{row.branchName}</span>
                {row.categoryNames.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {row.categoryNames.map((name) => (
                      <Badge key={name} variant="outline" className="text-[0.65rem]">
                        {name}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                  <span className="text-sm font-semibold">{row.price.toFixed(2)}</span>
                  <Badge variant={row.isVisible ? "success" : "outline"} className="text-[0.65rem]">
                    {row.isVisible ? t("menus.item.visible") : t("menus.item.hidden")}
                  </Badge>
                </div>
                <AvailabilityToggle itemId={row.id} isAvailable={row.isAvailable} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
