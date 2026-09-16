import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { BranchForm } from "@/components/branch/BranchForm";

export default async function BranchDetailPage({ params }: PageProps<"/branches/[id]">) {
  await requireProfile();
  const { id } = await params;
  const supabase = await createClient();
  const { data: branch } = await supabase
    .from("branches")
    .select("id, name_ar, name_en, address_ar, address_en, phone, google_reviews_url, google_maps_url, timezone")
    .eq("id", id)
    .single();

  if (!branch) notFound();

  return (
    <div className="grid gap-6 p-6">
      <PageHeader backHref="/branches" title={branch.name_ar} />
      <BranchForm
        branchId={branch.id}
        defaultValues={{
          nameAr: branch.name_ar,
          nameEn: branch.name_en,
          addressAr: branch.address_ar ?? "",
          addressEn: branch.address_en ?? "",
          phone: branch.phone ?? "",
          googleReviewsUrl: branch.google_reviews_url ?? "",
          googleMapsUrl: branch.google_maps_url ?? "",
          timezone: branch.timezone,
        }}
      />
    </div>
  );
}
