"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { applyBrowserSession } from "@/lib/browser-auth";

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
    <main className="section-shell flex min-h-screen items-center py-8 sm:py-12">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.95fr,1.05fr]">
        <section className="panel bg-slate-950 p-8 text-white sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
            Expert onboarding
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">
            Create your premium expert account.
          </h1>
          <p className="mt-6 text-base leading-8 text-slate-300 sm:text-lg">
            Register once and launch a public profile that sells your knowledge directly.
          </p>
          <div className="mt-10 space-y-4 text-sm leading-7 text-slate-300">
            <p><span className="font-semibold text-amber-200">Promo: BRYAN</span> = Free Pro month (first 20 users)</p>
            <p>No free tier. No trial. Premium only.</p>
            <p>Inactive subscriptions hide profile automatically.</p>
            <p>Pro unlocks Q&A, Sessions, Resources.</p>
          </div>
        </section>

        <section className="panel p-6 sm:p-10">
          <div className="stack-actions">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
                Register
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">
                Open your account
              </h2>
            </div>
            <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-950">
              Back home
            </Link>
          </div>

          <form className="mt-8 space-y-5" onSubmit={async (event) => {
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
                <span className="text-sm font-semibold text-slate-700">Full name</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Username</span>
              <input
                value={form.username}
                onChange={(e) => setForm({...form, username: e.target.value})}
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                placeholder="coachmira"
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Password</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({...form, password: e.target.value})}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                  minLength={8}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Confirm password</span>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({...form, confirmPassword: e.target.value})}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Promo Code <span className="text-amber-600 font-normal">(BRYAN = Free Pro)</span></span>
              <input
                value={form.promoCode}
                onChange={(e) => setForm({...form, promoCode: e.target.value})}
                placeholder="BRYAN"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 focus:bg-white"
              />
            </label>

            <div className="stack-actions">
              <span className="text-sm text-slate-500">{message}</span>
              <button
                type="submit"
                disabled={isPending}
                className="button-primary button-block-mobile disabled:cursor-not-allowed disabled:opacity-60 h-12"
              >
                {isPending ? "Creating Account..." : "Create Account"}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account? <Link href="/login" className="font-semibold text-slate-950 hover:underline">Sign in</Link>
          </p>
        </section>
      </div>
    </main>
  );
}

