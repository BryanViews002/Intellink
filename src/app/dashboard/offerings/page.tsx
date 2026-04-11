import { OfferingsManager } from "@/components/dashboard/OfferingsManager";
import { requireDashboardUser } from "@/lib/data";
import { supabaseAdmin } from "@/lib/supabase";

export default async function DashboardOfferingsPage() {
  const { profile } = await requireDashboardUser();

  const { data: offerings } = await supabaseAdmin
    .from("offerings")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <main className="section-shell py-8">
      <OfferingsManager
        plan={profile.subscription_plan ?? "starter"}
        trustStatus={profile.trust_status ?? "good"}
        offerings={offerings ?? []}
      />
    </main>
  );
}
