"use client";

import { useTransition } from "react";
import { useForm, useWatch, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { reservationSchema, type ReservationInput } from "@/lib/validation/reservation.schema";
import { createReservation } from "@/lib/actions/reservation.actions";
import type { PublicCategory, PublicItem } from "@/lib/domain/get-menu-tree";
import type { Locale } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-radix";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FormCard } from "@/components/ui/form-card";

const NO_TABLE_VALUE = "__none__";
const NO_VARIANT_VALUE = "__none__";

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

export function ReservationForm({
  branches,
  tables,
  menuByBranch,
}: {
  branches: { id: string; label: string }[];
  tables: { id: string; branchId: string; label: string }[];
  menuByBranch: Record<string, PublicCategory[]>;
}) {
  const t = useTranslations("reservations.form");
  const locale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();
  const form = useForm<ReservationInput>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      branchId: branches[0]?.id ?? "",
      tableId: "",
      customerName: "",
      customerPhone: "",
      partySize: 2,
      reservationTime: "",
      source: "phone",
      notes: "",
      preorderItems: [],
    },
  });

  const selectedBranchId = useWatch({ control: form.control, name: "branchId" });
  const branchTables = tables.filter((table) => table.branchId === selectedBranchId);
  const branchItems = (menuByBranch[selectedBranchId] ?? []).flatMap((c) => c.items);
  const preorderItems = useFieldArray({ control: form.control, name: "preorderItems" });
  const watchedPreorderItems = useWatch({ control: form.control, name: "preorderItems" });

  function onSubmit(values: ReservationInput) {
    startTransition(async () => {
      const result = await createReservation(values);
      if (result && !result.success) {
        toast.error(result.error ?? t("genericError"));
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormCard>
          {branches.length > 0 && (
            <FormField
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("branch")}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.label}
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
          <FormField
            control={form.control}
            name="tableId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("table")}</FormLabel>
                <FormControl>
                  <Select
                    value={field.value || NO_TABLE_VALUE}
                    onValueChange={(value) => field.onChange(value === NO_TABLE_VALUE ? "" : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_TABLE_VALUE}>{t("noTable")}</SelectItem>
                      {branchTables.map((table) => (
                        <SelectItem key={table.id} value={table.id}>
                          {table.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("customerName")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="customerPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("customerPhone")}</FormLabel>
                <FormControl>
                  <Input {...field} dir="ltr" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="partySize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("partySize")}</FormLabel>
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
            name="reservationTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("reservationTime")}</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("source")}</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">{t("sourceWebsite")}</SelectItem>
                      <SelectItem value="phone">{t("sourcePhone")}</SelectItem>
                      <SelectItem value="walk_in">{t("sourceWalkIn")}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("notes")}</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormCard>
        <FormCard className="mt-6">
          <p className="font-medium">{t("preorder.title")}</p>
          {branchItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("preorder.empty")}</p>
          ) : (
            <>
              {preorderItems.fields.map((field, index) => {
                const selectedItemId = watchedPreorderItems?.[index]?.menuItemId;
                const selectedItem = branchItems.find((item) => item.id === selectedItemId);
                return (
                  <div key={field.id} className="grid gap-3 rounded-md border p-3">
                    <FormField
                      control={form.control}
                      name={`preorderItems.${index}.menuItemId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("preorder.item")}</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                form.setValue(`preorderItems.${index}.itemVariantId`, "");
                                form.setValue(`preorderItems.${index}.secondMenuItemId`, "");
                                form.setValue(`preorderItems.${index}.secondItemVariantId`, "");
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
                        name={`preorderItems.${index}.itemVariantId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("preorder.variant")}</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value || NO_VARIANT_VALUE}
                                onValueChange={(value) => field.onChange(value === NO_VARIANT_VALUE ? "" : value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={NO_VARIANT_VALUE}>{t("preorder.noVariant")}</SelectItem>
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
                      const secondItemId = watchedPreorderItems?.[index]?.secondMenuItemId;
                      const secondItem = candidates.find((item) => item.id === secondItemId);
                      return (
                        <>
                          <label className="flex items-center gap-2 text-sm">
                            <Switch
                              checked={!!secondItemId}
                              disabled={candidates.length === 0}
                              onCheckedChange={(checked) => {
                                form.setValue(
                                  `preorderItems.${index}.secondMenuItemId`,
                                  checked ? candidates[0]?.id ?? "" : ""
                                );
                                form.setValue(`preorderItems.${index}.secondItemVariantId`, "");
                              }}
                            />
                            {t("preorder.halfHalf")}
                          </label>
                          {secondItemId && (
                            <>
                              <FormField
                                control={form.control}
                                name={`preorderItems.${index}.secondMenuItemId`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>{t("preorder.secondItem")}</FormLabel>
                                    <FormControl>
                                      <Select
                                        value={field.value}
                                        onValueChange={(value) => {
                                          field.onChange(value);
                                          form.setValue(`preorderItems.${index}.secondItemVariantId`, "");
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
                                  name={`preorderItems.${index}.secondItemVariantId`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>{t("preorder.secondVariant")}</FormLabel>
                                      <FormControl>
                                        <Select
                                          value={field.value || NO_VARIANT_VALUE}
                                          onValueChange={(value) =>
                                            field.onChange(value === NO_VARIANT_VALUE ? "" : value)
                                          }
                                        >
                                          <SelectTrigger className="w-full">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value={NO_VARIANT_VALUE}>
                                              {t("preorder.noSecondVariant")}
                                            </SelectItem>
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
                            </>
                          )}
                        </>
                      );
                    })()}
                    <FormField
                      control={form.control}
                      name={`preorderItems.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("preorder.quantity")}</FormLabel>
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
                      name={`preorderItems.${index}.notes`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("preorder.notes")}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="outline" onClick={() => preorderItems.remove(index)} className="w-fit">
                      {t("preorder.remove")}
                    </Button>
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  preorderItems.append({
                    menuItemId: branchItems[0]?.id ?? "",
                    itemVariantId: "",
                    secondMenuItemId: "",
                    secondItemVariantId: "",
                    quantity: 1,
                    notes: "",
                  })
                }
                className="w-fit"
              >
                {t("preorder.addItem")}
              </Button>
            </>
          )}
        </FormCard>
        <Button type="submit" disabled={isPending} className="mt-6 w-fit">
          {isPending ? t("saving") : t("save")}
        </Button>
      </form>
    </Form>
  );
}
