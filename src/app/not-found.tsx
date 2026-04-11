import Link from "next/link";

export default function NotFound() {
  return (
    <main className="section-shell flex min-h-screen items-center py-8 sm:py-12">
      <section className="panel mx-auto max-w-3xl px-6 py-10 text-center sm:px-8 sm:py-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
          404
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
          Page not found
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
          The page you are looking for does not exist or has been moved. Try heading back to the homepage or discovering experts.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link href="/" className="button-primary">
            Return home
          </Link>
          <Link href="/discover" className="button-secondary">
            Discover experts
          </Link>
        </div>
      </section>
    </main>
  );
}
