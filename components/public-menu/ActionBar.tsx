import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Award } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

// نقطة توسّع مستقبلية من المرحلة 6 — أول استخدام فعلي لها في المرحلة 14
// (رابط الولاء). loyaltyHref اختياري عمداً: صفحة QR الشخصية تمرّره، بينما
// صفحة Tablet (جهاز مشترك على الطاولة) لا تمرّره — ربط جلسة هاتف شخصية
// (OTP) بجهاز مشترك بين عدة ضيوف غير مناسب أمنياً/خصوصياً. لنفس السبب،
// جلب رصيد النقاط يحدث فقط عندما تتوفر restaurantId (أي في وضع الهاتف
// الشخصي فقط).
export async function ActionBar({
  loyaltyHref,
  restaurantId,
}: {
  loyaltyHref?: string;
  restaurantId?: string;
}) {
  const t = await getTranslations("publicMenu");

  let pointsBalance: number | null = null;
  if (loyaltyHref && restaurantId) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: member } = await supabase
        .from("loyalty_members")
        .select("points_balance")
        .eq("restaurant_id", restaurantId)
        .eq("auth_user_id", user.id)
        .single();
      pointsBalance = member?.points_balance ?? null;
    }
  }

  return (
    <div className="sticky bottom-0 z-10 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-3">
        {loyaltyHref ? (
          <Link
            href={loyaltyHref}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
          >
            <Award className="size-4" />
            {pointsBalance !== null ? (
              <span>{t("loyaltyPoints", { points: pointsBalance })}</span>
            ) : (
              <span>{t("loyaltyLink")}</span>
            )}
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>
    </div>
  );
}
