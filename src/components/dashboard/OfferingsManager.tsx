"use client";

import { useState, useTransition } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";
import { OFFERING_TYPE_OPTIONS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { type OfferingType } from "@/types";

type OfferingRecord = {
  id: string;
  type: OfferingType;
  title: string;
  description: string;
  price: number;
  is_active: boolean;
  created_at: string;
  file_url?: string | null;
};

type OfferingsManagerProps = {
  plan: "starter" | "pro";
  offerings: OfferingRecord[];
};

export function OfferingsManager({
  plan,
  offerings: initialOfferings,
}: OfferingsManagerProps) {
  const [offerings, setOfferings] = useState(initialOfferings);
  const [type, setType] = useState<OfferingType>("qa");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const existingTypes = new Set(offerings.map((offering) => offering.type));
  const starterLock =
    plan === "starter" && existingTypes.size > 0 && !existingTypes.has(type);

  return (
    <div className="space-y-8">
      <form
        className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.45)] sm:p-8"
        onSubmit={(event) => {
          event.preventDefault();
          setMessage("");

          startTransition(async () => {
            let fileUrl: string | null = null;

            if (type === "resource") {
              if (!file) {
                setMessage("Upload a file for your resource.");
                return;
              }

              const supabase = getBrowserSupabaseClient();
              const fileName = `resources/${Date.now()}-${file.name}`;
              const { error: uploadError } = await supabase.storage
                .from("resources")
                .upload(fileName, file, { upsert: true });

              if (uploadError) {
                setMessage(uploadError.message);
                return;
              }

              fileUrl = fileName;
            }

            const response = await fetch("/api/offerings", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                type,
                title,
                description,
                price: Number(price),
                file_url: fileUrl,
              }),
            });

            const payload = await response.json();

            if (!response.ok) {
              setMessage(payload.message || "Unable to create offering.");
              return;
            }

            setOfferings((current) => [payload.data.offering, ...current]);
            setTitle("");
            setDescription("");
            setPrice("");
            setFile(null);
            setType(plan === "starter" ? type : "qa");
            setMessage("Offering created successfully.");
          });
        }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
              Create offering
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">
              Publish what clients can buy
            </h2>
          </div>
          <div className="self-start rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
            {plan === "pro"
              ? "Pro plan: all offering types unlocked"
              : "Starter plan: one offering type only"}
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Type</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as OfferingType)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
            >
              {Object.values(OFFERING_TYPE_OPTIONS).map((option) => {
                const disabled =
                  plan === "starter" &&
                  existingTypes.size > 0 &&
                  !existingTypes.has(option.id);

                return (
                  <option key={option.id} value={option.id} disabled={disabled}>
                    {option.shortName}
                  </option>
                );
              })}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Price</span>
            <input
              type="number"
              min="0"
              step="500"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
              placeholder="3500"
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-700">Title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
            placeholder="30-minute growth strategy session"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-700">
            Description
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            required
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
            placeholder="Tell clients exactly what they get, how fast they get it, and why it is worth paying for."
          />
        </label>

        {type === "resource" ? (
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Resource file
            </span>
            <input
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            />
          </label>
        ) : null}

        <div className="stack-actions">
          <span className="text-sm text-slate-500">
            {starterLock
              ? "Starter lets you stay within your first offering type."
              : message}
          </span>
          <button
            type="submit"
            disabled={isPending}
            className="button-block-mobile rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Create offering"}
          </button>
        </div>
      </form>

      <div className="grid gap-5 lg:grid-cols-2">
        {offerings.map((offering) => (
          <article
            key={offering.id}
            className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.45)]"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
                  {OFFERING_TYPE_OPTIONS[offering.type].shortName}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">
                  {offering.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  startTransition(async () => {
                    const response = await fetch(
                      `/api/offerings/${offering.id}`,
                      {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          is_active: !offering.is_active,
                        }),
                      },
                    );

                    const payload = await response.json();

                    if (!response.ok) {
                      setMessage(payload.message || "Unable to update offering.");
                      return;
                    }

                    setOfferings((current) =>
                      current.map((item) =>
                        item.id === offering.id ? payload.data.offering : item,
                      ),
                    );
                    setMessage("Offering updated successfully.");
                  });
                }}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  offering.is_active
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {offering.is_active ? "Active" : "Inactive"}
              </button>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              {offering.description}
            </p>

            <div className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-lg font-semibold text-slate-950">
                {formatCurrency(offering.price)}
              </span>
              <span className="text-sm text-slate-500">
                Created {formatDate(offering.created_at)}
              </span>
            </div>
          </article>
        ))}
      </div>

      {offerings.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-slate-500 sm:px-8 sm:py-12">
          No offerings yet. Publish your first paid product to start earning.
        </div>
      ) : null}
    </div>
  );
}
