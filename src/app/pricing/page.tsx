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
    <main className="section-shell page-enter py-8 sm:py-10">
      <div className="panel motion-shell overflow-hidden bg-slate-950 text-white">
        <AmbientBackdrop variant="pricing" />
        <div className="relative z-10 flex flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="rise-in">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
              Subscription plans
            </p>
            <h1 className="mt-2 text-3xl font-semibold sm:text-4xl md:text-5xl">
              Choose the plan that keeps you live.
            </h1>
          </div>
          <Link
            href="/"
            className="button-secondary button-block-mobile rise-in delay-1 self-start md:self-auto"
          >
            Back home
          </Link>
        </div>

        <div className="relative z-10 grid gap-6 px-6 pb-10 md:grid-cols-2 md:px-8">
          {Object.values(SUBSCRIPTION_PLANS).map((plan, index) => (
            <article
              key={plan.id}
              className={`rounded-[2rem] border p-6 sm:p-8 ${
                plan.featured
                  ? "rise-in delay-2 float-card border-amber-300 bg-white text-slate-950"
                  : `rise-in glass-card border-white/10 text-white ${index % 2 === 0 ? "delay-1 float-card-alt" : "delay-3 float-card"}`
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
              <p className="mt-4 text-base leading-8 text-slate-500">
                {plan.description}
              </p>
              <ul className="mt-6 space-y-3 text-sm leading-7">
                <li>{plan.tagline}</li>
                <li>
                  {plan.id === "starter"
                    ? "Create one offering type only"
                    : "Unlock Q&A, Session, and Resource"}
                </li>
                <li>Inactive subscriptions hide your profile automatically</li>
              </ul>
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
                className={
                  plan.featured
                    ? "button-gold mt-8 w-full disabled:cursor-not-allowed disabled:opacity-60"
                    : "button-secondary mt-8 w-full disabled:cursor-not-allowed disabled:opacity-60"
                }
              >
                {isPending && selectedPlan === plan.id
                  ? "Preparing checkout..."
                  : `Choose ${plan.name}`}
              </button>
            </article>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-3xl text-center text-sm text-slate-500">
        {message}
      </div>
    </main>
  );
}
