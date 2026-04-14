import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AmbientBackdrop } from "@/components/motion/AmbientBackdrop";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
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
    <main className="page-enter pb-20 text-slate-300">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(discoverJsonLd),
        }}
      />

      <header className="section-shell pt-6">
        <div className="panel-lift overflow-hidden border-white/5 bg-gradient-to-b from-slate-900/80 to-[#030712]/90 backdrop-blur-3xl text-white">
          <AmbientBackdrop variant="hero" />
          <ScrollReveal direction="up" delay={1} className="relative z-10 flex flex-col gap-5 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-8">
            <div>
              <p className="text-lg font-bold tracking-[0.18em] text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
                INTELLINK DISCOVER
              </p>
            </div>
            <nav className="flex flex-wrap items-center gap-3 text-sm">
              <Link href="/" className="button-secondary border-white/10 bg-white/5 text-slate-300 hover:text-white px-6">
                Home
              </Link>
              <Link href="/register" className="button-gold-glow px-6">
                Become an expert
              </Link>
            </nav>
          </ScrollReveal>

          <div className="relative z-10 grid gap-8 px-6 pb-10 pt-4 md:grid-cols-[1.1fr,0.9fr] md:px-8 md:pb-14">
            <div className="max-w-3xl">
              <ScrollReveal direction="up" delay={2}>
                <p className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-500 drop-shadow">
                  Clients browse freely. Only experts subscribe.
                </p>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={3}>
                <h1 className="mt-6 text-4xl font-extrabold leading-[1.02] text-white sm:text-5xl md:text-6xl tracking-tight">
                  Find experts{" "}
                  <span className="text-gradient-gold block mt-2">worth paying.</span>
                </h1>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={4}>
                <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
                  Explore live Q&A offers, private sessions, and digital resources
                  from verified experts. Clients do not subscribe, they just browse,
                  pick what they need, and pay directly.
                </p>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={5} className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-5 hover:bg-white/5 transition-all">
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Live experts</p>
                  <p className="mt-2 text-3xl font-extrabold text-white">
                    {marketplace.totalExperts}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-5 hover:bg-white/5 transition-all">
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Live offers</p>
                  <p className="mt-2 text-3xl font-extrabold text-white">
                    {marketplace.totalListings}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-5 hover:bg-white/5 transition-all">
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Client access</p>
                  <p className="mt-2 text-2xl font-extrabold text-amber-400">
                    No sub.
                  </p>
                </div>
              </ScrollReveal>
            </div>

            <ScrollReveal direction="scale" delay={4} className="panel-lift border-white/10 bg-black/40 p-5 text-white sm:p-6 backdrop-blur-2xl">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 sm:p-6">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400">
                  Browse by format
                </p>
                <div className="mt-6 space-y-4">
                  {Object.values(OFFERING_TYPE_OPTIONS).map((option) => (
                    <div
                      key={option.id}
                      className="rounded-[1.25rem] border border-white/5 bg-black/50 p-4 transition hover:bg-white/5"
                    >
                      <p className="font-bold text-white">{option.name}</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-400">
                        {option.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </header>

      <section className="section-shell mt-16">
        <ScrollReveal direction="up" className="panel-lift border-white/5 bg-black/30 backdrop-blur-xl p-6 sm:p-8">
          <div className="flex flex-col md:flex-row gap-6 md:items-end justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-500">
                Search marketplace
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-white tracking-tight">
                Secure your uplink today.
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-slate-400 md:text-right">
              Search by expert name, username, offer title, topic, or bio. Filter
              by offer format when you know the type of help you want.
            </p>
          </div>

          <form action="/discover" className="mt-8 grid gap-4 lg:grid-cols-[1.4fr,0.75fr,auto]">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search experts, topics, offers..."
              className="w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-white outline-none transition focus:border-cyan-400/50 focus:bg-white/5 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            />
            <select
              name="type"
              defaultValue={selectedType}
              className="w-full rounded-2xl border border-white/10 bg-black/50 px-5 py-4 text-white outline-none transition focus:border-cyan-400/50 focus:bg-white/5 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] appearance-none"
            >
              {typeFilters.map((filter) => (
                <option key={filter.id} value={filter.id} className="bg-slate-900">
                  {filter.label}
                </option>
              ))}
            </select>
            <button type="submit" className="button-gold-glow px-10">
              Execute
            </button>
          </form>

          <div className="mt-8 flex flex-wrap gap-3">
            {typeFilters.map((filter) => {
              const active = filter.id === selectedType;
              return (
                <Link
                  key={filter.id}
                  href={getDiscoverHref(filter.id, query)}
                  className={
                    active
                      ? "rounded-full bg-cyan-500/20 px-5 py-2 text-sm font-bold text-cyan-400 border border-cyan-400/30 shadow-[0_0_10px_rgba(6,182,212,0.3)] transition"
                      : "rounded-full border border-white/10 bg-black/40 px-5 py-2 text-sm font-bold text-slate-400 transition hover:border-white/30 hover:text-white"
                  }
                >
                  {filter.label}
                </Link>
              );
            })}
          </div>
        </ScrollReveal>
      </section>

      <section className="section-shell mt-10">
        {marketplace.listings.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {marketplace.listings.map((listing, index) => (
              <ScrollReveal key={listing.id} delay={index} direction="up" className="h-full">
                <article
                  className={`panel-lift flex flex-col justify-between h-full border-white/10 bg-white/5 p-6 sm:p-7 hover:border-amber-500/30 shadow-lg`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400 drop-shadow">
                          {OFFERING_TYPE_OPTIONS[listing.type].shortName}
                        </p>
                        <h3 className="mt-3 text-xl font-bold text-white line-clamp-2">
                          {listing.title}
                        </h3>
                      </div>
                      <p className="text-xl font-extrabold text-amber-400 shrink-0">
                        {formatCurrency(listing.price)}
                      </p>
                    </div>

                    <p className="mt-4 text-sm leading-relaxed text-slate-400">
                      {truncateDescription(listing.description, listing.description, 150)}
                    </p>
                  </div>

                  <div className="mt-auto pt-6">
                    <div className="flex items-center gap-4 rounded-[1.25rem] bg-black/40 p-4 border border-white/5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-800 border border-slate-700 text-base font-bold text-white">
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
                        <p className="truncate text-sm font-bold text-white">
                          {listing.expert.name}
                        </p>
                        <p className="truncate text-xs font-mono text-cyan-200/50 mt-0.5">
                          @{listing.expert.username}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-4">
                      <Link
                        href={`/${listing.expert.username}`}
                        className="button-secondary w-full border-white/10 bg-black/30 hover:bg-white/10 text-center py-3"
                      >
                        Scanner profile
                      </Link>
                      <Link
                        href={`/${listing.expert.username}/pay/${listing.id}`}
                        className="button-gold-glow w-full text-center py-3"
                      >
                        Acquire target
                      </Link>
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <ScrollReveal direction="scale">
            <div className="panel-lift border-white/5 bg-black/40 px-6 py-16 text-center text-slate-500 sm:px-8">
              <span className="block text-4xl mb-6">📡</span>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-rose-500 drop-shadow">
                No telemetry found
              </p>
              <h2 className="mt-4 text-2xl font-extrabold text-white">
                Nothing matched that search parameter.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
                Try a broader keyword or switch the offering type filter. New live
                experts will appear here automatically once their subscription and
                payout setup are active.
              </p>
            </div>
          </ScrollReveal>
        )}
      </section>
    </main>
  );
}
