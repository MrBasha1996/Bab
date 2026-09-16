"use client";

import { useTransition } from "react";
import { useFieldArray, useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { itemSchema, type ItemInput } from "@/lib/validation/item.schema";
import { createItem, updateItem } from "@/lib/actions/item.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-radix";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FormCard } from "@/components/ui/form-card";

type Option = { id: string; branchId: string; label: string };

function OptionGroupValues({
  form,
  groupIndex,
  t,
}: {
  form: UseFormReturn<ItemInput>;
  groupIndex: number;
  t: ReturnType<typeof useTranslations>;
}) {
  const control = form.control;
  const { fields, append, remove } = useFieldArray({ control, name: `optionGroups.${groupIndex}.values` });

  return (
    <div className="grid gap-2 ps-4">
      {fields.map((field, vi) => (
        <div key={field.id} className="flex items-center gap-2">
          <FormField
            control={control}
            name={`optionGroups.${groupIndex}.values.${vi}.nameAr`}
            render={({ field }) => <Input {...field} placeholder={t("valueNameAr")} className="max-w-40" />}
          />
          <FormField
            control={control}
            name={`optionGroups.${groupIndex}.values.${vi}.nameEn`}
            render={({ field }) => <Input {...field} dir="ltr" placeholder={t("valueNameEn")} className="max-w-40" />}
          />
          <FormField
            control={control}
            name={`optionGroups.${groupIndex}.values.${vi}.priceDelta`}
            render={({ field }) => (
              <Input
                {...field}
                type="number"
                step="0.01"
                className="max-w-24"
                onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
              />
            )}
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(vi)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => append({ nameAr: "", nameEn: "", priceDelta: 0 })}
      >
        <Plus className="size-4" /> {t("addValue")}
      </Button>
    </div>
  );
}

export function ItemForm({
  itemId,
  defaultValues,
  branches,
  categories,
  allergens,
}: {
  itemId?: string;
  defaultValues?: ItemInput;
  branches: { id: string; label: string }[];
  categories: Option[];
  allergens: { id: string; label: string }[];
}) {
  const t = useTranslations("menus.item");
  const [isPending, startTransition] = useTransition();
  const form = useForm<ItemInput>({
    resolver: zodResolver(itemSchema),
    defaultValues: defaultValues ?? {
      branchId: branches[0]?.id ?? "",
      nameAr: "",
      nameEn: "",
      descriptionAr: "",
      descriptionEn: "",
      price: 0,
      isSplittable: false,
      categoryIds: [],
      allergenIds: [],
      variants: [],
      optionGroups: [],
    },
  });

  const branchId = useWatch({ control: form.control, name: "branchId" });
  const branchCategories = categories.filter((c) => c.branchId === branchId);

  const variantsArray = useFieldArray({ control: form.control, name: "variants" });
  const optionGroupsArray = useFieldArray({ control: form.control, name: "optionGroups" });

  function onSubmit(values: ItemInput) {
    startTransition(async () => {
      const result = itemId ? await updateItem(itemId, values) : await createItem(values);
      if (result && !result.success) {
        toast.error(result.error ?? t("genericError"));
        return;
      }
      if (itemId) toast.success(t("saved"));
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid max-w-2xl gap-6">
        <FormCard className="max-w-none" contentClassName="gap-4">
        {!itemId && branches.length > 1 && (
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

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="nameAr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("nameAr")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nameEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("nameEn")}</FormLabel>
                <FormControl>
                  <Input {...field} dir="ltr" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="descriptionAr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("descriptionAr")}</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="descriptionEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("descriptionEn")}</FormLabel>
                <FormControl>
                  <Textarea {...field} dir="ltr" rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("price")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="calories"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("calories")}</FormLabel>
                <FormControl>
                  <Input
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    type="number"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isSplittable"
          render={({ field }) => (
            <FormItem>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={field.value} onCheckedChange={field.onChange} />
                {t("isSplittable")}
              </label>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("categories")}</FormLabel>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {branchCategories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={field.value.includes(cat.id)}
                      onCheckedChange={(checked) => {
                        field.onChange(
                          checked ? [...field.value, cat.id] : field.value.filter((id) => id !== cat.id)
                        );
                      }}
                    />
                    {cat.label}
                  </label>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {allergens.length > 0 && (
          <FormField
            control={form.control}
            name="allergenIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("allergens")}</FormLabel>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {allergens.map((a) => (
                    <label key={a.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={field.value.includes(a.id)}
                        onCheckedChange={(checked) => {
                          field.onChange(
                            checked ? [...field.value, a.id] : field.value.filter((id) => id !== a.id)
                          );
                        }}
                      />
                      {a.label}
                    </label>
                  ))}
                </div>
              </FormItem>
            )}
          />
        )}
        </FormCard>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("variants")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {variantsArray.fields.map((field, i) => (
              <div key={field.id} className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name={`variants.${i}.nameAr`}
                  render={({ field }) => <Input {...field} placeholder={t("variantNameAr")} className="max-w-40" />}
                />
                <FormField
                  control={form.control}
                  name={`variants.${i}.nameEn`}
                  render={({ field }) => (
                    <Input {...field} dir="ltr" placeholder={t("variantNameEn")} className="max-w-40" />
                  )}
                />
                <FormField
                  control={form.control}
                  name={`variants.${i}.price`}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      className="max-w-24"
                      onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                    />
                  )}
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => variantsArray.remove(i)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => variantsArray.append({ nameAr: "", nameEn: "", price: 0 })}
            >
              <Plus className="size-4" /> {t("addVariant")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("optionGroups")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {optionGroupsArray.fields.map((field, gi) => (
              <div key={field.id} className="grid gap-2 rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name={`optionGroups.${gi}.nameAr`}
                    render={({ field }) => <Input {...field} placeholder={t("groupNameAr")} className="max-w-40" />}
                  />
                  <FormField
                    control={form.control}
                    name={`optionGroups.${gi}.nameEn`}
                    render={({ field }) => (
                      <Input {...field} dir="ltr" placeholder={t("groupNameEn")} className="max-w-40" />
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`optionGroups.${gi}.isRequired`}
                    render={({ field }) => (
                      <label className="flex items-center gap-2 text-sm">
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                        {t("required")}
                      </label>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => optionGroupsArray.remove(gi)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name={`optionGroups.${gi}.minSelect`}
                    render={({ field }) => (
                      <div className="flex items-center gap-1">
                        <Label className="text-xs">{t("minSelect")}</Label>
                        <Input
                          {...field}
                          type="number"
                          className="max-w-16"
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                        />
                      </div>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`optionGroups.${gi}.maxSelect`}
                    render={({ field }) => (
                      <div className="flex items-center gap-1">
                        <Label className="text-xs">{t("maxSelect")}</Label>
                        <Input
                          {...field}
                          type="number"
                          className="max-w-16"
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 1)}
                        />
                      </div>
                    )}
                  />
                </div>
                <OptionGroupValues form={form} groupIndex={gi} t={t} />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() =>
                optionGroupsArray.append({
                  nameAr: "",
                  nameEn: "",
                  isRequired: false,
                  minSelect: 0,
                  maxSelect: 1,
                  values: [{ nameAr: "", nameEn: "", priceDelta: 0 }],
                })
              }
            >
              <Plus className="size-4" /> {t("addOptionGroup")}
            </Button>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isPending} className="w-fit">
          {isPending ? t("saving") : t("save")}
        </Button>
      </form>
    </Form>
  );
}
