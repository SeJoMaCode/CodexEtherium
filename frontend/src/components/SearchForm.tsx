import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useDeckSuggestions } from "../hooks/useDeckSuggestions";
import { applyDeckSuggestion, clampActive, findDeckToken } from "../lib/deckAutocomplete";
import type { DeckSummary } from "../types";

interface Props {
  initialQuery?: string;
  onSearch: (query: string) => void;
  autoFocus?: boolean;
  className: string;
  inputClassName: string;
  buttonClassName: string;
}

/** The search box and its button, with deck: autocomplete. */
export default function SearchForm({
  initialQuery = "",
  onSearch,
  autoFocus,
  className,
  inputClassName,
  buttonClassName,
}: Props) {
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

  useEffect(() => {
    if (active >= 0) document.getElementById(`deck-suggestion-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

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
    <form onSubmit={submit} className={className}>
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
          placeholder="Search cards… e.g. t:creature r:mythic f:modern"
          autoFocus={autoFocus}
          className={`w-full font-body bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 ${inputClassName}`}
        />
        {open && (
          <ul
            id="deck-suggestions"
            role="listbox"
            className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-neutral-200 rounded-xl shadow-lg py-1 max-h-56 overflow-y-auto overscroll-contain"
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
        className={`font-body text-sm font-medium bg-neutral-900 hover:bg-neutral-700 text-white transition-colors shrink-0 ${buttonClassName}`}
      >
        Search
      </button>
    </form>
  );
}
