import Link from "next/link";
import { AnswerQuestionForm } from "@/components/dashboard/AnswerQuestionForm";
import { AmbientBackdrop } from "@/components/motion/AmbientBackdrop";
import { ScrollReveal } from "@/components/motion/ScrollReveal";
import { getDashboardData, requireDashboardUser } from "@/lib/data";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRating,
} from "@/lib/format";

export default async function DashboardPage() {
  const { profile } = await requireDashboardUser();
  const dashboard = await getDashboardData(profile.id);

  if (!dashboard) {
    return null;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const profileUrl = `${baseUrl}/${dashboard.profile.username}`;

  const now = new Date();
  const freeExpires = profile.free_expires_at ? new Date(profile.free_expires_at) : null;
  const freeDays = freeExpires ? Math.max(0, Math.ceil((freeExpires.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))) : 0;
  const showFreeMonth = profile.is_free_month && freeDays > 0;

  return (
    <main className="section-shell relative min-h-screen space-y-8 py-10 sm:py-16 text-slate-300">
      <AmbientBackdrop variant="dashboard" />
      
      <div className="relative z-10 space-y-8 animate-float-continuous">
        {dashboard.profile.trust_status === "restricted" ? (
          <section className="panel-lift border border-rose-500/30 bg-rose-950/40 backdrop-blur-md px-6 py-6 sm:px-8 shadow-[0_0_30px_rgba(244,63,94,0.15)]">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]">
              Trust restriction active
            </p>
            <h2 className="mt-3 text-2xl font-bold text-white">
              Your profile has been removed from new client purchases.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-rose-200">
              Intellink automatically restricted your expert page after receiving 10
              one-star reviews in 7 days. Your dashboard is still available, but
              discovery and new purchases are blocked while trust issues are reviewed.
            </p>
          </section>
        ) : null}

        {/* Bento Top Section constraints */}
        <section className="grid gap-6 lg:grid-cols-[1.3fr,0.7fr]">
          {/* Subscription Bento Plate */}
          <ScrollReveal direction="up" delay={1} className="h-full">
          <article className="h-full panel-lift overflow-hidden border-white/10 bg-gradient-to-r from-black/60 to-slate-900/60 backdrop-blur-2xl p-8 sm:p-10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
            <div className="relative z-10">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-500 drop-shadow-[0_0_5px_rgba(216,170,57,0.5)]">
                Subscription status
              </p>
              <div className="mt-5 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div>
                  {showFreeMonth ? (
                    <>
                      <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-sm font-bold text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        🎉 Free Pro Month
                      </span>
                      <h2 className="mt-4 text-3xl font-extrabold capitalize text-white sm:text-5xl tracking-tight">
                        {profile.subscription_plan} plan
                      </h2>
                      <p className="mt-3 text-lg leading-7 text-slate-400">
                        Free until {formatDate(profile.free_expires_at)}. 
                        <span className="text-emerald-400 ml-2">{freeDays} day{freeDays === 1 ? '' : 's'} left.</span>
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-3xl font-extrabold capitalize text-white sm:text-5xl tracking-tight">
                        {dashboard.profile.subscription_plan} plan
                      </h2>
                      <p className="mt-3 text-lg leading-7 text-slate-400">
                        Expires on {formatDate(dashboard.profile.subscription_expires_at)}.
                        <span className="text-amber-500 ml-2">You have {dashboard.daysRemaining} day{dashboard.daysRemaining === 1 ? "" : "s"} left.</span>
                      </p>
                    </>
                  )}
                </div>

                <Link href="/pricing" className="button-gold-glow flex-shrink-0 px-8 py-4 text-center">
                  {showFreeMonth && freeDays > 7 ? "Upgrade now" : dashboard.daysRemaining <= 3 ? "Renew now" : "Manage renewal"}
                </Link>
              </div>
            </div>
          </article>
          </ScrollReveal>

          {/* Share Profile Bento Plate */}
          <ScrollReveal direction="left" delay={3} className="h-full">
          <article className="h-full panel-lift border-white/5 bg-gradient-to-br from-cyan-950/30 to-black/60 backdrop-blur-2xl p-8 sm:p-10 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col justify-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">
              Public profile
            </p>
            <h2 className="mt-4 text-2xl font-bold text-white tracking-tight">
              Share your expert link
            </h2>
            <p className="mt-4 break-all text-sm leading-7 text-cyan-200/50 bg-cyan-950/40 p-4 rounded-xl border border-cyan-400/20 font-mono">
              {profileUrl}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <Link href={`/${dashboard.profile.username}`} className="button-secondary border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-cyan-400/50 text-center px-6 py-3 w-full transition-all">
                View public page
              </Link>
              <Link href="/dashboard/profile" className="button-secondary border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-amber-500/50 text-center px-6 py-3 w-full transition-all">
                Update profile
              </Link>
            </div>
          </article>
          </ScrollReveal>
        </section>

        {/* Global Bento Stats Grid */}
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <ScrollReveal direction="scale" delay={4}>
          <article className="panel-lift border-white/5 bg-black/40 backdrop-blur-xl p-6 sm:p-8 hover:bg-white/5 transition-all">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Unanswered questions</p>
            <p className="mt-4 text-4xl font-extrabold text-white sm:text-5xl drop-shadow-md">
              {dashboard.questions.length}
            </p>
          </article>
          </ScrollReveal>
          <ScrollReveal direction="scale" delay={5}>
          <article className="panel-lift border-white/5 bg-black/40 backdrop-blur-xl p-6 sm:p-8 hover:bg-white/5 transition-all">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Upcoming sessions</p>
            <p className="mt-4 text-4xl font-extrabold text-white sm:text-5xl drop-shadow-md">
               {dashboard.sessions.length}
            </p>
          </article>
          </ScrollReveal>
          <ScrollReveal direction="scale" delay={6}>
          <article className="panel-lift border-white/5 bg-black/40 backdrop-blur-xl p-6 sm:p-8 hover:bg-white/5 transition-all">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Recent transactions</p>
            <p className="mt-4 text-4xl font-extrabold text-white sm:text-5xl drop-shadow-md">
               {dashboard.transactions.length}
            </p>
          </article>
          </ScrollReveal>
          <ScrollReveal direction="scale" delay={7}>
          <article className="panel-lift border-white/5 bg-black/40 backdrop-blur-xl p-6 sm:p-8 hover:bg-white/5 transition-all">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500/80">Client rating</p>
            <div className="flex items-end gap-3 mt-4">
              <p className="text-4xl font-extrabold text-amber-400 sm:text-5xl drop-shadow-[0_0_15px_rgba(216,170,57,0.4)]">
                 {formatRating(dashboard.reviewSummary.averageStars)}
              </p>
              <p className="text-sm font-medium text-slate-500 mb-1">
                {dashboard.reviewSummary.totalReviews} review{dashboard.reviewSummary.totalReviews === 1 ? "" : "s"}
              </p>
            </div>
          </article>
          </ScrollReveal>
        </section>

        {/* Detailed Data Bento Panels */}
        <section className="grid gap-8 xl:grid-cols-[1.2fr,0.8fr]">
          <ScrollReveal direction="up" delay={2} className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400 drop-shadow">
                  Q&A inbox
                </p>
                <h2 className="mt-2 text-3xl font-bold text-white tracking-tight">
                  Priority client queue
                </h2>
              </div>
              <Link href="/dashboard/offerings" className="button-secondary border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-cyan-400/50 transition-all text-center px-6 py-3">
                Manage offerings
              </Link>
            </div>

            {dashboard.questions.length > 0 ? (
              <div className="space-y-4">
                {dashboard.questions.map((question) => (
                  <div key={question.id} className="panel-lift border-white/5 bg-black/40 backdrop-blur-xl transition duration-500 hover:border-cyan-400/30 hover:bg-white/5">
                    <AnswerQuestionForm
                      questionId={question.id}
                      questionText={question.question_text}
                      clientName={question.client_name}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="panel-lift border-white/5 bg-black/40 backdrop-blur-xl px-6 py-16 text-center text-slate-500 sm:px-8">
                <span className="block text-4xl mb-4">📭</span>
                Your queue is completely clear.
              </div>
            )}
          </ScrollReveal>

          <div className="space-y-6">
            {/* Reviews Bento */}
            <ScrollReveal direction="up" delay={4}>
            <section className="panel-lift border-white/5 bg-black/40 backdrop-blur-xl p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6 mb-6">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-500">
                    Client reviews
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-white tracking-tight">
                    Trust feedback
                  </h2>
                </div>
                <div className="rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-400">
                  {dashboard.reviewSummary.oneStarReviewsThisWeek} alert{dashboard.reviewSummary.oneStarReviewsThisWeek === 1 ? "" : "s"}
                </div>
              </div>
              <div className="space-y-4">
                {dashboard.reviews.length > 0 ? (
                  dashboard.reviews.map((review) => (
                    <article
                      key={review.id}
                      className="rounded-[1.25rem] border border-white/10 bg-white/5 p-5 transition duration-500 hover:-translate-y-1 hover:bg-white/10 hover:border-amber-500/30 shadow-lg"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-bold text-white">
                            {review.client_name}
                          </p>
                          <p className="mt-1 text-xs text-slate-400 font-mono">
                            {review.offering_title}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-amber-400 drop-shadow">
                          {review.stars} ★
                        </p>
                      </div>
                      <p className="mt-4 text-sm leading-loose text-slate-300">
                        {review.comment || <span className="italic text-slate-500">No written note provided.</span>}
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 italic text-center py-6">
                    Awaiting initial field reports...
                  </p>
                )}
              </div>
            </section>
            </ScrollReveal>

            {/* Sessions Bento */}
            <ScrollReveal direction="up" delay={5}>
            <section className="panel-lift border-white/5 bg-black/40 backdrop-blur-xl p-6 sm:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-400 border-b border-white/10 pb-6 mb-6">
                Active Sessions
              </p>
              <div className="space-y-4">
                {dashboard.sessions.length > 0 ? (
                  dashboard.sessions.map((session) => (
                    <article
                      key={session.id}
                      className="rounded-[1.25rem] border border-white/10 bg-white/5 p-5 transition duration-500 hover:-translate-y-1 hover:bg-white/10 hover:border-cyan-400/30"
                    >
                      <p className="text-sm font-bold text-white">
                        {session.client_name}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-400">
                         {formatDateTime(session.scheduled_time)}
                      </p>
                      <p className="mt-3 text-xs font-bold uppercase tracking-wider text-cyan-400">
                         [ {session.status} ]
                      </p>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 italic text-center py-6">No secure uplinks initiated.</p>
                )}
              </div>
            </section>
            </ScrollReveal>

            {/* Transactions Bento */}
            <ScrollReveal direction="up" delay={6}>
            <section className="panel-lift border-white/5 bg-black/40 backdrop-blur-xl p-6 sm:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-500 border-b border-white/10 pb-6 mb-6">
                Encrypted Ledgers
              </p>
              <div className="space-y-4">
                {dashboard.transactions.length > 0 ? (
                  dashboard.transactions.map((transaction) => (
                    <article
                      key={transaction.id}
                      className="rounded-[1.25rem] border border-white/10 bg-white/5 p-5 transition duration-500 hover:-translate-y-1 hover:bg-white/10 hover:border-emerald-500/30"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-bold text-white">
                            {transaction.client_name}
                          </p>
                          <p className="mt-1 text-xs text-slate-400 font-mono">
                            {transaction.offering_title}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                          {formatCurrency(transaction.amount_paid)}
                        </p>
                      </div>
                      <div className="mt-4 flex flex-col gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-amber-500/80">{transaction.offering_type}</span>
                        <span>{formatDate(transaction.created_at)}</span>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 italic text-center py-6">
                    Awaiting monetary transfers.
                  </p>
                )}
              </div>
            </section>
            </ScrollReveal>
          </div>
        </section>
      </div>
    </main>
  );
}
