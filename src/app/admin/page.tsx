import type { Metadata } from "next";
import { getAdminStats, getCurrentAdminContext } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/format";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Admin",
  description:
    "Review Intellink subscriptions, monthly revenue, and expert transaction activity from the admin control room.",
  path: "/admin",
  noIndex: true,
});

export default async function AdminPage() {
  await getCurrentAdminContext();
  const stats = await getAdminStats();

  return (
    <main className="section-shell py-6 sm:py-8">
      <div className="space-y-8">
        <section className="panel bg-slate-950 px-6 py-8 text-white sm:px-8 sm:py-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
            Admin
          </p>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">
            Intellink control room
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
            Track subscriptions, monthly platform revenue, and the latest expert
            transaction activity.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <article className="panel p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
              Active subscriptions
            </p>
            <p className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
              {stats.activeSubscriptions}
            </p>
          </article>
          <article className="panel p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
              Monthly revenue
            </p>
            <p className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
              {formatCurrency(stats.monthlyRevenue)}
            </p>
          </article>
          <article className="panel p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
              Expired subscriptions
            </p>
            <p className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
              {stats.expiredSubscriptions.length}
            </p>
          </article>
          <article className="panel p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
              Restricted experts
            </p>
            <p className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
              {stats.restrictedExperts.length}
            </p>
          </article>
        </section>

        <section className="panel overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <h2 className="text-2xl font-semibold text-slate-950">Subscribers</h2>
          </div>
          <div className="overflow-x-auto px-5 py-5 sm:px-6">
            <table className="min-w-[620px] w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-4">Name</th>
                  <th className="pb-4">Username</th>
                  <th className="pb-4">Plan</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">Expiry</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {stats.subscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="border-t border-slate-100">
                    <td className="py-4">{subscriber.name}</td>
                    <td className="py-4">@{subscriber.username}</td>
                    <td className="py-4 capitalize">
                      {subscriber.subscription_plan ?? "none"}
                    </td>
                    <td className="py-4 capitalize">{subscriber.subscription_status}</td>
                    <td className="py-4">
                      {formatDate(subscriber.subscription_expires_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <h2 className="text-2xl font-semibold text-slate-950">
              Recent transactions
            </h2>
          </div>
          <div className="overflow-x-auto px-5 py-5 sm:px-6">
            <table className="min-w-[720px] w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-4">Client</th>
                  <th className="pb-4">Expert</th>
                  <th className="pb-4">Type</th>
                  <th className="pb-4">Amount</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">Date</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {stats.transactions.map((transaction) => {
                  const expert = Array.isArray(transaction.users)
                    ? transaction.users[0]
                    : transaction.users;

                  return (
                    <tr
                      key={transaction.id}
                      className="border-t border-slate-100"
                    >
                      <td className="py-4">{transaction.client_name}</td>
                      <td className="py-4">
                        {expert?.name
                          ? `${expert.name} (@${expert.username})`
                          : "Unknown"}
                      </td>
                      <td className="py-4 uppercase">{transaction.offering_type}</td>
                      <td className="py-4">{formatCurrency(transaction.amount_paid)}</td>
                      <td className="py-4 capitalize">{transaction.status}</td>
                      <td className="py-4">{formatDate(transaction.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <h2 className="text-2xl font-semibold text-slate-950">
              Restricted experts
            </h2>
          </div>
          <div className="overflow-x-auto px-5 py-5 sm:px-6">
            {stats.restrictedExperts.length > 0 ? (
              <table className="min-w-[760px] w-full text-left text-sm">
                <thead className="text-slate-500">
                  <tr>
                    <th className="pb-4">Name</th>
                    <th className="pb-4">Username</th>
                    <th className="pb-4">Plan</th>
                    <th className="pb-4">Flagged</th>
                    <th className="pb-4">Reason</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {stats.restrictedExperts.map((expert) => (
                    <tr key={expert.id} className="border-t border-slate-100">
                      <td className="py-4">{expert.name}</td>
                      <td className="py-4">@{expert.username}</td>
                      <td className="py-4 capitalize">
                        {expert.subscription_plan ?? "none"}
                      </td>
                      <td className="py-4">{formatDate(expert.trust_flagged_at)}</td>
                      <td className="py-4">{expert.trust_reason ?? "Trust review in progress"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-slate-500">
                No experts are currently trust-restricted.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
