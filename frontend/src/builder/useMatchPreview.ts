import { useEffect, useState } from "react";
import type { CardSearchResponse, CardSummary } from "../types";
import { useDebouncedValue } from "./useDebouncedValue";

export interface MatchPreview {
  total: number | null;
  top: CardSummary | null;
  error: string | null;
  loading: boolean;
}

const EMPTY: MatchPreview = { total: null, top: null, error: null, loading: false };

/** Debounced count + top result for the query being built. */
export function useMatchPreview(query: string): MatchPreview {
  const q = useDebouncedValue(query.trim(), 350);
  const [state, setState] = useState<MatchPreview>(EMPTY);

  useEffect(() => {
    if (!q) {
      setState(EMPTY);
      return;
    }
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true }));
    fetch(`/api/cards/search?${new URLSearchParams({ q, page_size: "1" })}`, { signal: ctrl.signal })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(typeof body.detail === "string" ? body.detail : `Search failed (${r.status})`);
        return body as CardSearchResponse;
      })
      .then((data) => setState({ total: data.total, top: data.cards[0] ?? null, error: null, loading: false }))
      .catch((e: Error) => {
        if (!ctrl.signal.aborted) setState({ total: null, top: null, error: e.message, loading: false });
      });
    return () => ctrl.abort();
  }, [q]);

  return state;
}
