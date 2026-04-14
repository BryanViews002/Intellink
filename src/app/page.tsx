import type { Metadata } from "next";
import Link from "next/link";
import { AmbientBackdrop } from "@/components/motion/AmbientBackdrop";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { siteConfig } from "@/lib/seo";

export const metadata: Metadata = {
  title: `${siteConfig.name} — Get Paid for What You Know`,
  description: siteConfig.description,
};

const steps = [
  {
    num: "01",
    title: "Create your expert profile",
    body: "Sign up, set up your profile, and pick the plan that matches how many offering types you need. Your page goes live the moment your subscription is active.",
  },
  {
    num: "02",
    title: "List your offerings",
    body: "Add paid Q&A questions, one-on-one sessions, or downloadable resources. Each offering has its own price, description, and settings you control.",
  },
  {
    num: "03",
    title: "Clients pay, you earn",
    body: "Clients find you through Intellink or your shared profile link, pay securely via Korapay, and you get notified instantly. Funds are settled directly to your bank.",
  },
];

const testimonials = [
  {
    quote:
      "Intellink gave me a real monetisation channel for the expertise I was giving away free on Twitter. My first week I closed three paid Q&A sessions.",
    name: "Dr. Adaeze O.",
    role: "Health & Nutrition Expert",
    initials: "AO",
  },
  {
    quote:
      "The resource download feature is a game-changer. I packaged my consulting templates into a PDF and it sells while I sleep. Setup took under an hour.",
    name: "Emeka N.",
    role: "Business Strategy Consultant",
    initials: "EN",
  },
  {
    quote:
      "I tried building my own booking page. It took weeks and still broke. Intellink handled payments, scheduling, and email notifications out of the box.",
    name: "Simi A.",
    role: "UX Design Coach",
    initials: "SA",
  },
];

const starterFeatures = [
  "1 offering type (Q&A, Session, or Resource)",
  "Unlimited client purchases",
  "Korapay secure checkout",
  "Email notifications",
  "Expert profile page",
];

const proFeatures = [
  "All 3 offering types unlocked",
  "Unlimited client purchases",
  "Korapay secure checkout",
  "Priority email notifications",
  "Expert profile page",
  "Resource file hosting",
  "Session booking management",
];

