import { useEffect, useState } from "react";
import { useDebouncedValue } from "../builder/useDebouncedValue";
import type { DeckSummary } from "../types";

const DEBOUNCE_MS = 150;
const EMPTY: DeckSummary[] = [];

/** Deck suggestions for a term. A null term makes no request. */
export function useDeckSuggestions(term: string | null): DeckSummary[] {
  const debounced = useDebouncedValue(term, DEBOUNCE_MS);
  const [items, setItems] = useState<DeckSummary[]>(EMPTY);

  useEffect(() => {
    if (!debounced) {
      setItems(EMPTY);
      return;
    }
    const ctrl = new AbortController();
    fetch(`/api/decks?${new URLSearchParams({ q: debounced, limit: "8" })}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Error ${r.status}`))))
      .then((data: DeckSummary[]) => setItems(data))
      .catch(() => {
        if (!ctrl.signal.aborted) setItems(EMPTY);
      });
    return () => ctrl.abort();
  }, [debounced]);

  return term ? items : EMPTY;
}
