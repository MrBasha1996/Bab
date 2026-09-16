import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getClaims() يتحقق من توقيع الـJWT محلياً عبر JWKS بعد جلبه مرة وتخزينه
  // في الذاكرة — بلا رحلة شبكة لكل طلب كما في getUser().
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub ?? null;

  const isAuthRoute = request.nextUrl.pathname.startsWith("/login");

  if (!userId && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (userId && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // نمرّر هوية المستخدم المتحقق منها إلى الطبقة الخادمة عبر ترويسة موثوقة،
  // حتى لا تُضطر getProfile() لاستدعاء auth.getUser() مرة ثانية لكل تنقّل.
  // نحذف أي قيمة واردة من العميل لنفس الترويسة أولاً حتى لا يُمكن تزويرها.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-verified-user-id");
  if (userId) {
    requestHeaders.set("x-verified-user-id", userId);
  }

  const finalResponse = NextResponse.next({ request: { headers: requestHeaders } });
  supabaseResponse.cookies.getAll().forEach((cookie) => finalResponse.cookies.set(cookie));

  return finalResponse;
}
