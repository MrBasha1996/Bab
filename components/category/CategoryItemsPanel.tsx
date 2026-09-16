"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { UtensilsCrossed, X } from "lucide-react";
import { addItemToCategory, removeItemFromCategory } from "@/lib/actions/category.actions";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-radix";

type Item = { id: string; label: string; imageUrl: string | null };

export function CategoryItemsPanel({
  categoryId,
  menuId,
  branchId,
  linkedItems,
  availableItems,
}: {
  categoryId: string;
  menuId: string;
  branchId: string;
  linkedItems: Item[];
  availableItems: Item[];
}) {
  const t = useTranslations("menus.category.items");
  const [isPending, startTransition] = useTransition();
  const [selectedItemId, setSelectedItemId] = useState(availableItems[0]?.id ?? "");

  function onAdd() {
    if (!selectedItemId) return;
    startTransition(async () => {
      const result = await addItemToCategory(categoryId, selectedItemId, branchId, menuId);
      if (!result.success) toast.error(result.error ?? t("genericError"));
    });
  }

  function onRemove(itemId: string) {
    startTransition(async () => {
      const result = await removeItemFromCategory(categoryId, itemId, menuId);
      if (!result.success) toast.error(result.error ?? t("genericError"));
    });
  }

  return (
    <div className="grid gap-4">
      {linkedItems.length > 0 ? (
        <ul className="grid gap-2">
          {linkedItems.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
              <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.label} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <UtensilsCrossed className="size-4 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <Link href={`/items/${item.id}`} className="flex-1 truncate hover:underline">
                {item.label}
              </Link>
              <Button type="button" variant="ghost" size="icon" disabled={isPending} onClick={() => onRemove(item.id)}>
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      )}

      {availableItems.length > 0 && (
        <div className="flex items-end gap-2">
          <Select value={selectedItemId} onValueChange={setSelectedItemId}>
            <SelectTrigger className="w-60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" disabled={isPending} onClick={onAdd}>
            {t("addExisting")}
          </Button>
        </div>
      )}
    </div>
  );
}
