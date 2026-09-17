"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Search, UtensilsCrossed, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ItemDetailsSheet } from "@/components/public-menu/ItemDetailsSheet";
import type { PublicAllergen, PublicCategory, PublicItem } from "@/lib/domain/get-menu-tree";
import type { Locale } from "@/i18n/request";

export function MenuBrowser({
  categories,
  allergens,
  branchId,
  tableId,
  source,
}: {
  categories: PublicCategory[];
  allergens: PublicAllergen[];
  branchId: string;
  tableId: string | null;
  source: "qr" | "tablet" | "site";
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("publicMenu");
  const isAr = locale === "ar";

  const [activeCategoryId, setActiveCategoryId] = useState(categories[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<PublicItem | null>(null);

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (i) => i.nameAr.toLowerCase().includes(q) || i.nameEn.toLowerCase().includes(q)
        ),
      }))
      .filter((c) => c.items.length > 0);
  }, [categories, query]);

  if (categories.length === 0) {
    return (
      <div className="grid place-items-center gap-3 py-16 text-center">
        <div className="bg-muted/60 grid size-16 place-items-center rounded-full">
          <UtensilsCrossed className="size-7 text-muted-foreground/60" />
        </div>
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      </div>
    );
  }

  const isSearching = query.trim().length > 0;
  const visibleCategories = isSearching
    ? filteredCategories
    : categories.filter((c) => c.id === activeCategoryId);

  return (
    <div className="grid gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search.placeholder")}
          className="h-11 ps-10 text-base"
        />
      </div>

      {/* Category pill tabs */}
      {!isSearching && (
        <div className="overflow-x-auto pb-1">
          <div className="pill-tabs">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                data-active={activeCategoryId === c.id ? "true" : "false"}
                onClick={() => setActiveCategoryId(c.id)}
                className="pill-tab"
              >
                {isAr ? c.nameAr : c.nameEn}
                <span className="text-[10px] opacity-60 font-bold">({c.items.length})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isSearching && visibleCategories.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">{t("search.noResults")}</p>
      )}

      {/* Items grid */}
      <div className="grid gap-6">
        {visibleCategories.map((c) => (
          <section key={c.id} className="grid gap-3">
            <div className="flex items-center gap-2 border-b pb-2">
              <h2 className="font-display text-lg font-bold tracking-tight">
                {isAr ? c.nameAr : c.nameEn}
              </h2>
              <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-bold">
                {c.items.length}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {c.items.map((item) => (
                <Card
                  key={item.id}
                  size="sm"
                  className="menu-item-card lift-on-hover cursor-pointer gap-0 overflow-hidden p-0 [--card-spacing:0px]"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden bg-muted">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={isAr ? item.nameAr : item.nameEn}
                        fill
                        sizes="(min-width: 640px) 25vw, 50vw"
                        className="object-cover transition-transform duration-500 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                        <UtensilsCrossed className="size-7 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="menu-item-overlay">
                      <span className="bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold">
                        <Plus className="size-3.5" /> {isAr ? "عرض" : "View"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <span className="line-clamp-1 text-sm font-semibold leading-snug">
                      {isAr ? item.nameAr : item.nameEn}
                    </span>
                    {(item.descriptionAr || item.descriptionEn) && (
                      <span className="line-clamp-2 text-xs text-muted-foreground">
                        {isAr ? item.descriptionAr : item.descriptionEn}
                      </span>
                    )}
                    <span className="mt-auto pt-1 font-display text-base font-bold text-primary">
                      {item.price.toFixed(2)}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>

      <ItemDetailsSheet
        item={selectedItem}
        allergens={allergens}
        open={selectedItem != null}
        onOpenChange={(open) => !open && setSelectedItem(null)}
        branchId={branchId}
        tableId={tableId}
        source={source}
      />
    </div>
  );
}
