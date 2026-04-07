import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/public/CheckoutForm";
import { getPublicOffering } from "@/lib/data";

type CheckoutPageProps = {
  params: {
    username: string;
    offeringId: string;
  };
};

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const payload = await getPublicOffering(params.username, params.offeringId);

  if (!payload) {
    notFound();
  }

  if (payload.expert.subscription_status !== "active") {
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
            Their subscription is inactive, so new purchases are disabled right now.
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
