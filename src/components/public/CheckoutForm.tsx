"use client";

import { useState, useTransition } from "react";
import { OFFERING_TYPE_OPTIONS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { type OfferingType } from "@/types";

type CheckoutFormProps = {
  offering: {
    id: string;
    title: string;
    description: string;
    price: number;
    type: OfferingType;
  };
  expert: {
    name: string;
    username: string;
  };
};

export function CheckoutForm({ offering, expert }: CheckoutFormProps) {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const typeLabel = OFFERING_TYPE_OPTIONS[offering.type].shortName;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.45)] sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
          {typeLabel}
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950 sm:text-3xl">
          {offering.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
          {offering.description}
        </p>

        <div className="mt-8 rounded-[1.5rem] bg-slate-950 p-6 text-white">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-300">
            Sold by
          </p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xl font-semibold">{expert.name}</p>
              <p className="text-sm text-slate-300">@{expert.username}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-sm text-slate-300">Total</p>
              <p className="text-3xl font-semibold text-amber-300">
                {formatCurrency(offering.price)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <form
        className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.45)] sm:p-8"
        onSubmit={(event) => {
          event.preventDefault();
          setMessage("");

          startTransition(async () => {
            const response = await fetch("/api/transaction/initialize", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                offering_id: offering.id,
                client_name: clientName,
                client_email: clientEmail,
                question_text: offering.type === "qa" ? questionText : undefined,
                preferred_time:
                  offering.type === "session" ? preferredTime : undefined,
              }),
            });

            const payload = await response.json();

            if (!response.ok) {
              setMessage(payload.message || "Unable to start payment.");
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
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
            Client details
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Complete your purchase
          </h2>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-700">Name</span>
          <input
            value={clientName}
            onChange={(event) => setClientName(event.target.value)}
            required
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-700">Email</span>
          <input
            type="email"
            value={clientEmail}
            onChange={(event) => setClientEmail(event.target.value)}
            required
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
          />
        </label>

        {offering.type === "qa" ? (
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Your question
            </span>
            <textarea
              value={questionText}
              onChange={(event) => setQuestionText(event.target.value)}
              required
              rows={5}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
            />
          </label>
        ) : null}

        {offering.type === "session" ? (
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Preferred time
            </span>
            <input
              type="datetime-local"
              value={preferredTime}
              onChange={(event) => setPreferredTime(event.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
            />
          </label>
        ) : null}

        <p className="text-sm leading-6 text-slate-500">
          You will be redirected to Korapay to complete the payment securely.
        </p>

        <div className="stack-actions">
          <span className="text-sm text-slate-500">{message}</span>
          <button
            type="submit"
            disabled={isPending}
            className="button-block-mobile rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending
              ? "Redirecting..."
              : `Pay ${formatCurrency(offering.price)}`}
          </button>
        </div>
      </form>
    </div>
  );
}
