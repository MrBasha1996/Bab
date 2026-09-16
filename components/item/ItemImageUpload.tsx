"use client";

import { useRef, useTransition } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { UtensilsCrossed } from "lucide-react";
import { uploadItemImage } from "@/lib/actions/item.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ItemImageUpload({ itemId, imageUrl }: { itemId: string; imageUrl: string | null }) {
  const t = useTranslations("menus.item");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function onFileSelected(file: File) {
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      const result = await uploadItemImage(itemId, formData);
      if (!result.success) toast.error(result.error ?? t("genericError"));
    });
  }

  return (
    <Card className="max-w-none">
      <CardHeader>
        <CardTitle className="text-base">{t("coverImage")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <div className="relative aspect-4/3 w-40 shrink-0 overflow-hidden rounded-lg border bg-muted">
          {imageUrl ? (
            <Image src={imageUrl} alt="" fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <UtensilsCrossed className="size-6 text-muted-foreground/40" />
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelected(file);
          }}
        />
        <Button type="button" variant="outline" size="sm" className="w-fit" disabled={isPending} onClick={() => inputRef.current?.click()}>
          {isPending ? t("uploading") : imageUrl ? t("changeImage") : t("uploadImage")}
        </Button>
      </CardContent>
    </Card>
  );
}
