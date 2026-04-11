import Link from "next/link";

export default function Header() {
  return (
    <header className="section-shell pt-6">
      <div className="panel overflow-hidden bg-slate-950 px-5 py-4 text-white sm:px-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-lg font-semibold tracking-[0.18em] text-amber-300">
            INTELLINK
          </Link>
          <nav className="flex gap-3 text-sm">
            <Link href="/discover" className="button-secondary">
              Discover
            </Link>
            <Link href="/pricing" className="button-secondary">
              Pricing
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
