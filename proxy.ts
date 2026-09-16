import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // يستثني: أصول Next الثابتة، الأيقونات، وكل المسارات العامة تحت /m/*
    // (المنيو الرقمية عبر QR/Tablet — بلا مصادقة إطلاقاً، لا يجب أن تُحوَّل
    // أبداً إلى /login)، و/auth/* (callback الخاص بـGoogle OAuth — يحتاج
    // يشتغل بلا جلسة موجودة بعد ليقدر يُبادل الكود بجلسة، فلو مرّ عبر
    // middleware المصادقة سيُحوَّل إلى /login قبل اكتمال العملية).
    "/((?!_next/static|_next/image|favicon.ico|m/|auth/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
