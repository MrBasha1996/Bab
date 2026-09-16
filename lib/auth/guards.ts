import "server-only";
import { redirect } from "next/navigation";
import { getProfile, type Profile } from "@/lib/auth/getProfile";

/**
 * تحمي صفحة بحيث لا يدخلها إلا مستخدم لديه جلسة مسجَّلة.
 * ملاحظة: هذا تحقق للتجربة (UX) فقط — الحماية الفعلية هي سياسات RLS.
 */
export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) {
    redirect("/login");
  }
  return profile;
}

/**
 * تحمي صفحة بحيث لا يدخلها إلا مستخدم يملك القدرة (capability) المحددة.
 */
export async function requireCapability(capabilityKey: string): Promise<Profile> {
  const profile = await requireProfile();
  if (!profile.capabilities.includes(capabilityKey)) {
    redirect("/dashboard");
  }
  return profile;
}
