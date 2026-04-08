"use client";

import { useState, useTransition } from "react";

type ReviewFormProps = {
  reference: string;
  token: string;
  expertName: string;
  offeringTitle: string;
};

export function ReviewForm({
  reference,
  token,
  expertName,
  offeringTitle,
}: ReviewFormProps) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState<{
    stars: number;
    comment: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  if (submitted) {
    return (
      <section className="panel mx-auto max-w-3xl px-6 py-10 text-center sm:px-8 sm:py-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
          Review submitted
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
          Thanks for sharing your experience.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
          Your {submitted.stars}-star review for {expertName}&apos;s {offeringTitle} is
          now part of Intellink&apos;s trust layer.
        </p>
        {submitted.comment ? (
          <p className="mx-auto mt-6 max-w-2xl rounded-[1.5rem] bg-slate-50 px-5 py-4 text-left text-sm leading-7 text-slate-600">
            {submitted.comment}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section className="panel mx-auto max-w-3xl px-6 py-8 sm:px-8 sm:py-10">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
        Leave a review
      </p>
      <h1 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
        How was your experience with {expertName}?
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
        Your review helps other clients know who they can trust before they pay.
      </p>

      <form
        className="mt-8 space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          setMessage("");

          startTransition(async () => {
            const response = await fetch("/api/reviews", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                reference,
                token,
                stars,
                comment,
              }),
            });

            const payload = await response.json();

            if (!response.ok) {
              setMessage(payload.message || "Unable to submit review.");
              return;
            }

            setSubmitted({
              stars,
              comment: comment.trim(),
            });
          });
        }}
      >
        <div>
          <p className="text-sm font-semibold text-slate-700">Star rating</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {[1, 2, 3, 4, 5].map((value) => {
              const active = stars === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStars(value)}
                  className={
                    active
                      ? "rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white"
                      : "rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-950 hover:text-slate-950"
                  }
                >
                  {value} star{value === 1 ? "" : "s"}
                </button>
              );
            })}
          </div>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-slate-700">
            Tell other clients what worked for you
          </span>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={5}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
            placeholder="What did you gain, learn, or find useful?"
          />
        </label>

        <div className="stack-actions">
          <span className="text-sm text-slate-500">{message}</span>
          <button
            type="submit"
            disabled={isPending}
            className="button-primary button-block-mobile disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Submitting..." : "Submit review"}
          </button>
        </div>
      </form>
    </section>
  );
}
