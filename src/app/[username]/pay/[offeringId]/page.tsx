import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/public/CheckoutForm";
import { getPublicOffering } from "@/lib/data";
import { buildMetadata, truncateDescription } from "@/lib/seo";

type CheckoutPageProps = {
  params: {
    username: string;
    offeringId: string;
  };
};

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  console.log("CheckoutPage called with params:", params);

  const payload = await getPublicOffering(params.username, params.offeringId);

  console.log("CheckoutPage payload:", !!payload);

  if (!payload) {
    return (
      <main className="section-shell flex min-h-screen items-center py-8 sm:py-12">
        <section className="panel mx-auto max-w-3xl px-6 py-10 text-center sm:px-8 sm:py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
            Error
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
            Offering not found
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            The offering you're looking for could not be found. Username: {params.username}, Offering ID: {params.offeringId}
          </p>
          <div className="mt-10">
            <Link href="/discover" className="button-primary button-block-mobile">
              Browse experts
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!payload.isAvailable) {
    const unavailableCopy =
      payload.expert.subscription_status !== "active"
        ? "Their subscription is inactive, so new purchases are disabled right now."
        : payload.expert.trust_status === "restricted"
          ? "This expert has been removed from new purchases while Intellink reviews recent client feedback."
          : "This expert is still completing payout verification, so purchases are temporarily disabled.";

    return (
      <main className="section-shell flex min-h-screen items-center py-8 sm:py-12">
        <section className="panel mx-auto max-w-3xl px-6 py-10 text-center sm:px-8 sm:py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
            Unavailable
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
            This expert is currently unavailable.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            {unavailableCopy}
          </p>
          <div className="mt-10">
            <Link
              href={`/${params.username}`}
              className="button-primary button-block-mobile"
            >
              Back to profile
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="section-shell py-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href={`/${params.username}`} className="button-secondary">
          Back to profile
        </Link>
        <Link href="/discover" className="button-secondary">
          Browse experts
        </Link>
      </div>

      <CheckoutForm
        expert={{
          name: payload.expert.name,
          username: payload.expert.username,
        }}
        offering={{
          id: String(payload.offering.id),
          title: String(payload.offering.title),
          description: String(payload.offering.description),
          price: Number(payload.offering.price),
          type: payload.offering.type as "qa" | "session" | "resource",
        }}
      />
    </main>
  );
}

export async function generateMetadata({
  params,
}: CheckoutPageProps): Promise<Metadata> {
  const payload = await getPublicOffering(params.username, params.offeringId);

  if (!payload) {
    return buildMetadata({
      title: "Offering not found",
      description: "The Intellink offering you requested could not be found.",
      path: `/${params.username}/pay/${params.offeringId}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: `${String(payload.offering.title)} by ${payload.expert.name}`,
    description: truncateDescription(
      String(payload.offering.description),
      `${payload.expert.name} is selling ${String(payload.offering.title)} on Intellink.`,
    ),
    path: `/${params.username}/pay/${params.offeringId}`,
    noIndex: !payload.isAvailable,
  });
}
