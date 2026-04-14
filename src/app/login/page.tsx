"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { applyBrowserSession } from "@/lib/browser-auth";
import { AmbientBackdrop } from "@/components/motion/AmbientBackdrop";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [nextPath, setNextPath] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setNextPath(new URLSearchParams(window.location.search).get("next") ?? "");
  }, []);

  return (
    <main className="section-shell relative flex flex-1 items-center justify-center py-8 lg:py-16">
      <AmbientBackdrop variant="dashboard" />
      <ScrollReveal delay={1} direction="up" className="relative z-10 mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[0.85fr,1.15fr] animate-float-continuous w-full">
        <section className="panel-lift flex flex-col justify-center border-white/10 bg-black/40 backdrop-blur-2xl p-8 sm:p-12 h-full">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
            Welcome back
          </p>
          <h1 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
            Sign in and check your subscription status.
          </h1>
          <p className="mt-6 text-base leading-relaxed text-slate-400 sm:text-lg">
            Active experts go straight to the dashboard. Inactive experts are
            guided to renewal before they can publish or sell again.
          </p>
        </section>

        <section className="panel-lift border-white/5 bg-gradient-to-b from-slate-900/80 to-[#030712]/90 backdrop-blur-3xl p-8 sm:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="stack-actions">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-500">
                Login
              </p>
              <h2 className="mt-2 text-3xl font-bold text-white">
                Access your account
              </h2>
            </div>
            <Link
              href="/"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Back home
            </Link>
          </div>

          <form
            className="mt-8 space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              setMessage("");

              startTransition(async () => {
                const response = await fetch("/api/auth/login", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    email,
                    password,
                  }),
                });

                const payload = await response.json();

                if (!response.ok) {
                  setMessage(payload.message || "Unable to sign in.");
                  return;
                }

                await applyBrowserSession({
                  access_token: payload.data.access_token,
                  refresh_token: payload.data.refresh_token,
                });

                if (payload.data.subscription_status === "active" && nextPath) {
                  router.push(nextPath);
                } else if (payload.data.subscription_status === "active") {
                  router.push("/dashboard");
                } else {
                  router.push("/pricing");
                }

                router.refresh();
              });
            }}
          >
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-300">
                Email or username
              </span>
              <input
                type="text"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none transition focus:border-amber-500/50 focus:bg-white/5 focus:shadow-[0_0_15px_rgba(216,170,57,0.15)] placeholder:text-slate-600"
                placeholder="you@example.com or @yourname"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-300">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none transition focus:border-amber-500/50 focus:bg-white/5 focus:shadow-[0_0_15px_rgba(216,170,57,0.15)]"
              />
            </label>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-amber-500 hover:text-amber-400 transition-colors drop-shadow-md"
              >
                Forgot password?
              </Link>
            </div>

            {message ? (
              <p className="text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">{message}</p>
            ) : null}

            <div className="stack-actions pt-2">
              <span />
              <button
                type="submit"
                disabled={isPending}
                className="button-gold-glow w-full sm:w-auto px-10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>

          <p className="mt-8 text-sm text-slate-400 text-center sm:text-left">
            Need an account?{" "}
            <Link href="/register" className="font-semibold text-white hover:text-cyan-400 transition-colors">
              Register here
            </Link>
          </p>
        </section>
      </ScrollReveal>
    </main>
  );
}
