import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AmbientBackdrop } from "@/components/motion/AmbientBackdrop";
import { getMarketplaceData } from "@/lib/data";
import { OFFERING_TYPE_OPTIONS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { absoluteUrl, buildMetadata, truncateDescription } from "@/lib/seo";
import { type OfferingType } from "@/types";

type DiscoverPageProps = {
  searchParams?: {
    q?: string;
    type?: string;
  };
};

const typeFilters: Array<{
  id: OfferingType | "all";
  label: string;
}> = [
  { id: "all", label: "All offers" },
  ...Object.values(OFFERING_TYPE_OPTIONS).map((option) => ({
    id: option.id,
    label: option.shortName,
  })),
];

export const dynamic = "force-dynamic";

function getSelectedType(value?: string): OfferingType | "all" {
  if (value === "qa" || value === "session" || value === "resource") {
    return value;
  }

  return "all";
}

function getDiscoverHref(type: OfferingType | "all", query: string) {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (type !== "all") {
    params.set("type", type);
  }

  const serialized = params.toString();
  return serialized ? `/discover?${serialized}` : "/discover";
}

export const metadata: Metadata = buildMetadata({
  title: "Discover experts",
  description:
    "Browse live experts, paid Q&A, private sessions, and digital resources on Intellink. Clients never subscribe.",
  path: "/discover",
});

export default async function DiscoverPage({
  searchParams,
}: DiscoverPageProps) {
  const selectedType = getSelectedType(searchParams?.type);
  const query = searchParams?.q?.trim() ?? "";
  const marketplace = await getMarketplaceData({
    query,
    type: selectedType,
    limit: 24,
  });

  const discoverJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Discover experts on Intellink",
    url: absoluteUrl("/discover"),
    description:
      "Browse live Intellink experts and buy paid Q&A, sessions, and digital resources without subscribing.",
    mainEntity: {
      "@type": "ItemList",
      itemListElement: marketplace.listings.map((listing, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/${listing.expert.username}/pay/${listing.id}`),
        name: `${listing.title} by ${listing.expert.name}`,
      })),
    },
  };

  return (
    <main className="page-enter pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(discoverJsonLd),
        }}
      />

      <header className="section-shell pt-6">
        <div className="panel motion-shell overflow-hidden bg-slate-950 text-white">
          <AmbientBackdrop variant="hero" />
          <div className="relative z-10 flex flex-col gap-5 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-8">
            <div className="rise-in">
              <p className="text-lg font-semibold tracking-[0.18em] text-amber-300">
                INTELLINK DISCOVER
              </p>
            </div>
            <nav className="rise-in delay-1 flex flex-wrap items-center gap-3 text-sm">
              <Link href="/" className="button-secondary">
                Home
              </Link>
              <Link href="/register" className="button-gold">
                Become an expert
              </Link>
            </nav>
          </div>

          <div className="relative z-10 grid gap-8 px-6 pb-10 pt-4 md:grid-cols-[1.1fr,0.9fr] md:px-8 md:pb-14">
            <div className="max-w-3xl">
              <p className="rise-in delay-1 inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200">
                Clients browse freely. Only experts subscribe.
              </p>
              <h1 className="rise-in delay-2 mt-6 text-4xl font-semibold leading-[1.02] text-white sm:text-5xl md:text-6xl">
                Find experts
                <span className="text-sheen block">worth paying.</span>
              </h1>
              <p className="rise-in delay-3 mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                Explore live Q&A offers, private sessions, and digital resources
                from verified experts. Clients do not subscribe, they just browse,
                pick what they need, and pay directly.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="metric-card rise-in delay-3">
                  <p className="text-sm text-slate-300">Live experts</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {marketplace.totalExperts}
                  </p>
                </div>
                <div className="metric-card rise-in delay-4">
                  <p className="text-sm text-slate-300">Live offers</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {marketplace.totalListings}
                  </p>
                </div>
                <div className="metric-card rise-in delay-5">
                  <p className="text-sm text-slate-300">Client access</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    No subscription
                  </p>
                </div>
              </div>
            </div>

            <div className="panel glass-card rise-in delay-4 float-card border-white/10 p-5 text-white sm:p-6">
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-5 sm:p-6">
                <p className="text-sm uppercase tracking-[0.2em] text-amber-300">
                  Browse by format
                </p>
                <div className="mt-6 space-y-4">
                  {Object.values(OFFERING_TYPE_OPTIONS).map((option) => (
                    <div
                      key={option.id}
                      className="rise-in-soft rounded-[1.5rem] border border-white/10 bg-white/5 p-4"
                    >
                      <p className="font-semibold text-white">{option.name}</p>
                      <p className="mt-2 text-sm leading-7 text-slate-300">
                        {option.description}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-[1.5rem] bg-amber-300 px-5 py-4 text-slate-950">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em]">
                    Client rule
                  </p>
                  <p className="mt-2 text-sm leading-7">
                    Experts pay to use Intellink. Clients never subscribe. They
                    just discover, choose, and pay for the help they need.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="section-shell mt-16">
        <div className="panel p-6 sm:p-8">
          <div className="stack-actions gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
                Search marketplace
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">
                Browse what clients can buy right now
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-slate-500">
              Search by expert name, username, offer title, topic, or bio. Filter
              by offer format when you know the type of help you want.
            </p>
          </div>

          <form action="/discover" className="mt-8 grid gap-4 lg:grid-cols-[1.4fr,0.75fr,auto]">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search experts, topics, offers"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
            />
            <select
              name="type"
              defaultValue={selectedType}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
            >
              {typeFilters.map((filter) => (
                <option key={filter.id} value={filter.id}>
                  {filter.label}
                </option>
              ))}
            </select>
            <button type="submit" className="button-primary button-block-mobile">
              Search
            </button>
          </form>

          <div className="mt-6 flex flex-wrap gap-3">
            {typeFilters.map((filter) => {
              const active = filter.id === selectedType;

              return (
                <Link
                  key={filter.id}
                  href={getDiscoverHref(filter.id, query)}
                  className={
                    active
                      ? "rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                      : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-950 hover:text-slate-950"
                  }
                >
                  {filter.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-shell mt-10">
        {marketplace.listings.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {marketplace.listings.map((listing, index) => (
              <article
                key={listing.id}
                className={`panel rise-in p-6 sm:p-7 ${index % 2 === 0 ? "float-card" : "float-card-alt"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
                      {OFFERING_TYPE_OPTIONS[listing.type].shortName}
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-slate-950">
                      {listing.title}
                    </h3>
                  </div>
                  <p className="text-lg font-semibold text-slate-950">
                    {formatCurrency(listing.price)}
                  </p>
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {truncateDescription(listing.description, listing.description, 150)}
                </p>

                <div className="mt-6 flex items-center gap-4 rounded-[1.5rem] bg-slate-50 p-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-base font-semibold text-slate-700">
                    {listing.expert.profile_photo ? (
                      <Image
                        src={listing.expert.profile_photo}
                        alt={listing.expert.name}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      listing.expert.name.slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">
                      {listing.expert.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      @{listing.expert.username}
                    </p>
                  </div>
                </div>

                <div className="mt-6 button-row">
                  <Link
                    href={`/${listing.expert.username}`}
                    className="button-secondary button-block-mobile"
                  >
                    View profile
                  </Link>
                  <Link
                    href={`/${listing.expert.username}/pay/${listing.id}`}
                    className="button-gold button-block-mobile"
                  >
                    Buy now
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="panel px-6 py-10 text-center text-slate-500 sm:px-8 sm:py-12">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
              No matches
            </p>
            <h2 className="mt-4 text-2xl font-semibold text-slate-950">
              Nothing matched that search yet.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-600">
              Try a broader keyword or switch the offering type filter. New live
              experts will appear here automatically once their subscription and
              payout setup are active.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
