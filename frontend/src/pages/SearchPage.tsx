import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { CardSearchResponse, CardSummary, SortField, SortOrder } from "../types";
import SearchHeader from "../components/SearchHeader";
import SortControls from "../components/SortControls";
import CardGrid from "../components/CardGrid";
import Pagination from "../components/Pagination";
import LandingHero from "../components/LandingHero";
import { useProgressiveImageReveal } from "../hooks/useProgressiveImageReveal";
import { usePrefetchNextPage } from "../hooks/usePrefetchNextPage";
import { useGridColumns } from "../hooks/useGridColumns";

const PAGE_SIZE = 60;
const EMPTY_CARDS: CardSummary[] = [];
// How many rows to eagerly preload/reveal (roughly one viewport); the rest
// of the grid renders immediately with native lazy-loaded images instead.
const EAGER_ROWS = 3;

function parseParams(sp: URLSearchParams) {
  return {
    hasSearched: sp.has("q"),
    query: sp.get("q") ?? "",
    sort: (sp.get("sort") as SortField | null) ?? "name",
    order: (sp.get("order") as SortOrder | null) ?? "asc",
    page: Number(sp.get("page")) || 1,
  };
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasSearched, query, sort, order, page } = parseParams(searchParams);

  const [results, setResults] = useState<CardSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const columns = useGridColumns();
  const eagerCount = columns * EAGER_ROWS;
  const { revealedCount, allReady } = useProgressiveImageReveal(results?.cards ?? EMPTY_CARDS, eagerCount);
  usePrefetchNextPage({
    query,
    sort,
    order,
    page,
    pageSize: PAGE_SIZE,
    total: results?.total ?? null,
    ready: allReady && !loading,
    eagerCount,
  });

  useEffect(() => {
    if (!hasSearched) {
      setResults(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      sort,
      order,
      page: String(page),
      page_size: String(PAGE_SIZE),
    });
    if (query.trim()) params.set("q", query.trim());
    fetch(`/api/cards/search?${params}`)
      .then(async (resp) => {
        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          throw new Error(body.detail ?? `Error ${resp.status}`);
        }
        return resp.json() as Promise<CardSearchResponse>;
      })
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Search failed");
          setResults(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hasSearched, query, sort, order, page]);

  const updateParams = (next: Partial<{ query: string; sort: SortField; order: SortOrder; page: number }>) => {
    const merged = { query, sort, order, page, ...next };
    const sp = new URLSearchParams();
    sp.set("q", merged.query);
    if (merged.sort !== "name") sp.set("sort", merged.sort);
    if (merged.order !== "asc") sp.set("order", merged.order);
    if (merged.page !== 1) sp.set("page", String(merged.page));
    setSearchParams(sp);
  };

  const handleSearch = (q: string) => updateParams({ query: q, page: 1 });

  const handleSort = (s: SortField, o: SortOrder) => updateParams({ sort: s, order: o, page: 1 });

  const handlePage = (p: number) => {
    updateParams({ page: p });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!hasSearched) {
    return <LandingHero onSearch={handleSearch} />;
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-body flex flex-col">
      <SearchHeader initialQuery={query} onSearch={handleSearch} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-10 pt-6 pb-16">
        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}{" "}
            <Link to="/syntax" className="underline hover:text-red-800 transition-colors">
              Check the syntax guide →
            </Link>
          </p>
        )}

        {results == null && !loading ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">⚔️</p>
            <p className="text-lg text-neutral-500">Search for any Magic card</p>
            <p className="text-sm mt-2 text-neutral-400">Try a query above, e.g. t:creature r:mythic f:modern</p>
          </div>
        ) : (
          <>
            {results && (
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <span className="text-sm text-neutral-500">
                  {results.total.toLocaleString()} result{results.total !== 1 ? "s" : ""}
                  {query && (
                    <span className="ml-1 text-neutral-400">for "{query}"</span>
                  )}
                </span>
                <SortControls sort={sort} order={order} onChange={handleSort} />
              </div>
            )}

            <CardGrid
              cards={results?.cards ?? EMPTY_CARDS}
              loading={loading}
              revealedCount={revealedCount}
              eagerCount={eagerCount}
            />
          </>
        )}

        {results && results.total > PAGE_SIZE && (
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={results.total}
            onPage={handlePage}
          />
        )}
      </main>

      <footer className="border-t border-neutral-200 px-6 lg:px-10 py-6 text-center text-xs text-neutral-400">
        Card data: MTGJSON &bull; Images and prices: Scryfall (CC BY 4.0)
      </footer>
    </div>
  );
}
