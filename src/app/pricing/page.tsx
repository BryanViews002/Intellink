"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AmbientBackdrop } from "@/components/motion/AmbientBackdrop";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { type SubscriptionPlan } from "@/types";

export default function PricingPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <main className="section-shell relative flex min-h-screen flex-col items-center justify-center py-12 sm:py-20">
      <AmbientBackdrop variant="hero" />
      
      <div className="relative z-10 w-full max-w-6xl px-6 md:px-8">
        <div className="text-center rise-in">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400">
            Subscription plans
          </p>
          <h1 className="mt-4 text-4xl font-extrabold text-white sm:text-5xl md:text-6xl tracking-tight">
            Keep your profile <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-amber-300">live.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
            Choose the monthly tier that best fits your audience size and feature needs.
          </p>
        </div>

        {message && (
          <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-rose-500/20 bg-rose-500/10 px-6 py-4 text-center text-sm font-medium text-rose-400 rise-in">
            {message}
          </div>
        )}

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {Object.values(SUBSCRIPTION_PLANS).map((plan, index) => (
            <article
              key={plan.id}
              className={`panel-lift relative flex flex-col overflow-hidden p-8 sm:p-12 transition-all duration-500 hover:-translate-y-2 ${
                plan.featured
                  ? "rise-in delay-2 border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-[#0d1117] shadow-[0_0_50px_rgba(245,158,11,0.15)]"
                  : `rise-in glass-card border-white/5 bg-[#0d1117]/80 backdrop-blur-2xl ${index % 2 === 0 ? "delay-1 float-card-alt" : "delay-3 float-card"}`
              }`}
            >
              <div className="flex-1">
                <p className={`text-sm font-bold uppercase tracking-[0.2em] ${plan.featured ? "text-amber-400" : "text-cyan-400"}`}>
                  {plan.name}
                  {plan.featured && <span className="ml-3 inline-block rounded-full bg-amber-500/20 px-3 py-1 text-[10px] tracking-widest border border-amber-500/30">POPULAR</span>}
                </p>
                <div className="mt-6 flex items-baseline text-5xl font-extrabold text-white">
                  {formatCurrency(plan.price)}
                  <span className="ml-2 text-xl font-medium text-slate-500">/mo</span>
                </div>
                <p className="mt-6 text-base leading-relaxed text-slate-400">
                  {plan.description}
                </p>
                
                <div className="my-8 h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
                
                <ul className="space-y-4 text-sm leading-relaxed text-slate-300">
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-amber-500 mt-0.5">✓</span>
                    <span>{plan.tagline}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-cyan-400 mt-0.5">✓</span>
                    <span>
                      {plan.id === "starter"
                        ? "Limited to 1 active offering type"
                        : "Unlock Q&A, Sessions, and Digital Resources"}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-bold text-cyan-400 mt-0.5">✓</span>
                    <span>Automated payment splitting and instant dashboard statistics</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  setSelectedPlan(plan.id);

                  startTransition(async () => {
                    const supabase = getBrowserSupabaseClient();
                    const {
                      data: { user },
                    } = await supabase.auth.getUser();

                    if (!user) {
                      router.push("/register");
                      return;
                    }

                    const response = await fetch("/api/subscription/initialize", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        plan: plan.id,
                      }),
                    });

                    const payload = await response.json();

                    if (!response.ok) {
                      setMessage(payload.message || "Unable to start checkout.");
                      return;
                    }

                    const checkoutUrl = payload.data?.checkout_url;

                    if (!checkoutUrl) {
                      setMessage("No checkout URL returned.");
                      return;
                    }

                    window.location.href = checkoutUrl;
                  });
                }}
                disabled={isPending}
                className={`mt-10 w-full py-5 text-base h-auto ${
                  plan.featured
                    ? "button-gold-glow disabled:cursor-not-allowed disabled:opacity-60"
                    : "button-secondary border-white/10 bg-white/5 text-slate-200 hover:text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                }`}
              >
                {isPending && selectedPlan === plan.id
                  ? (
                    <span className="flex items-center justify-center gap-2">
                       <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                       Preparing...
                    </span>
                  )
                  : `Select ${plan.name} Plan`}
              </button>
            </article>
          ))}
        </div>
        
        <div className="mt-12 text-center rise-in delay-3">
          <Link
            href="/"
            className="text-sm font-medium text-slate-500 hover:text-white transition-colors"
          >
            ← Back to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
