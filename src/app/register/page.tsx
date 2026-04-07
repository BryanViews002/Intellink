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
            Register once, pick a plan immediately, and launch a public profile
            that sells your knowledge directly.
          </p>
          <div className="mt-10 space-y-4 text-sm leading-7 text-slate-300">
            <p>No free tier. No trial. Straight premium.</p>
            <p>Inactive subscriptions hide the profile and disable purchases.</p>
            <p>Starter begins at one offering type, Pro unlocks all three.</p>
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

              if (form.password !== form.confirmPassword) {
                setMessage("Passwords do not match.");
                return;
              }

              startTransition(async () => {
                const response = await fetch("/api/auth/register", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    username: form.username,
                    password: form.password,
                  }),
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

                router.push("/pricing");
                router.refresh();
              });
            }}
          >
            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Name</span>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                />
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">Username</span>
              <input
                value={form.username}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    username: event.target.value.toLowerCase(),
                  }))
                }
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                placeholder="coachmira"
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Password
                </span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Confirm password
                </span>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }))
                  }
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
                />
              </label>
            </div>

            <div className="stack-actions">
              <span className="text-sm text-slate-500">{message}</span>
              <button
                type="submit"
                disabled={isPending}
                className="button-primary button-block-mobile disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Creating..." : "Create account"}
              </button>
            </div>
          </form>

          <p className="mt-8 text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-slate-950">
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
