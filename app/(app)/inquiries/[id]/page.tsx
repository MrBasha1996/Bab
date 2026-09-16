import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusPanel } from "@/components/inquiry/StatusPanel";

export default async function InquiryDetailPage({ params }: PageProps<"/inquiries/[id]">) {
  await requireProfile();
  const { id } = await params;
  const t = await getTranslations("inquiries.detail");
  const supabase = await createClient();

  const { data: inquiry } = await supabase
    .from("inquiries")
    .select("id, name, phone, email, subject, message, status, created_at")
    .eq("id", id)
    .single();

  if (!inquiry) notFound();

  return (
    <div className="grid gap-6 p-6">
      <PageHeader backHref="/inquiries" title={inquiry.subject || inquiry.name} />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="grid gap-2 text-sm">
            <p>
              <span className="text-muted-foreground">{t("name")}:</span> {inquiry.name}
            </p>
            <p dir="ltr" className="text-end">
              <span className="text-muted-foreground">{t("phone")}:</span> {inquiry.phone}
            </p>
            {inquiry.email && (
              <p dir="ltr" className="text-end">
                <span className="text-muted-foreground">{t("email")}:</span> {inquiry.email}
              </p>
            )}
            {inquiry.subject && (
              <p>
                <span className="text-muted-foreground">{t("subject")}:</span> {inquiry.subject}
              </p>
            )}
            <p>
              <span className="text-muted-foreground">{t("message")}:</span> {inquiry.message}
            </p>
            <p>
              <span className="text-muted-foreground">{t("createdAt")}:</span>{" "}
              {new Date(inquiry.created_at).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <StatusPanel inquiryId={inquiry.id} status={inquiry.status} />
      </div>
    </div>
  );
}
