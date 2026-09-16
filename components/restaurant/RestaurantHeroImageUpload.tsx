"use client";

import { useRef, useTransition } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ImageIcon } from "lucide-react";
import { uploadRestaurantHeroImage } from "@/lib/actions/restaurant.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RestaurantHeroImageUpload({
  restaurantId,
  imageUrl,
}: {
  restaurantId: string;
  imageUrl: string | null;
}) {
  const t = useTranslations("restaurant.settings");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function onFileSelected(file: File) {
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      const result = await uploadRestaurantHeroImage(restaurantId, formData);
      if (!result.success) toast.error(result.error ?? t("genericError"));
    });
  }

  return (
    <Card className="max-w-none">
      <CardHeader>
        <CardTitle className="text-base">{t("heroImageTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-3">
        <div className="relative aspect-21/9 w-full overflow-hidden rounded-lg border bg-muted">
          {imageUrl ? (
            <Image src={imageUrl} alt="" fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="size-6 text-muted-foreground/40" />
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
