import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyKorapayCharge } from "@/lib/korapay";
import { buildReviewPath } from "@/lib/reviews";
import { processTransactionCharge } from "@/lib/transaction-processing";
import { supabaseAdmin } from "@/lib/supabase";
import { buildMetadata } from "@/lib/seo";
import { type TransactionContext } from "@/types";

type PaymentSuccessPageProps = {
  searchParams: {
    reference?: string | string[];
  };
};

function normalizeReference(value: string | undefined): string | undefined {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  return trimmed.split(/[?&]reference=/)[0]?.trim() || undefined;
}

function getReference(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    for (const candidate of value) {
      const normalized = normalizeReference(candidate);

      if (normalized) {
        return normalized;
      }
    }

    return undefined;
  }

  return normalizeReference(value);
}

function derivePaymentType(reference: string): "subscription" | "transaction" | "payment" {
  if (reference.startsWith("SUB_")) return "subscription";
  if (reference.startsWith("INTLNK_")) return "transaction";
  return "payment";
}

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
  const rawReference = Array.isArray(searchParams.reference)
    ? searchParams.reference.join(",")
    : searchParams.reference;
  const reference = getReference(searchParams.reference);

  if (!reference) {
    redirect("/payment/failed");
  }

  const type = derivePaymentType(reference);

  const verification = await verifyKorapayCharge(reference);
  const verifiedStatus =
    verification.data?.status?.toLowerCase() ||
    verification.data?.transaction_status?.toLowerCase() ||
    "";

  console.log("Payment success page verification:", {
    rawReference,
    reference,
    type,
    verificationStatus: verification.status,
    verifiedStatus,
    verificationMessage: verification.message,
  });

  if (!verification.status || ["failed", "cancelled", "canceled", "abandoned"].includes(verifiedStatus)) {
    console.error("Payment verification failed, redirecting to failed page:", {
      reference,
      verificationStatus: verification.status,
      verifiedStatus,
    });
    redirect(`/payment/failed?type=${type ?? "payment"}&reference=${reference}`);
  }

  let eyebrow = "Payment status";
  let heading = "We are confirming your payment.";
  let statusCopy =
    "Your payment request reached Intellink. We are waiting for the final confirmation from Korapay.";
  let primaryHref = "/";
  let primaryLabel = "Return home";
  let reviewHref: string | null = null;
  let resourceDownloadUrl: string | null = null;

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
    // Try to process the transaction inline (handles webhook race condition)
    const processed = await processTransactionCharge(reference);

    if (processed) {
      resourceDownloadUrl = processed.resourceDownloadUrl;
      reviewHref = processed.reviewUrl;

      if (processed.offeringType === "resource") {
        statusCopy = resourceDownloadUrl
          ? "Payment confirmed. Your resource is ready to download. A copy has also been sent to your email."
          : "Payment confirmed. Your resource download should arrive in your email shortly.";
      } else if (processed.offeringType === "qa") {
        statusCopy =
          "Payment confirmed. Your question has been submitted and the expert has been notified. You will hear from them soon.";
      } else if (processed.offeringType === "session") {
        statusCopy =
          "Payment confirmed. Your session has been booked and the expert has been notified. They will reach out to confirm the time.";
      } else {
        statusCopy =
          "Payment confirmed. The expert has been notified and you will hear from them soon.";
      }
    } else {
      // Fallback: try reading transaction from DB
      const { data: transaction } = await supabaseAdmin
        .from("transactions")
        .select("status, offering_type, metadata")
        .eq("korapay_reference", reference)
        .maybeSingle();

      if (transaction?.status === "success") {
        statusCopy =
          transaction.offering_type === "resource"
            ? "Payment confirmed. Your resource download should arrive in your email shortly."
            : "Payment confirmed. The expert has been notified and you will hear from them soon.";

        const metadata = (transaction.metadata ?? {}) as TransactionContext;

        if (metadata.reviewToken) {
          reviewHref = buildReviewPath(reference, metadata.reviewToken);
        }
      } else {
        statusCopy =
          "Your payment was confirmed. We are finalizing the purchase and notifying the expert right now.";
      }
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

        {resourceDownloadUrl ? (
          <div className="mt-8 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-6 py-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
              Your resource is ready
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Click the button below to download your file. This link is valid
              for 7 days. A copy was also sent to your email.
            </p>
            <div className="mt-5">
              <a
                href={resourceDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button-gold-glow"
              >
                Download your resource
              </a>
            </div>
          </div>
        ) : null}

        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link href={primaryHref} className="button-primary">
            {primaryLabel}
          </Link>
          <Link href="/" className="button-secondary">
            Return home
          </Link>
        </div>
        {reviewHref ? (
          <div className="mt-8 rounded-[1.5rem] bg-slate-50 px-5 py-5 text-left">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
              Leave a review later
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Once you have used what you paid for, you can come back and rate the
              experience. Honest reviews help keep Intellink trusted.
            </p>
            <div className="mt-4">
              <Link href={reviewHref} className="button-secondary">
                Open review link
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
