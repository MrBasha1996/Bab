import { getMessages, getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import {
  CalendarClock,
  UtensilsCrossed,
  Table2,
  MessageSquareWarning,
  Plus,
  BookOpen,
  LayoutDashboard,
  Gift,
  TrendingUp,
  Users,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Eye,
} from "lucide-react";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { RestaurantOnboardingForm } from "@/components/restaurant/RestaurantOnboardingForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { BarChart, type BarDatum } from "@/components/ui/charts/BarChart";
import { RankList, type RankItem } from "@/components/ui/charts/RankList";
import type { Locale } from "@/i18n/request";

function greetingKey(locale: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return "dashboard.greetingMorning";
  if (hour < 18) return "dashboard.greetingAfternoon";
  return "dashboard.greetingEvening";
}

export default async function DashboardPage() {
  const profile = await requireProfile();

  if (!profile.restaurantId) {
    const t = await getTranslations("restaurant.onboarding");
    return (
      <div className="grid gap-6 p-6">
        <PageHeader title={t("title")} description={t("description")} />
        <RestaurantOnboardingForm />
      </div>
    );
  }

  const locale = (await getLocale()) as Locale;
  const isAr = locale === "ar";
  const t = await getTranslations("common.dashboard");
  const tNav = await getTranslations("common.nav");
  const messages = await getMessages();
  const roleLabels = (messages.common as { roles?: Record<string, string> }).roles ?? {};
  const roleLabel = profile.roleKey ? roleLabels[profile.roleKey] ?? profile.roleKey : "—";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  // Fetch real stats from Supabase (RLS scopes by the user's branches)
  const supabase = await createClient();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const [reservationsRes, itemsRes, complaintsRes, tablesRes] = await Promise.all([
    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .gte("reservation_time", `${todayStr}T00:00:00`)
      .lt("reservation_time", `${todayStr}T23:59:59`),
    supabase
      .from("menu_items")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
    supabase
      .from("complaints")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("tables")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
  ]);

  const stats = [
    {
      label: t("statReservationsToday"),
      value: reservationsRes.count ?? 0,
      icon: CalendarClock,
      tone: "info" as const,
      change: { value: "+12%", direction: "up" as const },
      hint: isAr ? "مقارنة بالأمس" : "vs yesterday",
      spark: [4, 6, 5, 8, 7, 9, 6],
    },
    {
      label: t("statActiveTables"),
      value: tablesRes.count ?? 0,
      icon: Table2,
      tone: "neutral" as const,
      hint: isAr ? "إجمالي الطاولات" : "Total tables",
    },
    {
      label: t("statMenuItems"),
      value: itemsRes.count ?? 0,
      icon: UtensilsCrossed,
      tone: "success" as const,
      change: { value: "+3", direction: "up" as const },
      hint: isAr ? "هذا الأسبوع" : "this week",
    },
    {
      label: t("statNewComplaints"),
      value: complaintsRes.count ?? 0,
      icon: MessageSquareWarning,
      tone: "warning" as const,
      hint: isAr ? "بحاجة لمراجعة" : "need review",
    },
  ];

  const quickActions = [
    {
      href: "/reservations/new",
      label: t("quickAddReservation"),
      description: t("quickAddReservationDesc"),
      icon: CalendarClock,
      tone: "primary" as const,
    },
    {
      href: "/items/new",
      label: t("quickAddItem"),
      description: t("quickAddItemDesc"),
      icon: Plus,
      tone: "success" as const,
    },
    {
      href: "/menus",
      label: t("quickViewMenu"),
      description: t("quickViewMenuDesc"),
      icon: BookOpen,
      tone: "info" as const,
    },
    {
      href: "/tables",
      label: t("quickQRTables"),
      description: t("quickQRTablesDesc"),
      icon: Table2,
      tone: "warning" as const,
    },
  ];

  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    info: "bg-info/10 text-info",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
  };

  // Build activity feed: fetch recent complaints (have customer_name) and reservations
  const [{ data: recentComplaints }, { data: recentReservations }, { data: customers }] = await Promise.all([
    supabase
      .from("complaints")
      .select("id, customer_name, type, created_at")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("reservations")
      .select("id, customer_id, party_size, reservation_time, created_at")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("customers")
      .select("id, name"),
  ]);
  const customerName = (cid: string | null) =>
    cid ? customers?.find((c) => c.id === cid)?.name ?? null : null;

  // Merge into a single chronological feed
  const activityFeed = [
    ...(recentComplaints ?? []).map((c) => ({
      type: "complaint" as const,
      id: c.id,
      title: c.customer_name ?? (isAr ? "زائر" : "Guest"),
      subtitle: isAr
        ? c.type === "complaint" ? "شكوى جديدة" : "اقتراح جديد"
        : c.type === "complaint" ? "New complaint" : "New suggestion",
      time: c.created_at,
    })),
    ...(recentReservations ?? []).map((r) => ({
      type: "reservation" as const,
      id: r.id,
      title: customerName(r.customer_id) ?? (isAr ? "حجز جديد" : "New reservation"),
      subtitle: isAr ? `حجز لـ ${r.party_size} أشخاص` : `Reservation for ${r.party_size}`,
      time: r.reservation_time,
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 5);

  // Weekly reservations chart data (last 7 days)
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);
  const weekStartStr = weekStart.toISOString();
  const { data: weeklyReservations } = await supabase
    .from("reservations")
    .select("reservation_time")
    .gte("reservation_time", weekStartStr);

  const dayLabelsAr = ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];
  const dayLabelsEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayLabels = isAr ? dayLabelsAr : dayLabelsEn;

  // Build a 7-bucket array ending today
  const weeklyData: BarDatum[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const dayIdx = d.getDay();
    weeklyData.push({
      label: dayLabels[dayIdx],
      value: 0,
      hint: d.toISOString().slice(0, 10),
    });
  }
  for (const r of weeklyReservations ?? []) {
    const rDate = new Date(r.reservation_time);
    rDate.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((rDate.getTime() - weekStart.getTime()) / 86400000);
    if (diffDays >= 0 && diffDays < 7) {
      weeklyData[diffDays].value += 1;
    }
  }

  // Top items (most viewed from menu_item_view_events)
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString();
  const { data: viewEvents } = await supabase
    .from("menu_item_view_events")
    .select("menu_item_id, created_at")
    .gte("created_at", sinceStr);

  // Aggregate counts per menu_item_id
  const viewCounts = new Map<string, number>();
  for (const e of viewEvents ?? []) {
    viewCounts.set(e.menu_item_id, (viewCounts.get(e.menu_item_id) ?? 0) + 1);
  }
  const topItemIds = Array.from(viewCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  let topItems: RankItem[] = [];
  if (topItemIds.length > 0) {
    const { data: topItemsData } = await supabase
      .from("menu_items")
      .select("id, name_ar, name_en, image_url")
      .in("id", topItemIds);
    topItems = topItemIds
      .map((id) => {
        const item = topItemsData?.find((i) => i.id === id);
        if (!item) return null;
        return {
          id: item.id,
          label: isAr ? item.name_ar : item.name_en,
          value: viewCounts.get(id) ?? 0,
          imageUrl: item.image_url ?? null,
        } as RankItem;
      })
      .filter(Boolean) as RankItem[];
  }
  const totalViews = (viewEvents ?? []).length;

  return (
    <div className="bg-arabesque min-h-full">
      <div className="mx-auto grid max-w-6xl gap-8 p-6 sm:p-8">
        {/* Greeting header */}
        <PageHeader
          eyebrow={`${t(greetingKey(locale))} 👋`}
          title={`${t(greetingKey(locale))}، ${profile.fullName?.split(" ")[0] ?? ""}`}
          description={`${t("subtitle")} · ${roleLabel}`}
          actions={
            <Button asChild variant="outline" size="sm">
              <Link href="/site" className="flex items-center gap-2">
                <LayoutDashboard className="size-4" />
                {isAr ? "عرض الموقع العام" : "View public site"}
              </Link>
            </Button>
          }
        />

        {/* Stats grid */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, idx) => (
            <StatCard
              key={idx}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              tone={stat.tone}
              change={stat.change}
              hint={stat.hint}
              spark={stat.spark}
            />
          ))}
        </section>

        {/* Quick actions */}
        <section className="grid gap-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              {t("quickActions")}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <Link
                  key={idx}
                  href={action.href}
                  className="lift-on-hover panel-warm group grid gap-3 rounded-2xl p-4"
                >
                  <span className={`grid size-11 place-items-center rounded-xl ${toneClasses[action.tone]} transition-transform group-hover:scale-110`}>
                    <Icon className="size-5" />
                  </span>
                  <div className="grid gap-1">
                    <span className="font-display text-sm font-bold">{action.label}</span>
                    <span className="text-muted-foreground text-xs leading-relaxed">{action.description}</span>
                  </div>
                  <Arrow className="size-4 text-muted-foreground justify-self-end transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                </Link>
              );
            })}
          </div>
        </section>

        {/* Two-column: Recent activity + side widgets */}
        <section className="grid gap-4 lg:grid-cols-3">
          {/* Recent activity */}
          <Card className="lg:col-span-2">
            <CardContent className="grid gap-3 p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-base font-bold flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" />
                  {t("recentActivity")}
                </h3>
                <Button asChild variant="link" size="sm" className="text-xs">
                  <Link href="/reservations">{t("viewAll")}</Link>
                </Button>
              </div>
              {activityFeed.length > 0 ? (
                <ul className="grid divide-y divide-border">
                  {activityFeed.map((item) => {
                    const time = new Date(item.time).toLocaleString(locale, {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "numeric",
                      month: "short",
                    });
                    return (
                      <li key={`${item.type}-${item.id}`} className="flex items-center gap-3 py-2.5">
                        <span
                          className={`grid size-9 place-items-center rounded-full ${
                            item.type === "complaint"
                              ? "bg-warning/10 text-warning"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {item.type === "complaint" ? (
                            <MessageSquareWarning className="size-4" />
                          ) : (
                            <Users className="size-4" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1 grid gap-0.5">
                          <p className="truncate text-sm font-semibold">{item.title}</p>
                          <p className="text-muted-foreground text-xs">{item.subtitle}</p>
                        </div>
                        <span className="text-muted-foreground text-xs" dir="ltr">
                          {time}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="grid place-items-center gap-2 py-10 text-center">
                  <span className="bg-muted/60 grid size-12 place-items-center rounded-full">
                    <CalendarClock className="size-5 text-muted-foreground" />
                  </span>
                  <p className="text-muted-foreground text-sm">{t("noActivity")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Side widgets */}
          <div className="grid gap-4">
            {/* Tip card */}
            <Card className="panel-dark bg-arabesque-dark">
              <CardContent className="grid gap-3 p-5">
                <div className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground grid size-9 place-items-center rounded-full">
                    <Gift className="size-4" />
                  </span>
                  <h3 className="font-display text-sm font-bold">{t("tip")}</h3>
                </div>
                <p className="text-current/70 text-sm leading-relaxed">{t("tipBody")}</p>
                <Button asChild size="sm" variant="secondary" className="w-fit">
                  <Link href="/loyalty" className="flex items-center gap-2">
                    <Gift className="size-4" />
                    {tNav("loyalty")}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Branch info card */}
            <Card>
              <CardContent className="grid gap-3 p-5">
                <h3 className="font-display text-sm font-bold flex items-center gap-2">
                  <LayoutDashboard className="size-4 text-primary" />
                  {isAr ? "معلومات الحساب" : "Account info"}
                </h3>
                <dl className="grid gap-2 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{isAr ? "الدور" : "Role"}</dt>
                    <dd className="font-semibold">{roleLabel}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{isAr ? "المستخدم" : "User"}</dt>
                    <dd className="font-semibold truncate max-w-32">{profile.fullName ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">{isAr ? "الفرع" : "Branch"}</dt>
                    <dd className="font-semibold">{profile.branchId ? "✓" : "—"}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Two-column: Weekly chart + Top items */}
        <section className="grid gap-4 lg:grid-cols-2">
          {/* Weekly BarChart */}
          <Card>
            <CardContent className="grid gap-3 p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="grid gap-0.5">
                  <h3 className="font-display text-base font-bold flex items-center gap-2">
                    <TrendingUp className="size-4 text-primary" />
                    {t("weeklyReservations")}
                  </h3>
                  <p className="text-muted-foreground text-xs">{t("weeklyReservationsDesc")}</p>
                </div>
                <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-bold">
                  {weeklyData.reduce((s, d) => s + d.value, 0)}
                </span>
              </div>
              <BarChart data={weeklyData} height={180} highlightLast />
            </CardContent>
          </Card>

          {/* Top items RankList */}
          <Card>
            <CardContent className="grid gap-3 p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="grid gap-0.5">
                  <h3 className="font-display text-base font-bold flex items-center gap-2">
                    <Eye className="size-4 text-primary" />
                    {t("topItems")}
                  </h3>
                  <p className="text-muted-foreground text-xs">{t("topItemsDesc")}</p>
                </div>
                <Button asChild variant="link" size="sm" className="text-xs">
                  <Link href="/items">{t("viewAllItems")}</Link>
                </Button>
              </div>
              <RankList
                items={topItems}
                totalLabel={
                  isAr
                    ? `إجمالي ${totalViews} مشاهدة خلال آخر ٣٠ يومًا`
                    : `${totalViews} total views in the last 30 days`
                }
                emptyLabel={t("noTopItems")}
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
