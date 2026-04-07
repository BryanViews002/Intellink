"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { applyBrowserSession } from "@/lib/browser-auth";

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
    <main className="section-shell flex min-h-screen items-center py-8 sm:py-12">
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[0.85fr,1.15fr]">
        <section className="panel bg-white/70 p-8 backdrop-blur sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
            Welcome back
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
            Sign in and check your subscription status.
          </h1>
          <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
            Active experts go straight to the dashboard. Inactive experts are
            guided to renewal before they can publish or sell again.
          </p>
        </section>

        <section className="panel p-8 sm:p-10">
          <div className="stack-actions">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
                Login
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">
                Access your account
              </h2>
            </div>
            <Link
              href="/"
              className="text-sm font-medium text-slate-500 hover:text-slate-950"
            >
              Back home
            </Link>
          </div>

          <form
            className="mt-8 space-y-5"
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
              <span className="text-sm font-semibold text-slate-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
              />
            </label>

            <div className="stack-actions">
              <span className="text-sm text-slate-500">{message}</span>
              <button
                type="submit"
                disabled={isPending}
                className="button-primary button-block-mobile disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>

          <p className="mt-8 text-sm text-slate-500">
            Need an account?{" "}
            <Link href="/register" className="font-semibold text-slate-950">
              Register here
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
