import { useState, useCallback } from "react";
import type { CardSummary, CardDetail, CardSearchResponse, SortField, SortOrder } from "../types";
import SearchBar from "../components/SearchBar";
import SortControls from "../components/SortControls";
import CardGrid from "../components/CardGrid";
import CardDetailModal from "../components/CardDetailModal";
import Pagination from "../components/Pagination";

const PAGE_SIZE = 20;

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortField>("name");
  const [order, setOrder] = useState<SortOrder>("asc");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<CardSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardDetail | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const search = useCallback(
    async (q: string, s: SortField, o: SortOrder, p: number) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          sort: s,
          order: o,
          page: String(p),
          page_size: String(PAGE_SIZE),
        });
        if (q.trim()) params.set("q", q.trim());
        const resp = await fetch(`/api/cards/search?${params}`);
        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          throw new Error(body.detail ?? `Error ${resp.status}`);
        }
        const data: CardSearchResponse = await resp.json();
        setResults(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Search failed");
        setResults(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleSearch = (q: string) => {
    setQuery(q);
    setPage(1);
    search(q, sort, order, 1);
  };

  const handleSort = (s: SortField, o: SortOrder) => {
    setSort(s);
    setOrder(o);
    setPage(1);
    search(query, s, o, 1);
  };

  const handlePage = (p: number) => {
    setPage(p);
    search(query, sort, order, p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCardClick = async (card: CardSummary) => {
    setModalLoading(true);
    setSelectedCard(null);
    try {
      const resp = await fetch(`/api/cards/${card.uuid}`);
      if (!resp.ok) throw new Error(`Error ${resp.status}`);
      const detail: CardDetail = await resp.json();
      setSelectedCard(detail);
    } catch {
      // fall back to summary data cast as detail
      setSelectedCard(card as unknown as CardDetail);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="bg-gray-900 border-b border-amber-900/40 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-amber-400 tracking-wide mb-3">
            MTG Search
          </h1>
          <SearchBar onSearch={handleSearch} loading={loading} error={error} />
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4">
        {results == null && !loading ? (
          <div className="text-center py-24 text-gray-600">
            <p className="text-5xl mb-4">⚔️</p>
            <p className="text-lg text-gray-500">Search for any Magic card</p>
            <p className="text-sm mt-2">Try a query above or pick an example</p>
          </div>
        ) : (
          <>
            {results && (
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <span className="text-sm text-gray-400">
                  {results.total.toLocaleString()} result{results.total !== 1 ? "s" : ""}
                  {query && (
                    <span className="ml-1 text-gray-500">for "{query}"</span>
                  )}
                </span>
                <SortControls sort={sort} order={order} onChange={handleSort} />
              </div>
            )}

            <CardGrid
              cards={results?.cards ?? []}
              loading={loading}
              onCardClick={handleCardClick}
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

      <footer className="border-t border-gray-800 px-4 py-3 text-center text-xs text-gray-600">
        Card data: MTGJSON &bull; Images and prices: Scryfall (CC BY 4.0)
      </footer>

      {(selectedCard || modalLoading) && (
        <CardDetailModal
          card={selectedCard}
          loading={modalLoading}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </div>
  );
}
