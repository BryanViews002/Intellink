import Link from "next/link";
import { AmbientBackdrop } from "@/components/motion/AmbientBackdrop";
import { OFFERING_TYPE_OPTIONS, SUBSCRIPTION_PLANS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { absoluteUrl, siteConfig } from "@/lib/seo";

const steps = [
  {
    title: "Create your expert profile",
    description:
      "Set up a clean public page with your positioning, credibility, and paid offers.",
  },
  {
    title: "Publish what clients can buy",
    description:
      "Sell private Q&A, live sessions, or digital resources from one premium link.",
  },
  {
    title: "Earn directly from clients",
    description:
      "Intellink charges a subscription for access. Your clients pay you directly.",
  },
];

export default function HomePage() {
  const homeJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: absoluteUrl("/"),
    description: siteConfig.description,
    offers: Object.values(SUBSCRIPTION_PLANS).map((plan) => ({
      "@type": "Offer",
      name: `${plan.name} plan`,
      price: plan.price,
      priceCurrency: "NGN",
      category: "subscription",
    })),
  };

  return (
    <main className="page-enter pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homeJsonLd),
        }}
      />
      <header className="section-shell pt-6">
        <div className="panel motion-shell overflow-hidden bg-slate-950 text-white">
          <AmbientBackdrop variant="hero" />
          <div className="relative z-10 flex flex-col gap-5 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-8">
            <div className="rise-in">
              <p className="text-lg font-semibold tracking-[0.18em] text-amber-300">
                INTELLINK
              </p>
            </div>
            <nav className="rise-in delay-1 flex flex-wrap items-center gap-3 text-sm">
              <Link href="/pricing" className="button-secondary">
                Pricing
              </Link>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 font-medium text-slate-200 hover:text-white"
              >
                Login
              </Link>
            </nav>
          </div>

          <div className="relative z-10 grid gap-10 px-6 pb-14 pt-4 md:grid-cols-[1.15fr,0.85fr] md:px-8 md:pb-20 md:pt-6">
            <div className="max-w-3xl">
              <p className="rise-in delay-1 inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur-sm">
                Premium platform for experts and professionals
              </p>
              <h1 className="rise-in delay-2 mt-6 text-4xl font-semibold leading-[1.02] text-white sm:text-5xl md:text-7xl">
                Get paid for
                <span className="text-sheen block">what you know.</span>
              </h1>
              <p className="rise-in delay-3 mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                Intellink gives experts a premium page, paid offerings, and direct
                client payments. No free tier. No trial. No transaction cut.
              </p>

              <div className="rise-in delay-4 mt-10 button-row">
                <Link href="/register" className="button-gold button-block-mobile">
                  Start earning
                </Link>
                <Link href="/pricing" className="button-secondary button-block-mobile">
                  See pricing
                </Link>
              </div>

              <div className="mt-12 grid gap-4 sm:grid-cols-3">
                <div className="metric-card rise-in delay-3">
                  <p className="text-sm text-slate-300">Subscription-based</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    Straight premium
                  </p>
                </div>
                <div className="metric-card rise-in delay-4">
                  <p className="text-sm text-slate-300">Expert payouts</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    No commission
                  </p>
                </div>
                <div className="metric-card rise-in delay-5">
                  <p className="text-sm text-slate-300">Offer types</p>
                  <p className="mt-2 text-2xl font-semibold text-white">3 ways to sell</p>
                </div>
              </div>
            </div>

            <div className="panel glass-card rise-in delay-4 float-card border-white/10 p-5 text-white sm:p-6">
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-5 backdrop-blur-xl sm:p-6">
                <p className="text-sm uppercase tracking-[0.2em] text-amber-300">
                  Expert earnings stack
                </p>
                <div className="mt-6 space-y-4">
                  {Object.values(OFFERING_TYPE_OPTIONS).map((option) => (
                    <div
                      key={option.id}
                      className="rise-in-soft rounded-[1.5rem] border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
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
                    Premium rule
                  </p>
                  <p className="mt-2 text-sm leading-7">
                    If an expert subscription goes inactive, the public profile is
                    hidden and all pay buttons shut off automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="section-shell mt-16">
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <article
              key={step.title}
              className={`panel rise-in p-6 sm:p-8 ${index % 2 === 0 ? "float-card" : "float-card-alt"} delay-${index + 1}`}
            >
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
                Step {index + 1}
              </p>
              <h2 className="mt-4 text-2xl font-semibold text-slate-950">
                {step.title}
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-shell mt-16">
        <div className="panel motion-shell overflow-hidden bg-slate-950 text-white">
          <AmbientBackdrop variant="pricing" />
          <div className="relative z-10 grid gap-8 px-6 py-10 md:grid-cols-[0.9fr,1.1fr] md:px-10 md:py-12">
            <div className="rise-in">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
                Pricing
              </p>
              <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
                Premium access only.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
                Experts subscribe monthly to stay visible, keep offerings live,
                and continue earning from clients.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {Object.values(SUBSCRIPTION_PLANS).map((plan, index) => (
                <article
                  key={plan.id}
                  className={`rounded-[2rem] border p-6 sm:p-7 ${
                    plan.featured
                      ? "rise-in delay-2 float-card border-amber-300 bg-white text-slate-950"
                      : `rise-in glass-card border-white/10 text-white ${index % 2 === 0 ? "float-card" : "float-card-alt"}`
                  }`}
                >
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-500">
                    {plan.name}
                  </p>
                  <div className="mt-4 text-3xl font-semibold sm:text-4xl">
                    {formatCurrency(plan.price)}
                    <span className="text-base font-medium text-slate-400">
                      {" "}
                      / month
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-500">
                    {plan.description}
                  </p>
                  <ul className="mt-6 space-y-3 text-sm leading-7">
                    <li>
                      {plan.id === "starter"
                        ? "One offering type only"
                        : "All 3 offering types unlocked"}
                    </li>
                    <li>Profile stays visible only while subscription is active</li>
                    <li>Clients pay experts directly with no platform cut</li>
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
