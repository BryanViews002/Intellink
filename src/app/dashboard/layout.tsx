import Link from "next/link";
import { requireDashboardUser } from "@/lib/data";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import { AmbientBackdrop } from "@/components/motion/AmbientBackdrop";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireDashboardUser();

  return (
    <div className="min-h-screen bg-transparent">
      <header className="section-shell pt-6">
        <div className="panel motion-shell overflow-hidden bg-slate-950 px-5 py-5 text-white sm:px-6 md:px-8">
          <AmbientBackdrop variant="dashboard" />
          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="rise-in">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">
                Dashboard
              </p>
              <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
                Welcome, {profile.name}
              </h1>
            </div>

            <div className="touch-scroll rise-in delay-1 -mx-1 flex flex-nowrap gap-3 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
              <Link href="/dashboard" className="button-secondary shrink-0">
                Overview
              </Link>
              <Link href="/dashboard/offerings" className="button-secondary shrink-0">
                Offerings
              </Link>
              <Link href="/dashboard/profile" className="button-secondary shrink-0">
                Profile
              </Link>
              <Link
                href="/dashboard/bank-details"
                className="button-secondary shrink-0"
              >
                Bank details
              </Link>
              <Link
                href={`/${profile.username}`}
                className="button-secondary shrink-0"
              >
                Public page
              </Link>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
