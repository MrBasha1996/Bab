import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// يستقبل رجوع Google OAuth (code) ويُبادله بجلسة Supabase، ثم يُحوِّل إلى
// next (افتراضياً صفحة الولاء التي بدأت تسجيل الدخول). عام بلا حماية
// عمداً — proxy.ts يستثني /auth/* لنفس السبب (راجع تعليق المطابقة هناك).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(origin);
}
