import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyKorapayCharge } from "@/lib/korapay";
import { supabaseAdmin } from "@/lib/supabase";
import { buildMetadata } from "@/lib/seo";

type PaymentSuccessPageProps = {
  searchParams: {
    type?: string;
    reference?: string;
  };
};

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildMetadata({
  title: "Payment status",
  description:
    "Review the latest status of your Intellink payment confirmation.",
  path: "/payment/success",
  noIndex: true,
});

export default async function PaymentSuccessPage({
  searchParams,
}: PaymentSuccessPageProps) {
  const reference = searchParams.reference;
  const type = searchParams.type;

  if (!reference) {
    redirect("/payment/failed");
  }

  const verification = await verifyKorapayCharge(reference);
  const verifiedStatus =
    verification.data?.status?.toLowerCase() ||
    verification.data?.transaction_status?.toLowerCase() ||
    "";

  if (!verification.status || ["failed", "cancelled", "canceled", "abandoned"].includes(verifiedStatus)) {
    redirect(`/payment/failed?type=${type ?? "payment"}&reference=${reference}`);
  }

  let eyebrow = "Payment status";
  let heading = "We are confirming your payment.";
  let statusCopy =
    "Your payment request reached Intellink. We are waiting for the final confirmation from Korapay.";
  let primaryHref = "/";
  let primaryLabel = "Return home";

  if (verifiedStatus === "success") {
    eyebrow = "Payment successful";
    heading = "Thank you. You are all set.";
    primaryHref = type === "subscription" ? "/dashboard" : "/";
    primaryLabel = type === "subscription" ? "Go to dashboard" : "Return home";
  } else if (["pending", "processing"].includes(verifiedStatus)) {
    eyebrow = "Payment pending";
    heading = "Your payment is still being processed.";
    primaryHref = "/pricing";
    primaryLabel = "Back to pricing";
  }

  if (type === "subscription" && verifiedStatus === "success") {
    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("status, plan")
      .eq("korapay_reference", reference)
      .maybeSingle();

    if (subscription?.status === "active") {
      statusCopy = `Your ${subscription.plan} subscription is active. Your expert profile can now go live.`;
    } else {
      statusCopy =
        "Your subscription payment was confirmed. We are finalizing activation in the background, so your dashboard may take a moment to update.";
    }
  }

  if (type === "transaction" && verifiedStatus === "success") {
    const { data: transaction } = await supabaseAdmin
      .from("transactions")
      .select("status, offering_type")
      .eq("korapay_reference", reference)
      .maybeSingle();

    if (transaction?.status === "success") {
      statusCopy =
        transaction.offering_type === "resource"
          ? "Payment confirmed. Your resource download should arrive in your email shortly."
          : "Payment confirmed. The expert has been notified and you will hear from them soon.";
    } else {
      statusCopy =
        "Your payment was confirmed. We are finalizing the purchase and notifying the expert right now.";
    }
  }

  return (
    <main className="section-shell flex min-h-screen items-center py-8 sm:py-12">
      <section className="panel mx-auto max-w-3xl px-6 py-10 text-center sm:px-8 sm:py-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
          {heading}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
          {statusCopy}
        </p>
        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link href={primaryHref} className="button-primary">
            {primaryLabel}
          </Link>
          <Link href="/" className="button-secondary">
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
