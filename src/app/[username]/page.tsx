import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPublicProfile } from "@/lib/data";
import { OFFERING_TYPE_OPTIONS } from "@/lib/constants";
import { formatCurrency, formatDate, formatRating } from "@/lib/format";
import { absoluteUrl, buildMetadata, truncateDescription } from "@/lib/seo";

type PublicProfilePageProps = {
  params: {
    username: string;
  };
};

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const profile = await getPublicProfile(params.username);

  if (!profile) {
    notFound();
  }

  const { expert, offerings } = profile;
  const unavailable = !profile.isAvailable;
  const unavailableReason =
    expert.subscription_status !== "active"
      ? "Their subscription is inactive, so the profile is hidden from client purchases until they renew."
      : expert.trust_status === "restricted"
        ? "This expert has been removed from new client purchases while Intellink reviews a recent trust issue."
        : "Their payout details are still being verified, so purchases are temporarily disabled.";
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: expert.name,
    url: absoluteUrl(`/${expert.username}`),
    description: expert.bio || undefined,
    image: expert.profile_photo || undefined,
    hasOfferCatalog:
      offerings.length > 0
        ? {
            "@type": "OfferCatalog",
            name: `${expert.name} offerings`,
            itemListElement: offerings.map((offering) => ({
              "@type": "Offer",
              name: String(offering.title),
              description: String(offering.description),
              price: Number(offering.price),
              priceCurrency: "NGN",
              url: absoluteUrl(`/${expert.username}/pay/${String(offering.id)}`),
            })),
          }
        : undefined,
  };

  return (
    <main className="pb-12 sm:pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personJsonLd),
        }}
      />
      <header className="section-shell pt-6">
        <div className="panel overflow-hidden bg-slate-950 px-5 py-5 text-white sm:px-6 md:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/" className="button-secondary">
                Home
              </Link>
              <Link href="/discover" className="button-secondary">
                Discover
              </Link>
            </div>
            <p className="text-sm font-medium text-slate-300">@{expert.username}</p>
          </div>
        </div>
      </header>

      <section className="section-shell mt-8">
        <div className="panel overflow-hidden">
          <div className="grid gap-8 bg-slate-950 px-6 py-8 text-white sm:px-8 sm:py-10 lg:grid-cols-[220px,1fr]">
            <div className="mx-auto w-full max-w-[220px] overflow-hidden rounded-[2rem] bg-white/10 lg:mx-0 lg:max-w-none">
              {expert.profile_photo ? (
                <Image
                  src={expert.profile_photo}
                  alt={expert.name}
                  width={440}
                  height={440}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center text-lg font-semibold text-white">
                  {expert.name.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
                Expert profile
              </p>
              <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">
                {expert.name}
              </h1>
              <p className="mt-3 text-lg text-slate-300">@{expert.username}</p>
              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
                {expert.bio || "This expert has not added a bio yet."}
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-sm text-slate-400">Average rating</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {formatRating(profile.reviewSummary.averageStars)}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-sm text-slate-400">Client reviews</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {profile.reviewSummary.totalReviews}
                  </p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-sm text-slate-400">Trust status</p>
                  <p className="mt-2 text-2xl font-semibold capitalize" style={{ color: expert.trust_status === 'good' ? '#4ade80' : '#fb923c' }}>
                    {expert.trust_status}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell mt-8">
        {unavailable ? (
          <div className="panel px-6 py-8 sm:px-8 sm:py-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
              Unavailable
            </p>
            <h2 className="mt-4 text-2xl font-semibold text-slate-950 sm:text-3xl">
              This expert is currently unavailable.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              {unavailableReason}
            </p>
          </div>
        ) : null}

        <div className="mt-8">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
              Offerings
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
              What clients can buy
            </h2>
          </div>

          {offerings.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {offerings.map((offering) => (
                <article key={String(offering.id)} className="panel p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
                        {OFFERING_TYPE_OPTIONS[offering.type as keyof typeof OFFERING_TYPE_OPTIONS].shortName}
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold text-slate-950">
                        {String(offering.title)}
                      </h3>
                    </div>
                    <p className="shrink-0 text-xl font-semibold text-slate-950">
                      {formatCurrency(Number(offering.price))}
                    </p>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    {String(offering.description)}
                  </p>
                  <div className="mt-6">
                    {unavailable ? (
                      <button
                        type="button"
                        disabled
                        className="button-secondary button-block-mobile cursor-not-allowed opacity-60"
                      >
                        Unavailable
                      </button>
                    ) : (
                      <Link
                        href={`/${expert.username}/pay/${String(offering.id)}`}
                        className="button-gold button-block-mobile"
                      >
                        Buy now
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="panel px-6 py-10 text-center text-slate-500 sm:px-8 sm:py-12">
              No live offerings yet.
            </div>
          )}
        </div>
      </section>

      <section className="section-shell mt-8">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
            Client reviews
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
            What clients are saying
          </h2>
        </div>

        {profile.reviews.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {profile.reviews.map((review) => (
              <article key={review.id} className="panel p-6 sm:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
                      {review.stars} star{review.stars === 1 ? "" : "s"}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-950">
                      {review.offering_title}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-500">{formatDate(review.created_at)}</p>
                </div>
                <p className="mt-4 text-sm font-medium text-slate-500">
                  {review.client_name}
                </p>
                <p className="mt-3 text-base leading-8 text-slate-600">
                  {review.comment || "This client left a star rating without a written review."}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="panel px-6 py-10 text-center text-slate-500 sm:px-8 sm:py-12">
            No reviews yet. The first client review will show up here.
          </div>
        )}
      </section>
    </main>
  );
}

export async function generateMetadata({
  params,
}: PublicProfilePageProps): Promise<Metadata> {
  const profile = await getPublicProfile(params.username);

  if (!profile) {
    return buildMetadata({
      title: "Expert not found",
      description: "The expert profile you requested could not be found on Intellink.",
      path: `/${params.username}`,
      noIndex: true,
    });
  }

  const { expert } = profile;
  const noIndex = !profile.isAvailable;
  const description = truncateDescription(
    expert.bio,
    `${expert.name} sells paid expert knowledge, sessions, and resources on Intellink.`,
  );

  return {
    ...buildMetadata({
      title: `${expert.name} (@${expert.username})`,
      description,
      path: `/${expert.username}`,
      noIndex,
    }),
    openGraph: {
      title: `${expert.name} (@${expert.username})`,
      description,
      url: absoluteUrl(`/${expert.username}`),
      siteName: "Intellink",
      locale: "en_US",
      type: "profile",
      images: [
        {
          url: absoluteUrl("/opengraph-image"),
          width: 1200,
          height: 630,
          alt: "Intellink preview",
        },
      ],
    },
  };
}
