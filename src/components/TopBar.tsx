export function TopBar() {
  return (
    <header className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        <a
          href="#bosh-sahifa"
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          Dunyo Geografiyasi
        </a>

        <nav
          aria-label="Asosiy bo‘limlar"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <a
            href="#xarita"
            className="hover:text-sky-700 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Xarita
          </a>
          <a
            href="#davlatlar"
            className="hover:text-sky-700 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Davlatlar
          </a>
          <a
            href="#okeanlar"
            className="hover:text-sky-700 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Okeanlar
          </a>
          <a
            href="#toglar"
            className="hover:text-sky-700 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Tog‘lar
          </a>
          <a
            href="#tabiat"
            className="hover:text-sky-700 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Tabiat
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <a
            href="#viktorina"
            className="px-4 py-2 text-sm font-medium text-white bg-sky-700 rounded-lg hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 transition-colors whitespace-nowrap shrink-0"
          >
            Bilimni sinash
          </a>
        </div>
      </div>
    </header>
  );
}
