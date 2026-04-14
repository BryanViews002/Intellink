"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";
import { AmbientBackdrop } from "@/components/motion/AmbientBackdrop";
import { ScrollReveal } from "@/components/motion/ScrollReveal";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setSessionReady(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionReady(true);
      }
    });

    const timeout = setTimeout(() => {
      setSessionReady((current) => {
        if (!current) {
          setSessionError(true);
        }
        return current;
      });
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (sessionError) {
    return (
      <main className="section-shell relative flex min-h-[90vh] items-center justify-center py-12 sm:py-24">
        <AmbientBackdrop variant="pricing" />
        <section className="panel-lift relative z-10 border-white/5 bg-gradient-to-b from-slate-900/80 to-[#030712]/90 backdrop-blur-3xl p-8 sm:p-12 mx-auto max-w-2xl text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-float-continuous">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]">
            Invalid link
          </p>
          <h1 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
            This reset link has expired.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
            Password reset links expire after one hour. Please request a new one from the orbit terminal.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-5 sm:flex-row">
            <Link href="/forgot-password" className="button-gold-glow px-10 py-4">
              Request new link
            </Link>
            <Link href="/login" className="button-secondary border-white/10 bg-white/5 text-slate-300 hover:text-white px-10 py-4">
              Back to login
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!sessionReady) {
    return (
      <main className="section-shell relative flex min-h-[90vh] items-center justify-center py-12 sm:py-24">
        <AmbientBackdrop variant="dashboard" />
        <section className="panel-lift relative z-10 border-white/5 bg-gradient-to-b from-slate-900/80 to-[#030712]/90 backdrop-blur-3xl p-8 sm:p-12 mx-auto max-w-2xl text-center shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-float-continuous">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
            Verifying
          </p>
          <h1 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
            Verifying your security credentials...
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-400">
            Please wait while we establish a secure connection.
          </p>
          <div className="mt-8 flex justify-center">
            <span className="inline-block h-4 w-4 rounded-full bg-cyan-400 animate-ping shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
          </div>
        </section>
      </main>
    );
  }

  if (success) {
    return (
      <main className="section-shell relative flex min-h-[90vh] items-center justify-center py-12 sm:py-24">
        <AmbientBackdrop variant="hero" />
        <section className="panel-lift relative z-10 border-white/5 bg-gradient-to-b from-emerald-900/40 to-[#030712]/90 backdrop-blur-3xl p-8 sm:p-12 mx-auto max-w-2xl text-center shadow-[0_0_50px_rgba(16,185,129,0.2)] animate-float-continuous">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">
            Security updated
          </p>
          <h1 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
            Password synchronized successfully.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Your connection parameters have been updated. You can now sign in to your dashboard.
          </p>
          <div className="mt-10">
            <Link href="/login" className="button-gold-glow px-12 py-4 text-lg">
              Sign in
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="section-shell relative flex flex-1 items-center justify-center py-8 lg:py-16">
      <AmbientBackdrop variant="hero" />
      <ScrollReveal delay={1} direction="up" className="relative z-10 mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[0.85fr,1.15fr] animate-float-continuous w-full">
        <section className="panel-lift flex flex-col justify-center border-white/10 bg-black/40 backdrop-blur-2xl p-8 sm:p-12 h-full text-white">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-amber-500 drop-shadow-[0_0_8px_rgba(216,170,57,0.8)]">
            Reset password
          </p>
          <h1 className="mt-4 text-3xl font-extrabold leading-tight sm:text-4xl tracking-tight">
            Establish new security connection.
          </h1>
          <p className="mt-6 text-base leading-relaxed text-slate-400 sm:text-lg">
            Pick a secure access key (minimum 8 characters). Once active, your old key will be permanently invalidated across the grid.
          </p>
        </section>

        <section className="panel-lift border-white/5 bg-gradient-to-b from-slate-900/80 to-[#030712]/90 backdrop-blur-3xl p-8 sm:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400">
              New password
            </p>
            <h2 className="mt-2 text-3xl font-bold text-white">
              Set new access key
            </h2>
          </div>

          <form
            className="mt-8 space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              setMessage("");

              if (password !== confirmPassword) {
                setMessage("Passwords do not match.");
                return;
              }

              if (password.length < 8) {
                setMessage("Password must be at least 8 characters.");
                return;
              }

              startTransition(async () => {
                const supabase = getBrowserSupabaseClient();

                const { error } = await supabase.auth.updateUser({
                  password,
                });

                if (error) {
                  setMessage(
                    error.message || "Unable to update password. Please try again.",
                  );
                  return;
                }

                setSuccess(true);
              });
            }}
          >
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-300">
                New password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={8}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none transition focus:border-cyan-400/50 focus:bg-white/5 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)]"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-300">
                Confirm new password
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none transition focus:border-cyan-400/50 focus:bg-white/5 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)]"
              />
            </label>

            {message ? (
              <p className="text-sm text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 pb-0 border-0 bg-transparent">{message}</p>
            ) : null}

            <div className="stack-actions pt-4">
              <span />
              <button
                type="submit"
                disabled={isPending}
                className="button-gold-glow w-full sm:w-auto px-10 h-14 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Connecting..." : "Update access key"}
              </button>
            </div>
          </form>
        </section>
      </ScrollReveal>
    </main>
  );
}
