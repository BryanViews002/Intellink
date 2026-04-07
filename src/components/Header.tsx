export default function Header() {
  return (
    <header className="bg-navy text-white border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Intellink</h1>
        <nav className="flex gap-6 text-sm">
          <a href="/dashboard" className="hover:text-gold transition">
            Dashboard
          </a>
          <a href="/pricing" className="hover:text-gold transition">
            Pricing
          </a>
        </nav>
      </div>
    </header>
  );
}
