import { useEffect, useState } from "react";
import { useDebouncedValue } from "./useDebouncedValue";

export type SuggestionSource = "oracle" | "illustration" | "set";
export interface Suggestion {
  value: string;
  label: string;
}

/** Autocomplete from mtgDB: tags via /api/tags, sets via /api/sets. Needs 2+ characters. */
export function useSuggestions(source: SuggestionSource | null, text: string): Suggestion[] {
  const term = useDebouncedValue(text.trim(), 200);
  const [items, setItems] = useState<Suggestion[]>([]);

  useEffect(() => {
    if (!source || term.length < 2) {
      setItems([]);
      return;
    }
    const ctrl = new AbortController();
    const url = source === "set"
      ? `/api/sets?${new URLSearchParams({ q: term, page_size: "10" })}`
      : `/api/tags?${new URLSearchParams({ type: source, q: term, limit: "12" })}`;
    fetch(url, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Error ${r.status}`))))
      .then((data) => {
        if (source === "set") {
          const sets = (data as { sets: { code: string; name: string }[] }).sets;
          setItems(sets.map((s) => ({ value: s.code.toLowerCase(), label: `${s.code} · ${s.name}` })));
        } else {
          const tags = data as { slug: string; label: string | null }[];
          setItems(tags.map((t) => ({ value: t.slug, label: t.slug })));
        }
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setItems([]);
      });
    return () => ctrl.abort();
  }, [source, term]);

  return items;
}
