"use client";

import { useTransition } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { preorderItemSchema, type PreorderItemInput } from "@/lib/validation/preorder.schema";
import { updatePreorderItems } from "@/lib/actions/preorder.actions";
import type { PublicItem } from "@/lib/domain/get-menu-tree";
import type { Locale } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-radix";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FormCard } from "@/components/ui/form-card";

const NO_VARIANT_VALUE = "__none__";
const formSchema = z.object({ items: z.array(preorderItemSchema) });
type FormValues = z.infer<typeof formSchema>;

// أصناف تشارك فئة واحدة على الأقل مع الصنف الأول وقابلة للتنصيف — نفس شرط
// التحقق السيرفري في preorder.actions.ts (validateHalfHalfItems).
function getHalfHalfCandidates(branchItems: PublicItem[], selectedItem: PublicItem): PublicItem[] {
  return branchItems.filter(
    (item) =>
      item.id !== selectedItem.id &&
      item.isSplittable &&
      item.categoryIds.some((c) => selectedItem.categoryIds.includes(c))
  );
}

function itemPrice(item: PublicItem, variantId: string | undefined): number {
  const variant = variantId ? item.variants.find((v) => v.id === variantId) : undefined;
  return variant ? variant.price : item.price;
}

export function PreorderPanel({
  reservationId,
  branchId,
  initialItems,
  branchItems,
}: {
  reservationId: string;
  branchId: string;
  initialItems: PreorderItemInput[];
  branchItems: PublicItem[];
}) {
  const t = useTranslations("reservations.detail.preorder");
  const tCommon = useTranslations("reservations.detail");
  const locale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { items: initialItems },
  });
  const items = useFieldArray({ control: form.control, name: "items" });
  const watchedItems = useWatch({ control: form.control, name: "items" });

  function onSave(values: FormValues) {
    startTransition(async () => {
      const result = await updatePreorderItems(reservationId, branchId, values.items);
      if (!result.success) {
        toast.error(result.error ?? tCommon("genericError"));
        return;
      }
      toast.success(tCommon("saved"));
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)}>
        <FormCard>
          <p className="font-medium">{t("title")}</p>
          {branchItems.length === 0 && items.fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            items.fields.map((field, index) => {
              const selectedItemId = watchedItems?.[index]?.menuItemId;
              const selectedItem = branchItems.find((item) => item.id === selectedItemId);
              return (
                <div key={field.id} className="grid gap-3 rounded-md border p-3">
                  <FormField
                    control={form.control}
                    name={`items.${index}.menuItemId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("item")}</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              form.setValue(`items.${index}.itemVariantId`, "");
                              form.setValue(`items.${index}.secondMenuItemId`, "");
                              form.setValue(`items.${index}.secondItemVariantId`, "");
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {branchItems.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {locale === "ar" ? item.nameAr : item.nameEn}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {selectedItem && selectedItem.variants.length > 0 && (
                    <FormField
                      control={form.control}
                      name={`items.${index}.itemVariantId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("variant")}</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value || NO_VARIANT_VALUE}
                              onValueChange={(value) => field.onChange(value === NO_VARIANT_VALUE ? "" : value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={NO_VARIANT_VALUE}>{t("noVariant")}</SelectItem>
                                {selectedItem.variants.map((variant) => (
                                  <SelectItem key={variant.id} value={variant.id}>
                                    {locale === "ar" ? variant.nameAr : variant.nameEn}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {selectedItem && selectedItem.isSplittable && (() => {
                    const candidates = getHalfHalfCandidates(branchItems, selectedItem);
                    const secondItemId = watchedItems?.[index]?.secondMenuItemId;
                    const secondVariantId = watchedItems?.[index]?.secondItemVariantId;
                    const secondItem = candidates.find((item) => item.id === secondItemId);
                    const firstVariantId = watchedItems?.[index]?.itemVariantId;
                    return (
                      <>
                        <label className="flex items-center gap-2 text-sm">
                          <Switch
                            checked={!!secondItemId}
                            disabled={candidates.length === 0}
                            onCheckedChange={(checked) => {
                              form.setValue(`items.${index}.secondMenuItemId`, checked ? candidates[0]?.id ?? "" : "");
                              form.setValue(`items.${index}.secondItemVariantId`, "");
                            }}
                          />
                          {t("halfHalf")}
                        </label>
                        {secondItemId && (
                          <>
                            <FormField
                              control={form.control}
                              name={`items.${index}.secondMenuItemId`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("secondItem")}</FormLabel>
                                  <FormControl>
                                    <Select
                                      value={field.value}
                                      onValueChange={(value) => {
                                        field.onChange(value);
                                        form.setValue(`items.${index}.secondItemVariantId`, "");
                                      }}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {candidates.map((item) => (
                                          <SelectItem key={item.id} value={item.id}>
                                            {locale === "ar" ? item.nameAr : item.nameEn}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            {secondItem && secondItem.variants.length > 0 && (
                              <FormField
                                control={form.control}
                                name={`items.${index}.secondItemVariantId`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t("secondVariant")}</FormLabel>
                                    <FormControl>
                                      <Select
                                        value={field.value || NO_VARIANT_VALUE}
                                        onValueChange={(value) => field.onChange(value === NO_VARIANT_VALUE ? "" : value)}
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value={NO_VARIANT_VALUE}>{t("noSecondVariant")}</SelectItem>
                                          {secondItem.variants.map((variant) => (
                                            <SelectItem key={variant.id} value={variant.id}>
                                              {locale === "ar" ? variant.nameAr : variant.nameEn}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}
                            {secondItem && (
                              <p className="text-sm text-muted-foreground">
                                {Math.max(
                                  itemPrice(selectedItem, firstVariantId),
                                  itemPrice(secondItem, secondVariantId)
                                ).toFixed(2)}
                              </p>
                            )}
                          </>
                        )}
                      </>
                    );
                  })()}
                  <FormField
                    control={form.control}
                    name={`items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quantity")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`items.${index}.notes`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("notes")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="outline" onClick={() => items.remove(index)} className="w-fit">
                    {t("remove")}
                  </Button>
                </div>
              );
            })
          )}
          {branchItems.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                items.append({
                  menuItemId: branchItems[0].id,
                  itemVariantId: "",
                  secondMenuItemId: "",
                  secondItemVariantId: "",
                  quantity: 1,
                  notes: "",
                })
              }
              className="w-fit"
            >
              {t("addItem")}
            </Button>
          )}
          <Button type="submit" disabled={isPending} className="w-fit">
            {isPending ? t("saving") : t("save")}
          </Button>
        </FormCard>
      </form>
    </Form>
  );
}
