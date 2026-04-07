"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type AnswerQuestionFormProps = {
  questionId: string;
  questionText: string;
  clientName: string;
};

export function AnswerQuestionForm({
  questionId,
  questionText,
  clientName,
}: AnswerQuestionFormProps) {
  const router = useRouter();
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage("");

        startTransition(async () => {
          const response = await fetch("/api/questions/answer", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              question_id: questionId,
              answer_text: answer,
            }),
          });

          const payload = await response.json();

          if (!response.ok) {
            setMessage(payload.message || "Unable to send answer.");
            return;
          }

          setAnswer("");
          setMessage("Answer sent successfully.");
          router.refresh();
        });
      }}
    >
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
          {clientName}
        </p>
        <p className="text-base leading-7 text-slate-700">{questionText}</p>
      </div>

      <textarea
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        required
        rows={4}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
        placeholder="Write a clear, valuable answer..."
      />

      <div className="stack-actions">
        <span className="text-sm text-slate-500">{message}</span>
        <button
          type="submit"
          disabled={isPending}
          className="button-block-mobile rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Sending..." : "Send answer"}
        </button>
      </div>
    </form>
  );
}
