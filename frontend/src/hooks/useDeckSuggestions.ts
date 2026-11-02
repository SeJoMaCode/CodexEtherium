import { useEffect, useState } from "react";
import { useDebouncedValue } from "../builder/useDebouncedValue";
import { freshItems } from "../lib/deckAutocomplete";
import type { DeckSummary } from "../types";

const DEBOUNCE_MS = 150;
const EMPTY: DeckSummary[] = [];

interface Result {
  term: string;
  items: DeckSummary[];
}

/**
 * Deck suggestions for a term. A null term makes no request. Rows fetched for an
 * earlier term are never returned for a later one, so callers can't act on them.
 */
export function useDeckSuggestions(term: string | null): DeckSummary[] {
  const debounced = useDebouncedValue(term, DEBOUNCE_MS);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!debounced) {
      setResult(null);
      return;
    }
    const ctrl = new AbortController();
    fetch(`/api/decks?${new URLSearchParams({ q: debounced, limit: "8" })}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Error ${r.status}`))))
      .then((data: DeckSummary[]) => setResult({ term: debounced, items: data }))
      .catch(() => {
        if (!ctrl.signal.aborted) setResult({ term: debounced, items: EMPTY });
      });
    return () => ctrl.abort();
  }, [debounced]);

  return freshItems(result, term, EMPTY);
}
