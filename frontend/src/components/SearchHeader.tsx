import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { useDeckSuggestions } from "../hooks/useDeckSuggestions";
import { applyDeckSuggestion, clampActive, findDeckToken } from "../lib/deckAutocomplete";
import type { DeckSummary } from "../types";

interface Props {
  initialQuery?: string;
  onSearch: (query: string) => void;
}

export default function SearchHeader({ initialQuery = "", onSearch }: Props) {
  const [value, setValue] = useState(initialQuery);
  const [cursor, setCursor] = useState(0);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [activeRaw, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCursor = useRef<number | null>(null);

  const token = focused && !dismissed ? findDeckToken(value, cursor) : null;
  const suggestions = useDeckSuggestions(token?.term ?? null);
  const open = token !== null && suggestions.length > 0;
  const active = clampActive(activeRaw, suggestions.length);

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setActive(-1);
  }, [token?.term, suggestions]);

  useLayoutEffect(() => {
    if (pendingCursor.current === null) return;
    inputRef.current?.setSelectionRange(pendingCursor.current, pendingCursor.current);
    pendingCursor.current = null;
  }, [value]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setDismissed(true);
    onSearch(value);
  };

  const accept = (deck: DeckSummary) => {
    if (!token) return;
    const next = applyDeckSuggestion(value, token, deck.name);
    pendingCursor.current = next.cursor;
    setValue(next.value);
    setCursor(next.cursor);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((active + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(active <= 0 ? suggestions.length - 1 : active - 1);
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      accept(suggestions[active]);
    } else if (e.key === "Tab") {
      e.preventDefault();
      accept(suggestions[Math.max(active, 0)]);
    } else if (e.key === "Escape") {
      setDismissed(true);
    }
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
          <div className="relative flex-1 min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setCursor(e.target.selectionStart ?? e.target.value.length);
                setDismissed(false);
              }}
              onSelect={(e) => setCursor(e.currentTarget.selectionStart ?? 0)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={onKeyDown}
              role="combobox"
              aria-expanded={open}
              aria-controls="deck-suggestions"
              aria-autocomplete="list"
              aria-activedescendant={open && active >= 0 ? `deck-suggestion-${active}` : undefined}
              placeholder='Search cards… e.g. t:creature r:mythic f:modern'
              className="w-full font-body text-sm bg-white border border-neutral-300 rounded-xl px-3.5 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
            />
            {open && (
              <ul
                id="deck-suggestions"
                role="listbox"
                className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-neutral-200 rounded-xl shadow-lg py-1 overflow-hidden"
              >
                {suggestions.map((deck, i) => (
                  <li
                    key={deck.deck_id}
                    id={`deck-suggestion-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      accept(deck);
                    }}
                    className={`px-3.5 py-1.5 font-body text-sm cursor-pointer ${
                      i === active ? "bg-neutral-100" : "hover:bg-neutral-50"
                    }`}
                  >
                    <span className="block truncate text-neutral-900">{deck.name}</span>
                    <span className="block truncate text-xs text-neutral-400">
                      {deck.list_available
                        ? [deck.commanders[0], deck.set_name].filter(Boolean).join(" · ")
                        : "list not published"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