export default function HomePage() {
  return (
    <div className="overflow-x-hidden bg-[#030712] text-slate-300">
      {/* ── HERO ZERO GRAVITY ─────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden min-h-[90vh] flex flex-col justify-center pb-24 pt-32 sm:pb-32 sm:pt-40">
        <AmbientBackdrop variant="hero" />

        <div className="section-shell relative z-10 w-full">
          {/* Headline drifting */}
          <ScrollReveal delay={1} direction="up" className="mx-auto mt-12 max-w-5xl text-center float-card-alt">
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tighter text-white sm:text-7xl lg:text-[5.5rem] animate-float-continuous">
              The platform where your expertise{" "}
              <span className="text-gradient-gold block mt-2 sm:mt-4 pb-2 animate-float-alt">finally pays.</span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl font-medium">
              Intellink lets experts sell paid Q&amp;A, one-on-one sessions, and digital resources — all from a single profile link in a frictionless zero-gravity environment.
            </p>
          </ScrollReveal>

          {/* Floating CTAs */}
          <ScrollReveal delay={3} direction="up" className="mt-14 flex flex-col items-center justify-center gap-4 sm:gap-5 sm:flex-row float-card w-full sm:w-auto px-4 sm:px-0">
            <Link href="/register" className="button-gold-glow w-full sm:w-auto px-10 py-4 text-base sm:px-12 backdrop-blur-md text-center">
              Start earning today
            </Link>
            <Link
              href="/discover"
              className="button-secondary w-full sm:w-auto border-white/10 bg-white/5 text-slate-300 hover:text-white hover:border-white/30 hover:bg-white/10 px-10 py-4 text-base backdrop-blur-md text-center"
            >
              Browse experts
            </Link>
          </ScrollReveal>

          {/* Floating Orbiting Stats */}
          <div className="mx-auto mt-24 grid max-w-4xl grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-12 text-center pointer-events-none">
            {[
              { value: "3", label: "Offering types", delay: 4 },
              { value: "100%", label: "Secure payments", delay: 5 },
              { value: "24h", label: "Setup time", delay: 6 },
            ].map((stat, idx) => (
              <ScrollReveal key={stat.label} delay={stat.delay} direction="scale">
                <div className={`panel border-white/5 bg-white/5 p-6 backdrop-blur-xl animate-float-continuous`} style={{ transform: `translateY(${idx % 2 === 0 ? '-10px' : '10px'})` }}>
                  <p className="text-3xl font-extrabold text-white sm:text-4xl">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm uppercase tracking-widest text-slate-500">{stat.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONSTANTS DIVIDER ─────────────────────────────────── */}
      <div className="py-12" aria-hidden>
        <div className="shimmer-divider opacity-50" />
      </div>

      {/* ── ASYMMETRICAL HOW IT WORKS ────────────────────────────────────── */}
      <section className="section-shell py-20 sm:py-32 relative" id="how-it-works">
        <ScrollReveal direction="scale" className="text-center mb-24">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
            System Workflow
          </p>
          <h2 className="mt-6 text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl tracking-tight">
            Live on the platform in{" "}
            <span className="text-gradient-gold-static block mt-2">three steps.</span>
          </h2>
        </ScrollReveal>

        {/* Floating staggered steps */}
        <div className="relative space-y-16 sm:space-y-32">
          {/* Vertical connecting beam */}
          <div
            className="absolute left-[24px] top-4 bottom-4 w-px hidden sm:block bg-gradient-to-b from-cyan-500/0 via-cyan-500/50 to-cyan-500/0"
            aria-hidden
          />

          {steps.map((step, i) => (
            <ScrollReveal
              key={step.num}
              delay={i * 2 + 1}
              direction={i % 2 !== 0 ? "left" : "right"}
              className={`relative flex flex-col sm:flex-row gap-8 sm:gap-16 items-center ${i % 2 !== 0 ? 'sm:flex-row-reverse' : ''}`}
            >
              {/* Number Node */}
              <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-slate-900 border border-cyan-500/30 text-lg font-bold text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                {step.num}
              </div>
              
              <div className="panel-lift flex-1 p-6 sm:p-12 border-white/5 bg-white/5 backdrop-blur-2xl w-full animate-float-continuous">
                <h3 className="text-2xl font-bold text-white mb-4">
                  {step.title}
                </h3>
                <p className="text-base leading-relaxed text-slate-400">
                  {step.body}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── SHIMMER DIVIDER ─────────────────────────────────── */}
      <div className="py-12" aria-hidden>
        <div className="shimmer-divider opacity-50" />
      </div>

      {/* ── TESTIMONIALS TICKER/GRID ────────────────────────────────────── */}
      <section
        className="section-shell py-20 sm:py-32"
        id="testimonials"
        aria-labelledby="testimonials-heading"
      >
        <ScrollReveal direction="scale" className="text-center mb-16">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-teal-400">
            Signal Received
          </p>
          <h2
            id="testimonials-heading"
            className="mt-6 text-4xl font-extrabold text-white sm:text-5xl"
          >
            Real experts. Real velocity.
          </h2>
        </ScrollReveal>

        <div className="grid gap-6 sm:grid-cols-3">
          {testimonials.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 2 + 1} direction="up" className="h-full">
              <figure
                className={`flex-1 flex h-full flex-col gap-6 sm:gap-8 p-6 sm:p-10 rounded-3xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent animate-float-alt`}
              >
                <div
                  className="absolute right-6 top-6 text-6xl font-serif leading-none text-white/5 select-none"
                  aria-hidden
                >
                  &ldquo;
                </div>

                <blockquote className="relative z-10 flex-1 text-base leading-relaxed text-slate-300">
                  {t.quote}
                </blockquote>

                <figcaption className="flex items-center gap-4 border-t border-white/10 pt-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-sm font-bold text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-base font-bold text-white leading-tight">
                      {t.name}
                    </p>
                    <p className="text-xs tracking-wide text-slate-500 uppercase mt-1">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── SHIMMER DIVIDER ─────────────────────────────────── */}
      <div className="py-12" aria-hidden>
        <div className="shimmer-divider opacity-50" />
      </div>

      {/* ── IMMERSIVE PRICING ─────────────────────────────────── */}
      <section
        className="section-shell py-20 sm:py-32"
        id="pricing"
        aria-labelledby="pricing-heading"
      >
        <ScrollReveal direction="scale" className="text-center mb-16">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-500">
            System Access
          </p>
          <h2
            id="pricing-heading"
            className="mt-6 text-4xl font-extrabold text-white sm:text-5xl"
          >
            One flat fee. Gravity ignored.
          </h2>
        </ScrollReveal>

        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2">
          {/* Starter (Nebula Base) */}
          <ScrollReveal direction="left" delay={2}>
            <div className="panel flex flex-col p-8 sm:p-10 border-white/10 bg-white/5 backdrop-blur-md animate-float-continuous h-full">
              <h3 className="text-2xl font-bold text-white">Starter</h3>
              <p className="mt-4 text-base leading-relaxed text-slate-400">
                Perfect for establishing your orbital presence.
              </p>
              <div className="mt-8 flex items-baseline gap-x-2">
                <span className="text-5xl font-extrabold tracking-tight text-white">
                  {formatCurrency(SUBSCRIPTION_PLANS.starter.price)}
                </span>
                <span className="text-sm font-semibold leading-6 text-slate-500">
                  /month
                </span>
              </div>

              <div className="mt-10 flex-1">
                <ul className="space-y-4 text-sm leading-6 text-slate-300">
                  {starterFeatures.map((feature) => (
                    <li key={feature} className="flex gap-x-3 items-center">
                      <span className="text-cyan-400 text-lg font-bold">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10">
                <Link href="/register" className="button-secondary w-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/30 text-center py-4">
                  Deploy Starter
                </Link>
              </div>
            </div>
          </ScrollReveal>

          {/* Pro (Supernova) */}
          <ScrollReveal direction="right" delay={4}>
            <div className="panel-lift relative flex flex-col border-amber-500/30 bg-gradient-to-b from-slate-900/80 to-[#030712] p-8 sm:p-10 shadow-[0_0_50px_rgba(216,170,57,0.15)] animate-float-alt h-full">
              <div className="absolute right-4 top-4 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-500">
                Maximum Velocity
              </div>
              <h3 className="text-2xl font-bold text-white">Pro</h3>
              <p className="mt-4 text-base leading-relaxed text-slate-400">
                Everything unlocked for immediate asset liquidation.
              </p>
              <div className="mt-8 flex items-baseline gap-x-2">
                <span className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600">
                  {formatCurrency(SUBSCRIPTION_PLANS.pro.price)}
                </span>
                <span className="text-sm font-semibold leading-6 text-slate-500">
                  /month
                </span>
              </div>

              <div className="mt-10 flex-1">
                <ul className="space-y-4 text-sm leading-6 text-slate-300">
                  {proFeatures.map((feature) => (
                    <li key={feature} className="flex gap-x-3 items-center">
                      <span className="text-amber-500 text-lg font-bold drop-shadow-[0_0_5px_rgba(216,170,57,0.8)]">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-10">
                <Link href="/register" className="button-gold-glow w-full text-center py-4 text-lg">
                  Deploy Pro
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}