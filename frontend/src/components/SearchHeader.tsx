import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

interface Props {
  initialQuery?: string;
  onSearch: (query: string) => void;
}

export default function SearchHeader({ initialQuery = "", onSearch }: Props) {
  const [value, setValue] = useState(initialQuery);

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(value);
  };

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

        <form onSubmit={submit} className="flex-1 flex gap-2 min-w-0">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder='Search cards… e.g. t:creature r:mythic f:modern'
            className="flex-1 min-w-0 font-body text-sm bg-white border border-neutral-300 rounded-xl px-3.5 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
          />
          <button
            type="submit"
            className="font-body text-sm font-medium bg-neutral-900 hover:bg-neutral-700 text-white px-4 py-2 rounded-xl transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        <Link
          to="/builder"
          className="hidden sm:inline font-body text-sm text-neutral-500 hover:text-neutral-900 transition-colors shrink-0"
        >
          Card builder
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
            ✦ Card builder
          </Link>
          <Link role="menuitem" to="/syntax" className={item} onClick={() => setOpen(false)}>
            ? Syntax help
          </Link>
        </div>
      )}
    </div>
  );
}
