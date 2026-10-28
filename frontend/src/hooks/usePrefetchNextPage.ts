import { useEffect, useRef } from "react";
import type { CardSearchResponse, SortField, SortOrder } from "../types";
import { gridImageAttrs, preloadImage } from "../lib/images";

interface Params {
  query: string;
  sort: SortField;
  order: SortOrder;
  page: number;
  pageSize: number;
  total: number | null;
  ready: boolean;
  eagerCount: number;
}

// Once the current page's images are done loading, warm the browser's cache
// with the next page's images in the background (idle time) so paging
// forward feels instant instead of re-triggering the load-in effect.
export function usePrefetchNextPage({ query, sort, order, page, pageSize, total, ready, eagerCount }: Params) {
  const prefetchedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || total == null) return;
    if (page * pageSize >= total) return;

    const nextPage = page + 1;
    const key = `${query}|${sort}|${order}|${nextPage}`;
    if (prefetchedKey.current === key) return;

    let cancelled = false;
    const idleId = requestIdle(() => {
      if (cancelled) return;
      const params = new URLSearchParams({
        sort,
        order,
        page: String(nextPage),
        page_size: String(pageSize),
      });
      if (query.trim()) params.set("q", query.trim());

      fetch(`/api/cards/search?${params}`)
        .then((resp) => (resp.ok ? (resp.json() as Promise<CardSearchResponse>) : null))
        .then((data) => {
          if (cancelled || !data) return;
          prefetchedKey.current = key;
          data.cards.slice(0, eagerCount).forEach((card) => preloadImage(gridImageAttrs(card)));
        })
        .catch(() => {});
    });

    return () => {
      cancelled = true;
      cancelIdle(idleId);
    };
  }, [ready, query, sort, order, page, pageSize, total, eagerCount]);
}

function requestIdle(cb: () => void): number {
  if (typeof window.requestIdleCallback === "function") {
    return window.requestIdleCallback(cb, { timeout: 2000 });
  }
  return window.setTimeout(cb, 300);
}

function cancelIdle(id: number): void {
  if (typeof window.cancelIdleCallback === "function") {
    window.cancelIdleCallback(id);
  } else {
    window.clearTimeout(id);
  }
}
