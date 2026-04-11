import type { Metadata } from "next";
import { ReviewForm } from "@/components/public/ReviewForm";
import { formatCurrency, formatDate } from "@/lib/format";
import { getReviewableTransaction } from "@/lib/reviews";
import { buildMetadata } from "@/lib/seo";

type ReviewPageProps = {
  params: {
    reference: string;
  };
  searchParams: {
    token?: string;
  };
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: ReviewPageProps): Promise<Metadata> {
  return buildMetadata({
    title: `Leave a review for ${params.reference}`,
    description: "Leave a verified-purchase review on Intellink.",
    path: `/review/${params.reference}`,
    noIndex: true,
  });
}

export default async function ReviewPage({
  params,
  searchParams,
}: ReviewPageProps) {
  const token = searchParams.token?.trim();
  const transaction = token
    ? await getReviewableTransaction(params.reference, token)
    : null;

  if (!token || !transaction) {
    return (
      <main className="section-shell flex min-h-screen items-center py-8 sm:py-12">
        <section className="panel mx-auto max-w-3xl px-6 py-10 text-center sm:px-8 sm:py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
            Invalid review link
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
            This review link is not available.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            Check that you opened the full review link from your Intellink email or
            payment confirmation page.
          </p>
        </section>
      </main>
    );
  }

  if (transaction.status !== "success") {
    return (
      <main className="section-shell flex min-h-screen items-center py-8 sm:py-12">
        <section className="panel mx-auto max-w-3xl px-6 py-10 text-center sm:px-8 sm:py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
            Review not ready
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
            This purchase is still being confirmed.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            Reviews become available once Intellink confirms a successful payment.
          </p>
        </section>
      </main>
    );
  }

  if (transaction.rating) {
    return (
      <main className="section-shell flex min-h-screen items-center py-8 sm:py-12">
        <section className="panel mx-auto max-w-3xl px-6 py-10 text-center sm:px-8 sm:py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
            Review already received
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
            Thanks, your feedback is already live.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            You rated {transaction.expert?.name ?? "this expert"}{" "}
            {transaction.rating.stars} star
            {transaction.rating.stars === 1 ? "" : "s"} for{" "}
            {transaction.offering?.title ?? "this purchase"}.
          </p>
          {transaction.rating.comment ? (
            <p className="mx-auto mt-6 max-w-2xl rounded-[1.5rem] bg-slate-50 px-5 py-4 text-left text-sm leading-7 text-slate-600">
              {transaction.rating.comment}
            </p>
          ) : null}
        </section>
      </main>
    );
  }

  return (
    <main className="section-shell py-8 sm:py-12">
      <section className="mx-auto mb-8 max-w-3xl rounded-[2rem] bg-slate-950 px-6 py-6 text-white sm:px-8 sm:py-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
          Verified purchase
        </p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
          {transaction.offering?.title ?? "Intellink purchase"}
        </h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-slate-300">Expert</p>
            <p className="mt-1 text-base font-semibold text-white">
              {transaction.expert?.name ?? "Unknown expert"}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-300">Amount paid</p>
            <p className="mt-1 text-base font-semibold text-white">
              {formatCurrency(transaction.amount_paid)}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-300">Reference</p>
            <p className="mt-1 text-base font-semibold text-white">
              {params.reference}
            </p>
          </div>
        </div>
        <p className="mt-5 text-sm leading-7 text-slate-300">
          Share what you learned, what worked, or whether the purchase felt worth
          the price. Honest feedback helps keep Intellink trusted.
        </p>
      </section>

      <ReviewForm
        reference={params.reference}
        token={token}
        expertName={transaction.expert?.name ?? "this expert"}
        offeringTitle={transaction.offering?.title ?? "this purchase"}
      />

      <p className="mt-8 text-center text-sm text-slate-500">
        Purchase confirmed for {transaction.client_name} on{" "}
        {formatDate(transaction.created_at)}.
      </p>
    </main>
  );
}
