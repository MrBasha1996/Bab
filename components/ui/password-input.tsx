"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export function PasswordInput({
  className,
  leadingIcon: LeadingIcon,
  ...props
}: React.ComponentProps<"input"> & {
  leadingIcon?: React.ComponentType<{ className?: string }>;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const t = useTranslations("common");

  return (
    <div className="relative">
      {LeadingIcon && (
        <LeadingIcon className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground" />
      )}
      <Input
        type={showPassword ? "text" : "password"}
        className={cn(LeadingIcon && "ps-9", "pe-9", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        className="absolute inset-y-0 end-3 my-auto text-muted-foreground hover:text-foreground"
        aria-label={showPassword ? t("hidePassword") : t("showPassword")}
      >
        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
