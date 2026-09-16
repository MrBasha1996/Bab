"use client";
import { useEffect } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { UtensilsCrossed } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { recordMenuItemView } from "@/lib/actions/menu-item-view.actions";
import type { PublicAllergen, PublicItem } from "@/lib/domain/get-menu-tree";
import type { Locale } from "@/i18n/request";

export function ItemDetailsSheet({
  item,
  allergens,
  open,
  onOpenChange,
  branchId,
  tableId,
  source,
}: {
  item: PublicItem | null;
  allergens: PublicAllergen[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  tableId: string | null;
  source: "qr" | "tablet" | "site";
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("publicMenu.item");
  const isAr = locale === "ar";

  useEffect(() => {
    if (open && item) {
      recordMenuItemView(branchId, item.id, tableId, source);
    }
    // تسجيل مرة واحدة فقط عند الفتح الفعلي، لا عند كل إعادة رسم.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id]);

  if (!item) return null;

  const itemAllergens = allergens.filter((a) => item.allergenIds.includes(a.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isAr ? item.nameAr : item.nameEn}</DialogTitle>
          {(item.descriptionAr || item.descriptionEn) && (
            <DialogDescription>{isAr ? item.descriptionAr : item.descriptionEn}</DialogDescription>
          )}
        </DialogHeader>

        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
          {item.imageUrl ? (
            <Image src={item.imageUrl} alt={isAr ? item.nameAr : item.nameEn} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <UtensilsCrossed className="size-10 text-muted-foreground/40" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold">{item.price.toFixed(2)}</span>
          {item.calories != null && (
            <span className="text-sm text-muted-foreground">{t("calories", { count: item.calories })}</span>
          )}
        </div>

        {item.variants.length > 0 && (
          <section className="grid gap-1.5">
            <h3 className="text-sm font-medium">{t("variants")}</h3>
            <ul className="grid gap-1">
              {item.variants.map((v) => (
                <li key={v.id} className="flex items-center justify-between text-sm">
                  <span>{isAr ? v.nameAr : v.nameEn}</span>
                  <span className="text-muted-foreground">{v.price.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {item.optionGroups.length > 0 && (
          <section className="grid gap-3">
            <h3 className="text-sm font-medium">{t("options")}</h3>
            {item.optionGroups.map((g) => (
              <div key={g.id} className="grid gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{isAr ? g.nameAr : g.nameEn}</span>
                  {g.isRequired && (
                    <Badge variant="outline" className="text-[0.65rem]">
                      {t("required")}
                    </Badge>
                  )}
                </div>
                <ul className="grid gap-1">
                  {g.values.map((v) => (
                    <li key={v.id} className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{isAr ? v.nameAr : v.nameEn}</span>
                      {v.priceDelta !== 0 && <span>{v.priceDelta > 0 ? "+" : ""}{v.priceDelta.toFixed(2)}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        {itemAllergens.length > 0 && (
          <section className="grid gap-1.5">
            <h3 className="text-sm font-medium">{t("allergens")}</h3>
            <div className="flex flex-wrap gap-1.5">
              {itemAllergens.map((a) => (
                <Badge key={a.id} variant="secondary">
                  {isAr ? a.nameAr : a.nameEn}
                </Badge>
              ))}
            </div>
          </section>
        )}
      </DialogContent>
    </Dialog>
  );
}
