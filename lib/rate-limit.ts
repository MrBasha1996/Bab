import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
    : null;

export type RateLimitKind = "publicWrite" | "qrScan" | "loyaltyReceipt";

// حدود مختلفة حسب كلفة/تكرار كل مسار: كتابات عامة عادية (حجز/استفسار/شكوى/
// تقييم) بحد معتدل، تتبع مسح QR أكثر تساهلاً (يحدث مع كل تحميل صفحة منيو
// طبيعي)، وإيصال الولاء الأكثر تشدداً لأنه يستدعي OCR مكلفاً.
const limiters: Record<RateLimitKind, Ratelimit | null> = redis
  ? {
      publicWrite: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "60 s"), prefix: "rl:public-write" }),
      qrScan: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "60 s"), prefix: "rl:qr-scan" }),
      loyaltyReceipt: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "5 m"), prefix: "rl:loyalty-receipt" }),
    }
  : { publicWrite: null, qrScan: null, loyaltyReceipt: null };

async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

// يُعيد true إن تجاوز المستدعي الحد. إن لم تُضبط بيانات Upstash بعد (بيئة
// تطوير محلية بلا حساب) يسمح دائماً بدل تعطيل المسار كاملاً.
export async function isRateLimited(kind: RateLimitKind): Promise<boolean> {
  const limiter = limiters[kind];
  if (!limiter) return false;
  const ip = await clientIp();
  const { success } = await limiter.limit(ip);
  return !success;
}
