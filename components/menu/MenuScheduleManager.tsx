"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { menuScheduleSchema, type MenuScheduleInput } from "@/lib/validation/menu.schema";
import { addMenuSchedule, deleteMenuSchedule } from "@/lib/actions/menu.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

type Schedule = { id: string; dayOfWeek: number; startTime: string; endTime: string };

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export function MenuScheduleManager({
  menuId,
  branchId,
  schedules,
}: {
  menuId: string;
  branchId: string;
  schedules: Schedule[];
}) {
  const t = useTranslations("menus.schedule");
  const [isPending, startTransition] = useTransition();
  const form = useForm<MenuScheduleInput>({
    resolver: zodResolver(menuScheduleSchema),
    defaultValues: { dayOfWeek: 0, startTime: "09:00", endTime: "22:00" },
  });

  function onSubmit(values: MenuScheduleInput) {
    startTransition(async () => {
      const result = await addMenuSchedule(menuId, branchId, values);
      if (!result.success) {
        toast.error(result.error ?? t("genericError"));
        return;
      }
      form.reset({ dayOfWeek: values.dayOfWeek, startTime: "09:00", endTime: "22:00" });
    });
  }

  function onDelete(scheduleId: string) {
    startTransition(async () => {
      const result = await deleteMenuSchedule(scheduleId, menuId);
      if (!result.success) toast.error(result.error ?? t("genericError"));
    });
  }

  return (
    <div className="grid gap-4">
      {schedules.length > 0 ? (
        <ul className="grid gap-2">
          {schedules.map((s) => (
            <li key={s.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <span>
                {t(`days.${DAY_KEYS[s.dayOfWeek]}`)} — {s.startTime.slice(0, 5)} → {s.endTime.slice(0, 5)}
              </span>
              <Button type="button" variant="ghost" size="icon" disabled={isPending} onClick={() => onDelete(s.id)}>
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">{t("alwaysActive")}</p>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-wrap items-end gap-2">
          <FormField
            control={form.control}
            name="dayOfWeek"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("day")}</FormLabel>
                <FormControl>
                  <Select value={String(field.value)} onChange={(e) => field.onChange(Number(e.target.value))}>
                    {DAY_KEYS.map((key, i) => (
                      <option key={key} value={i}>
                        {t(`days.${key}`)}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("start")}</FormLabel>
                <FormControl>
                  <Input {...field} type="time" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("end")}</FormLabel>
                <FormControl>
                  <Input {...field} type="time" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isPending}>
            {t("add")}
          </Button>
        </form>
      </Form>
    </div>
  );
}
