"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FormCard } from "@/components/ui/form-card";

// تسجيل دخول العميل عبر Google Sign-in (بدل Phone+OTP سابقاً — راجع 14.6 في
// tasks/todo.md). لا يُنشئ عضوية ولاء بحد ذاته — بعد الرجوع من Google تتولى
// صفحة الولاء عرض PhoneEntryForm إن لم توجد عضوية بعد.
export function GoogleSignInFlow({ branchSlug }: { branchSlug: string }) {
  const t = useTranslations("loyalty.auth");
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();

  function signIn() {
    startTransition(async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/m/${branchSlug}/loyalty`,
        },
      });
      if (error) toast.error(error.message);
    });
  }

  return (
    <FormCard className="mx-auto w-full max-w-sm">
      <h1 className="text-center text-lg font-semibold">{t("title")}</h1>
      <Button onClick={signIn} disabled={isPending}>
        {isPending ? t("signingIn") : t("signInWithGoogle")}
      </Button>
    </FormCard>
  );
}
