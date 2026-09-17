import { getTranslations } from "next-intl/server";
import { Eye, QrCode, UtensilsCrossed } from "lucide-react";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const WINDOW_DAYS = 30;
const EVENT_ROW_LIMIT = 5000;

function getHourInTimezone(iso: string, timeZone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", { timeZone, hour: "2-digit", hourCycle: "h23" });
    return Number(formatter.format(new Date(iso)));
  } catch {
    return new Date(iso).getUTCHours();
  }
}

export default async function AnalyticsPage() {
  await requireProfile();
  const t = await getTranslations("analytics");
  const supabase = await createClient();

  const since = new Date();
  since.setDate(since.getDate() - WINDOW_DAYS);
  const sinceIso = since.toISOString();

  const [{ data: scans }, { data: views }, { data: branches }, { data: items }] = await Promise.all([
    supabase
      .from("qr_scan_events")
      .select("branch_id, scanned_at")
      .gte("scanned_at", sinceIso)
      .order("scanned_at", { ascending: false })
      .limit(EVENT_ROW_LIMIT),
    supabase
      .from("menu_item_view_events")
      .select("branch_id, menu_item_id, created_at")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(EVENT_ROW_LIMIT),
    supabase.from("branches").select("id, name_ar, timezone"),
    supabase.from("menu_items").select("id, branch_id, name_ar"),
  ]);

  const branchById = new Map((branches ?? []).map((b) => [b.id, b]));
  const itemById = new Map((items ?? []).map((i) => [i.id, i]));

  const viewCountByItem = new Map<string, number>();
  for (const view of views ?? []) {
    viewCountByItem.set(view.menu_item_id, (viewCountByItem.get(view.menu_item_id) ?? 0) + 1);
  }
  const topItems = [...viewCountByItem.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([itemId, count]) => {
      const item = itemById.get(itemId);
      const branch = item ? branchById.get(item.branch_id) : undefined;
      return {
        itemId,
        name: item?.name_ar ?? itemId,
        branchName: branch?.name_ar ?? "",
        count,
      };
    });

  const hourCounts = new Array<number>(24).fill(0);
  for (const scan of scans ?? []) {
    const timezone = branchById.get(scan.branch_id)?.timezone ?? "UTC";
    hourCounts[getHourInTimezone(scan.scanned_at, timezone)] += 1;
  }
  for (const view of views ?? []) {
    const timezone = branchById.get(view.branch_id)?.timezone ?? "UTC";
    hourCounts[getHourInTimezone(view.created_at, timezone)] += 1;
  }
  const maxHourCount = Math.max(1, ...hourCounts);

  return (
    <div className="grid gap-6 p-6">
      <PageHeader title={t("pages.title")} description={t("pages.description")} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t("stats.scans")} value={scans?.length ?? 0} icon={QrCode} hint={t("pages.days")} />
        <StatCard label={t("stats.views")} value={views?.length ?? 0} icon={Eye} hint={t("pages.days")} />
        <StatCard
          label={t("stats.activeItems")}
          value={viewCountByItem.size}
          icon={UtensilsCrossed}
          hint={t("pages.days")}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("topItems.title")}</CardTitle>
          <CardDescription>{t("topItems.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {topItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("topItems.rank")}</TableHead>
                  <TableHead>{t("topItems.item")}</TableHead>
                  <TableHead>{t("topItems.branch")}</TableHead>
                  <TableHead>{t("topItems.views")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topItems.map((row, index) => (
                  <TableRow key={row.itemId}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.branchName}</TableCell>
                    <TableCell>{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm">{t("topItems.empty")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("peakHours.title")}</CardTitle>
          <CardDescription>{t("peakHours.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {(scans?.length ?? 0) + (views?.length ?? 0) > 0 ? (
            <div className="grid gap-1.5">
              {hourCounts.map((count, hour) => (
                <div key={hour} className="flex items-center gap-3">
                  <span className="w-12 shrink-0 text-xs text-muted-foreground tabular-nums">
                    {String(hour).padStart(2, "0")}:00
                  </span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-brand-accent"
                      style={{ width: `${(count / maxHourCount) * 100}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-end text-xs text-muted-foreground tabular-nums">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t("peakHours.empty")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
