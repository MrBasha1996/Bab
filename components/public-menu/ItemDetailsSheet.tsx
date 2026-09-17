"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { UtensilsCrossed, Maximize2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const [lightboxOpen, setLightboxOpen] = useState(false);

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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isAr ? item.nameAr : item.nameEn}</DialogTitle>
            {(item.descriptionAr || item.descriptionEn) && (
              <DialogDescription>{isAr ? item.descriptionAr : item.descriptionEn}</DialogDescription>
            )}
          </DialogHeader>

          {/* Image with view-full button */}
          <div className="group relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
            {item.imageUrl ? (
              <>
                <Image src={item.imageUrl} alt={isAr ? item.nameAr : item.nameEn} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="absolute end-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-background/80 px-3 py-1.5 text-xs font-semibold backdrop-blur transition-all hover:bg-background hover:scale-105"
                  aria-label={t("viewFullImage")}
                >
                  <Maximize2 className="size-3.5" />
                  {t("viewFullImage")}
                </button>
              </>
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

      {/* Lightbox (fullscreen image) */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          className="max-h-dvh max-w-none overflow-hidden border-0 bg-background/95 p-0 backdrop-blur-md sm:max-w-4xl"
          showCloseButton={false}
        >
          <div className="relative grid h-dvh w-full place-items-center p-4 sm:h-[85vh]">
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute end-3 top-3 z-10 grid size-10 place-items-center rounded-full bg-background/80 backdrop-blur transition-colors hover:bg-background"
              aria-label={t("closeLightbox")}
            >
              <X className="size-5" />
            </button>
            <DialogTitle className="sr-only">{t("imageLightboxTitle")}</DialogTitle>
            <DialogDescription className="sr-only">
              {isAr ? item.nameAr : item.nameEn}
            </DialogDescription>
            {item.imageUrl ? (
              <div className="relative h-full w-full">
                <Image
                  src={item.imageUrl}
                  alt={isAr ? item.nameAr : item.nameEn}
                  fill
                  sizes="100vw"
                  className="object-contain"
                  priority
                />
              </div>
            ) : (
              <div className="grid place-items-center text-muted-foreground">
                <UtensilsCrossed className="size-16 opacity-30" />
              </div>
            )}
            <span className="absolute bottom-3 inset-x-3 text-center text-xs text-muted-foreground bg-background/70 backdrop-blur px-3 py-1.5 rounded-full">
              {isAr ? item.nameAr : item.nameEn}
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
