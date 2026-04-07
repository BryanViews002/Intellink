import Link from "next/link";
import { AnswerQuestionForm } from "@/components/dashboard/AnswerQuestionForm";
import { AmbientBackdrop } from "@/components/motion/AmbientBackdrop";
import { getDashboardData, requireVerifiedDashboardUser } from "@/lib/data";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";

export default async function DashboardPage() {
  const { profile } = await requireVerifiedDashboardUser();
  const dashboard = await getDashboardData(profile.id);

  if (!dashboard) {
    return null;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const profileUrl = `${baseUrl}/${dashboard.profile.username}`;

  return (
    <main className="section-shell page-enter space-y-8 py-6 sm:py-8">
      <section className="grid gap-5 lg:grid-cols-[1.2fr,0.8fr]">
        <article className="panel motion-shell rise-in overflow-hidden bg-slate-950 p-6 text-white sm:p-8">
          <AmbientBackdrop variant="dashboard" />
          <div className="relative z-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
              Subscription status
            </p>
            <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-3xl font-semibold capitalize sm:text-4xl">
                  {dashboard.profile.subscription_plan} plan
                </h2>
                <p className="mt-3 text-base leading-7 text-slate-300">
                  Expires on {formatDate(dashboard.profile.subscription_expires_at)}.
                  You have {dashboard.daysRemaining} day
                  {dashboard.daysRemaining === 1 ? "" : "s"} left.
                </p>
              </div>

              <Link href="/pricing" className="button-gold button-block-mobile">
                {dashboard.daysRemaining <= 3 ? "Renew now" : "Manage renewal"}
              </Link>
            </div>
          </div>
        </article>

        <article className="panel rise-in delay-1 p-6 float-card-alt sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
            Public profile
          </p>
          <h2 className="mt-4 text-2xl font-semibold text-slate-950">
            Share your expert link
          </h2>
          <p className="mt-4 break-all text-sm leading-7 text-slate-600">
            {profileUrl}
          </p>
          <div className="mt-6 button-row">
            <Link
              href={`/${dashboard.profile.username}`}
              className="button-primary button-block-mobile"
            >
              View public page
            </Link>
            <Link
              href="/dashboard/profile"
              className="button-secondary button-block-mobile"
            >
              Update profile
            </Link>
          </div>
        </article>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        <article className="panel rise-in delay-1 p-5 sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
            Unanswered questions
          </p>
          <p className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
            {dashboard.questions.length}
          </p>
        </article>
        <article className="panel rise-in delay-2 p-5 sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
            Upcoming sessions
          </p>
          <p className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
            {dashboard.sessions.length}
          </p>
        </article>
        <article className="panel rise-in delay-3 p-5 sm:p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
            Recent transactions
          </p>
          <p className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
            {dashboard.transactions.length}
          </p>
        </article>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.15fr,0.85fr]">
        <div className="space-y-5">
          <div className="rise-in delay-1 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
                Q&amp;A inbox
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-950">
                Answer client questions
              </h2>
            </div>
            <Link
              href="/dashboard/offerings"
              className="button-secondary button-block-mobile"
            >
              Manage offerings
            </Link>
          </div>

          {dashboard.questions.length > 0 ? (
            dashboard.questions.map((question) => (
              <AnswerQuestionForm
                key={question.id}
                questionId={question.id}
                questionText={question.question_text}
                clientName={question.client_name}
              />
            ))
          ) : (
            <div className="panel rise-in delay-2 px-6 py-10 text-center text-slate-500 sm:px-8 sm:py-12">
              No unanswered questions yet.
            </div>
          )}
        </div>

        <div className="space-y-5">
          <section className="panel rise-in delay-2 p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
              Sessions
            </p>
            <div className="mt-5 space-y-4">
              {dashboard.sessions.length > 0 ? (
                dashboard.sessions.map((session) => (
                  <article
                    key={session.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 transition duration-500 hover:-translate-y-1 hover:bg-white"
                  >
                    <p className="text-sm font-semibold text-slate-950">
                      {session.client_name}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      Preferred time: {formatDateTime(session.scheduled_time)}
                    </p>
                    <p className="text-sm text-slate-500 capitalize">
                      Status: {session.status}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-500">No sessions scheduled yet.</p>
              )}
            </div>
          </section>

          <section className="panel rise-in delay-3 p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
              Transactions
            </p>
            <div className="mt-5 space-y-4">
              {dashboard.transactions.length > 0 ? (
                dashboard.transactions.map((transaction) => (
                  <article
                    key={transaction.id}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 transition duration-500 hover:-translate-y-1 hover:bg-white"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          {transaction.client_name}
                        </p>
                        <p className="text-sm text-slate-500">
                          {transaction.offering_title}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-slate-950">
                        {formatCurrency(transaction.amount_paid)}
                      </p>
                    </div>
                    <div className="mt-3 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                      <span className="uppercase">{transaction.offering_type}</span>
                      <span>{formatDate(transaction.created_at)}</span>
                    </div>
                  </article>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  No transactions yet. Share your public page to start getting paid.
                </p>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
