"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { applyBrowserSession } from "@/lib/browser-auth";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    promoCode: "",
  });
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <main className="section-shell relative flex flex-1 items-center justify-center py-6">
      <ScrollReveal delay={1} direction="up" className="relative z-10 mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.95fr,1.05fr]">
        
        <section className="panel-lift hidden lg:flex flex-col justify-center border-white/10 bg-black/40 backdrop-blur-2xl p-8 sm:p-12 text-white">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-500">
            Expert onboarding
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl tracking-tight">
            Create your premium expert account.
          </h1>
          <p className="mt-6 text-base leading-relaxed text-slate-400 sm:text-lg">
            Register once and launch a public profile that sells your knowledge directly in a zero-gravity environment.
          </p>
          <div className="mt-10 space-y-4 text-sm leading-7 text-slate-300">
            <p className="flex items-center gap-3">
              <span className="font-bold text-amber-500">✓</span>
              <span><span className="font-semibold text-white">Promo: BRYAN</span> = Free Pro month (first 20 users)</span>
            </p>
            <p className="flex items-center gap-3">
              <span className="font-bold text-cyan-400">✓</span>
              <span>No free tier. No trial. Premium only.</span>
            </p>
            <p className="flex items-center gap-3">
              <span className="font-bold text-cyan-400">✓</span>
              <span>Inactive subscriptions hide profile automatically.</span>
            </p>
            <p className="flex items-center gap-3">
              <span className="font-bold text-amber-500">✓</span>
              <span>Pro unlocks Q&A, Sessions, Resources.</span>
            </p>
          </div>
        </section>

        {/* Form Column */}
        <section className="panel-lift border-white/5 bg-[#0d1117] p-6 sm:p-10">
          <div className="stack-actions">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-500">
                Register
              </p>
              <h2 className="mt-2 text-3xl font-bold text-white">
                Open your account
              </h2>
            </div>
            <Link href="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Back home
            </Link>
          </div>

          <form className="mt-8 space-y-6" onSubmit={async (event) => {
            event.preventDefault();
            setMessage("");

            if (form.password !== form.confirmPassword) {
              setMessage("Passwords do not match.");
              return;
            }

            startTransition(async () => {
              const body = {
                name: form.name.trim(),
                email: form.email.trim().toLowerCase(),
                username: form.username.toLowerCase(),
                password: form.password,
                ...(form.promoCode.trim().toUpperCase() === 'BRYAN' && { promo_code: 'BRYAN' }),
              };

              const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              });

              const payload = await response.json();

              if (!response.ok) {
                setMessage(payload.message || "Unable to create account.");
                return;
              }

              await applyBrowserSession({
                access_token: payload.data.access_token,
                refresh_token: payload.data.refresh_token,
              });

              router.push(payload.data.is_free_month ? '/dashboard' : '/pricing');
              router.refresh();
            });
          }}>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-300">Full name</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 text-white outline-none transition focus:border-white/30 placeholder:text-slate-600"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-300">Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none transition focus:border-cyan-400/50 focus:bg-white/5 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] placeholder:text-slate-600"
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-300">Username</span>
              <input
                value={form.username}
                onChange={(e) => setForm({...form, username: e.target.value})}
                required
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 text-white outline-none transition focus:border-white/30 placeholder:text-slate-600"
                placeholder="coachmira"
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-300">Password</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({...form, password: e.target.value})}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 text-white outline-none transition focus:border-white/30"
                  minLength={8}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-300">Confirm password</span>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({...form, confirmPassword: e.target.value})}
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 text-white outline-none transition focus:border-white/30"
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-300">Promo Code <span className="text-amber-500 font-normal opacity-80">(BRYAN = Free Pro)</span></span>
              <input
                value={form.promoCode}
                onChange={(e) => setForm({...form, promoCode: e.target.value})}
                placeholder="BRYAN"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 text-white outline-none transition focus:border-white/30 placeholder:text-slate-600"
              />
            </label>

            <div className="stack-actions pt-2">
              {message ? (
                 <span className="text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">{message}</span>
              ) : <span />}
              <button
                type="submit"
                disabled={isPending}
                className="button-gold w-full sm:w-auto px-10 disabled:cursor-not-allowed disabled:opacity-60 h-12"
              >
                {isPending ? "Creating Account..." : "Create Account"}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center sm:text-left text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-white hover:text-cyan-400 transition-colors">
              Sign in
            </Link>
          </p>
        </section>
      </ScrollReveal>
    </main>
  );
}
