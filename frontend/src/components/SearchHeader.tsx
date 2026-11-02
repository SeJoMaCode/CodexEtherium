import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import SearchForm from "./SearchForm";

interface Props {
  initialQuery?: string;
  onSearch: (query: string) => void;
}

export default function SearchHeader({ initialQuery = "", onSearch }: Props) {
  return (
    <header className="px-4 sm:px-6 lg:px-10 py-3 border-b border-neutral-200">
      <div className="flex items-center gap-x-4">
        <Link
          to="/"
          className="font-display text-lg font-semibold text-neutral-900 shrink-0 hover:text-neutral-600 transition-colors"
        >
          <span className="sm:hidden">CE</span>
          <span className="hidden sm:inline">Codex Etherium</span>
        </Link>

        <SearchForm
          initialQuery={initialQuery}
          onSearch={onSearch}
          className="flex-1 flex gap-2 min-w-0"
          inputClassName="text-sm rounded-xl px-3.5 py-2"
          buttonClassName="px-4 py-2 rounded-xl"
        />

        <Link
          to="/builder"
          className="hidden sm:inline font-body text-sm text-neutral-500 hover:text-neutral-900 transition-colors shrink-0"
        >
          Build a card
        </Link>
        <Link
          to="/syntax"
          className="hidden sm:inline font-body text-sm text-neutral-500 hover:text-neutral-900 transition-colors shrink-0"
        >
          Syntax help →
        </Link>
        <MobileMenu />
      </div>
    </header>
  );
}

/** Phone-only "⋯" menu with the links the desktop header shows inline. */
function MobileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "block px-4 py-2.5 font-body text-sm text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900";

  return (
    <div ref={ref} className="relative sm:hidden shrink-0">
      <button
        type="button"
        aria-label="More"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="w-9 h-9 flex items-center justify-center rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 text-lg leading-none transition-colors"
      >
        ⋯
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-2 w-44 z-30 bg-white border border-neutral-200 rounded-xl shadow-lg py-1">
          <Link role="menuitem" to="/builder" className={item} onClick={() => setOpen(false)}>
            ✦ Build a card
          </Link>
          <Link role="menuitem" to="/syntax" className={item} onClick={() => setOpen(false)}>
            ? Syntax help
          </Link>
        </div>
      )}
    </div>
  );
}
