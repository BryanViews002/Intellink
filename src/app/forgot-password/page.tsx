"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { AmbientBackdrop } from "@/components/motion/AmbientBackdrop";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <main className="section-shell relative flex flex-1 items-center justify-center py-8 lg:py-16">
      <AmbientBackdrop variant="dashboard" />
      <ScrollReveal delay={1} direction="up" className="relative z-10 mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[0.85fr,1.15fr] animate-float-continuous w-full">
        <section className="panel-lift flex flex-col justify-center border-white/10 bg-black/40 backdrop-blur-2xl p-8 sm:p-12 h-full text-white">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
            Account recovery
          </p>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl tracking-tight">
            Reset your password and get back to business.
          </h1>
          <p className="mt-6 text-base leading-relaxed text-slate-400 sm:text-lg">
            Enter your email or username and we will send you a secure link to
            create a new password. The link expires after 1 hour.
          </p>
          <div className="mt-10 space-y-4 text-sm leading-7 text-slate-500">
            <p className="flex items-center gap-3">
              <span className="font-bold text-amber-500">✓</span>
              <span>Check your spam folder if you do not see the email.</span>
            </p>
            <p className="flex items-center gap-3">
              <span className="font-bold text-cyan-400">✓</span>
              <span>Only registered expert accounts can reset passwords.</span>
            </p>
          </div>
        </section>

        <section className="panel-lift border-white/5 bg-gradient-to-b from-slate-900/80 to-[#030712]/90 backdrop-blur-3xl p-8 sm:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="stack-actions">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-500">
                Forgot password
              </p>
              <h2 className="mt-2 text-3xl font-bold text-white">
                Request a reset link
              </h2>
            </div>
            <Link
              href="/login"
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Back to login
            </Link>
          </div>

          {success ? (
            <div className="mt-8 rounded-2xl bg-cyan-900/20 border border-cyan-400/30 px-6 py-8 backdrop-blur-md">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">
                Email sent
              </p>
              <p className="mt-4 text-base leading-relaxed text-slate-300">
                {message}
              </p>
              <div className="mt-8">
                <Link href="/login" className="button-gold-glow px-10 py-4 w-full sm:w-auto text-center">
                  Return to login
                </Link>
              </div>
            </div>
          ) : (
            <form
              className="mt-8 space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                setMessage("");

                startTransition(async () => {
                  const response = await fetch("/api/auth/forgot-password", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email }),
                  });

                  const payload = await response.json();

                  if (!response.ok) {
                    setMessage(payload.message || "Something went wrong.");
                    return;
                  }

                  setSuccess(true);
                  setMessage(
                    payload.message ||
                      "If an account exists, a reset link has been sent to your email.",
                  );
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
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none transition focus:border-cyan-400/50 focus:bg-white/5 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] placeholder:text-slate-600"
                  placeholder="you@example.com or @yourname"
                />
              </label>

              {message && (
                <p className="text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 pb-0 border-0 bg-transparent">{message}</p>
              )}

              <div className="stack-actions pt-4">
                <span />
                <button
                  type="submit"
                  disabled={isPending}
                  className="button-gold-glow w-full sm:w-auto px-10 h-14 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? "Sending..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          )}
        </section>
      </ScrollReveal>
    </main>
  );
}
