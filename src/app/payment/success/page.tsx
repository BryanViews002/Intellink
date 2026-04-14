import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyKorapayCharge } from "@/lib/korapay";
import { buildReviewPath } from "@/lib/reviews";
import { processTransactionCharge } from "@/lib/transaction-processing";
import { supabaseAdmin } from "@/lib/supabase";
import { buildMetadata } from "@/lib/seo";
import { AmbientBackdrop } from "@/components/motion/AmbientBackdrop";
import { type TransactionContext } from "@/types";

type PaymentSuccessPageProps = {
  searchParams: {
    reference?: string | string[];
  };
};

function normalizeReference(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.split(/[?&]reference=/)[0]?.trim() || undefined;
}

function getReference(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    for (const candidate of value) {
      const normalized = normalizeReference(candidate);
      if (normalized) return normalized;
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
  description: "Review the latest status of your Intellink payment confirmation.",
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
    redirect(`/payment/failed?type=${type ?? "payment"}&reference=${reference}`);
  }

  // ── SUBSCRIPTION FLOW ──────────────────────────────────────────────────────
  if (type === "subscription" && verifiedStatus === "success") {
    // Allow up to ~5s for webhook to activate subscription before reading DB
    let subscription = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data } = await supabaseAdmin
        .from("subscriptions")
        .select("status, plan")
        .eq("korapay_reference", reference)
        .maybeSingle();
      if (data?.status === "active") { subscription = data; break; }
      if (attempt < 2) await new Promise((r) => setTimeout(r, 1500));
    }

    const planLabel = subscription?.plan ?? "plan";
    const isActive = subscription?.status === "active";

    return (
      <main className="section-shell relative flex flex-1 items-center justify-center py-8 lg:py-16">
        <AmbientBackdrop variant="hero" />
        <section className="panel-lift relative z-10 mx-auto max-w-2xl border-emerald-500/20 bg-gradient-to-b from-emerald-950/40 to-[#030712]/90 backdrop-blur-3xl px-8 py-12 text-center shadow-[0_0_60px_rgba(16,185,129,0.15)]">
          {/* Success icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <svg className="h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.25em] text-emerald-400">
            Payment confirmed
          </p>
          <h1 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
            {isActive
              ? `Your ${planLabel} subscription is live.`
              : "Subscription payment received."}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-300">
            {isActive
              ? "Your expert profile is now active and discoverable to clients. Head to your dashboard to set up your offerings."
              : "Your payment was received. Your subscription may take a moment to activate — your dashboard will update automatically."}
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/dashboard" className="button-gold-glow px-10 py-4 text-base">
              Open my dashboard
            </Link>
            <Link href="/" className="button-secondary border-white/10 bg-white/5 text-slate-300 hover:text-white px-10 py-4">
              Return home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // ── PENDING / PROCESSING SUBSCRIPTION ─────────────────────────────────────
  if (type === "subscription" && ["pending", "processing"].includes(verifiedStatus)) {
    return (
      <main className="section-shell relative flex flex-1 items-center justify-center py-8 lg:py-16">
        <AmbientBackdrop variant="dashboard" />
        <section className="panel-lift relative z-10 mx-auto max-w-2xl border-amber-500/20 bg-gradient-to-b from-amber-950/30 to-[#030712]/90 backdrop-blur-3xl px-8 py-12 text-center shadow-[0_0_40px_rgba(216,170,57,0.1)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30">
            <span className="inline-block h-5 w-5 rounded-full bg-amber-400 animate-ping shadow-[0_0_15px_rgba(216,170,57,0.8)]" />
          </div>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.25em] text-amber-400">
            Payment processing
          </p>
          <h1 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
            Your payment is being confirmed.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-400">
            Korapay is finalizing your payment. This usually completes within a
            minute. Your dashboard will activate automatically — no action needed.
          </p>
          <div className="mt-10">
            <Link href="/pricing" className="button-secondary border-white/10 bg-white/5 text-slate-300 hover:text-white px-10 py-4">
              Back to pricing
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // ── TRANSACTION (CLIENT PURCHASE) FLOW ────────────────────────────────────
  if (type === "transaction") {
    let processed = null;
    let dbTransaction = null;

    if (verifiedStatus === "success") {
      // processTransactionCharge is idempotent — safe to call before/after webhook
      processed = await processTransactionCharge(reference);

      if (!processed) {
        // Webhook hasn't run yet — retry up to 3× with 1.5s gaps
        for (let attempt = 0; attempt < 3; attempt++) {
          await new Promise((r) => setTimeout(r, 1500));
          processed = await processTransactionCharge(reference);
          if (processed) break;
        }
      }

      if (!processed) {
        // Final fallback: read raw DB row
        const { data } = await supabaseAdmin
          .from("transactions")
          .select("status, offering_type, metadata")
          .eq("korapay_reference", reference)
          .maybeSingle();
        dbTransaction = data;
      }
    }

    const offeringType = processed?.offeringType ?? dbTransaction?.offering_type ?? null;
    const resourceDownloadUrl = processed?.resourceDownloadUrl ?? null;
    const reviewHref = processed?.reviewUrl ?? (() => {
      const meta = (dbTransaction?.metadata ?? {}) as TransactionContext;
      return meta.reviewToken ? buildReviewPath(reference, meta.reviewToken) : null;
    })();

    // Decide the primary CTA based on what they bought
    const getOfferingCopy = () => {
      if (offeringType === "resource") {
        return {
          heading: "Your resource is ready.",
          body: resourceDownloadUrl
            ? "Payment confirmed. Click below to download your file. A copy has also been sent to your email."
            : "Payment confirmed. Your resource has been sent to your email. Check your inbox.",
          eyebrow: "Resource delivered",
        };
      }
      if (offeringType === "qa") {
        return {
          heading: "Your question has been submitted.",
          body: "Payment confirmed. The expert has been notified and will respond to your question. Check your email for updates.",
          eyebrow: "Question submitted",
        };
      }
      if (offeringType === "session") {
        return {
          heading: "Your session is booked.",
          body: "Payment confirmed. The expert has been notified about your preferred time and will reach out to confirm the meeting.",
          eyebrow: "Session booked",
        };
      }
      return {
        heading: "Purchase confirmed.",
        body: "Your payment was received and the expert has been notified. Check your email for next steps.",
        eyebrow: "Payment confirmed",
      };
    };

    if (verifiedStatus === "success") {
      const { heading, body, eyebrow } = getOfferingCopy();

      return (
        <main className="section-shell relative flex flex-1 items-center justify-center py-8 lg:py-16">
          <AmbientBackdrop variant="hero" />
          <section className="panel-lift relative z-10 mx-auto w-full max-w-2xl border-emerald-500/20 bg-gradient-to-b from-emerald-950/30 to-[#030712]/90 backdrop-blur-3xl px-8 py-12 shadow-[0_0_60px_rgba(16,185,129,0.15)]">
            {/* Success badge */}
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <svg className="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-400">
                  {eyebrow}
                </p>
                <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl tracking-tight">
                  {heading}
                </h1>
              </div>
            </div>

            <p className="mt-8 text-base leading-relaxed text-slate-300 border-t border-white/10 pt-8">
              {body}
            </p>

            {/* ── RESOURCE DOWNLOAD CTA ── */}
            {resourceDownloadUrl && (
              <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-6">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-400">
                  Your file is ready
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  This download link is valid for 7 days.
                </p>
                <div className="mt-5">
                  <a
                    href={resourceDownloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button-gold-glow inline-flex items-center gap-2 px-8 py-4"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download your resource
                  </a>
                </div>
              </div>
            )}

            {/* ── REVIEW CTA ── */}
            {reviewHref && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-6 py-5">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-500">
                  Leave a review later
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Once you have had a chance to use what you paid for, come back
                  and rate the experience. Your feedback keeps Intellink trusted.
                </p>
                <div className="mt-4">
                  <Link href={reviewHref} className="button-secondary border-amber-500/20 bg-amber-500/5 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/30 px-6 py-3">
                    Open review link
                  </Link>
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row">
              <Link href="/discover" className="button-secondary border-white/10 bg-white/5 text-slate-300 hover:text-white text-center px-8 py-4 flex-1">
                Discover more experts
              </Link>
              <Link href="/" className="button-secondary border-white/10 bg-white/5 text-slate-300 hover:text-white text-center px-8 py-4 flex-1">
                Return home
              </Link>
            </div>
          </section>
        </main>
      );
    }

    // Transaction payment pending
    return (
      <main className="section-shell relative flex flex-1 items-center justify-center py-8 lg:py-16">
        <AmbientBackdrop variant="dashboard" />
        <section className="panel-lift relative z-10 mx-auto max-w-2xl border-amber-500/20 bg-gradient-to-b from-amber-950/30 to-[#030712]/90 backdrop-blur-3xl px-8 py-12 text-center shadow-[0_0_40px_rgba(216,170,57,0.1)]">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30">
            <span className="inline-block h-5 w-5 rounded-full bg-amber-400 animate-ping shadow-[0_0_15px_rgba(216,170,57,0.8)]" />
          </div>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.25em] text-amber-400">
            Payment processing
          </p>
          <h1 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
            Your payment is being confirmed.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-400">
            Korapay is still finalizing your payment. This usually takes under a
            minute. You will receive a confirmation email once the expert is notified.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/discover" className="button-secondary border-white/10 bg-white/5 text-slate-300 hover:text-white px-10 py-4">
              Browse more experts
            </Link>
            <Link href="/" className="button-secondary border-white/10 bg-white/5 text-slate-300 hover:text-white px-10 py-4">
              Return home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  // ── GENERIC FALLBACK ───────────────────────────────────────────────────────
  return (
    <main className="section-shell relative flex flex-1 items-center justify-center py-8 lg:py-16">
      <AmbientBackdrop variant="dashboard" />
      <section className="panel-lift relative z-10 mx-auto max-w-2xl border-white/10 bg-gradient-to-b from-slate-900/80 to-[#030712]/90 backdrop-blur-3xl px-8 py-12 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
          Payment status
        </p>
        <h1 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
          We are confirming your payment.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-400">
          Your payment request reached Intellink. We are waiting for the final
          confirmation from Korapay. Check your email for updates.
        </p>
        <div className="mt-10">
          <Link href="/" className="button-secondary border-white/10 bg-white/5 text-slate-300 hover:text-white px-10 py-4">
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
