import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPublicProfile } from "@/lib/data";
import { OFFERING_TYPE_OPTIONS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";

type PublicProfilePageProps = {
  params: {
    username: string;
  };
};

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const profile = await getPublicProfile(params.username);

  if (!profile) {
    notFound();
  }

  const { expert, offerings } = profile;
  const unavailable =
    expert.subscription_status !== "active" ||
    !expert.korapay_recipient_verified;
  const unavailableReason =
    expert.subscription_status !== "active"
      ? "Their subscription is inactive, so the profile is hidden from client purchases until they renew."
      : "Their payout details are still being verified, so purchases are temporarily disabled.";

  return (
    <main className="pb-12 sm:pb-16">
      <header className="section-shell pt-6">
        <div className="panel overflow-hidden bg-slate-950 px-5 py-5 text-white sm:px-6 md:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="button-secondary">
              Home
            </Link>
            <p className="text-sm font-medium text-slate-300">
              @{expert.username}
            </p>
          </div>
        </div>
      </header>

      <section className="section-shell mt-8">
        <div className="panel overflow-hidden">
          <div className="grid gap-8 bg-slate-950 px-6 py-8 text-white sm:px-8 sm:py-10 lg:grid-cols-[220px,1fr]">
            <div className="mx-auto w-full max-w-[220px] overflow-hidden rounded-[2rem] bg-white/10 lg:mx-0 lg:max-w-none">
              {expert.profile_photo ? (
                <Image
                  src={expert.profile_photo}
                  alt={expert.name}
                  width={440}
                  height={440}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center text-lg font-semibold text-white">
                  {expert.name.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
                Expert profile
              </p>
              <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">
                {expert.name}
              </h1>
              <p className="mt-3 text-lg text-slate-300">@{expert.username}</p>
              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
                {expert.bio || "This expert has not added a bio yet."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell mt-8">
        {unavailable ? (
          <div className="panel px-6 py-8 sm:px-8 sm:py-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
              Unavailable
            </p>
            <h2 className="mt-4 text-2xl font-semibold text-slate-950 sm:text-3xl">
              This expert is currently unavailable.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              {unavailableReason}
            </p>
          </div>
        ) : null}

        <div className="mt-8">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
              Offerings
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
              What clients can buy
            </h2>
          </div>

          {offerings.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {offerings.map((offering) => (
                <article key={String(offering.id)} className="panel p-6 sm:p-7">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
                    {OFFERING_TYPE_OPTIONS[offering.type as keyof typeof OFFERING_TYPE_OPTIONS].shortName}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold text-slate-950">
                    {String(offering.title)}
                  </h3>
                  <p className="mt-4 text-base leading-8 text-slate-600">
                    {String(offering.description)}
                  </p>
                  <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-2xl font-semibold text-slate-950">
                      {formatCurrency(Number(offering.price))}
                    </p>
                    {unavailable ? (
                      <button
                        type="button"
                        disabled
                        className="button-secondary button-block-mobile cursor-not-allowed opacity-60"
                      >
                        Unavailable
                      </button>
                    ) : (
                      <Link
                        href={`/${expert.username}/pay/${String(offering.id)}`}
                        className="button-gold button-block-mobile"
                      >
                        Buy now
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="panel px-6 py-10 text-center text-slate-500 sm:px-8 sm:py-12">
              No live offerings yet.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
