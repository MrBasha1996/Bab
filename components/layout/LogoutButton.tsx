"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { LogOut } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function LogoutButton() {
  const t = useTranslations("common")
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <Button type="button" variant="outline" size="icon" onClick={handleLogout} disabled={loading} aria-label={t("logout")}>
      <LogOut className="size-4" />
    </Button>
  )
}
