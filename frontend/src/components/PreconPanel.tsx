import { Link } from "react-router-dom";
import { deckSearchQuery } from "../lib/decks";
import type { DeckSummary } from "../types";

interface Props {
  decks: DeckSummary[];
  accent: string;
}

export default function PreconPanel({ decks, accent }: Props) {
  if (decks.length === 0) return null;

  return (
    <div className="rounded-2xl bg-neutral-50 border border-neutral-200/70 p-5">
      <p className="flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500 mb-3">
        <span className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: accent }} />
        In precons ({decks.length})
      </p>

      <div className="space-y-0.5 max-h-72 overflow-y-auto pr-1">
        {decks.map((deck) => (
          <Link
            key={deck.deck_id}
            to={`/?q=${encodeURIComponent(deckSearchQuery(deck.name))}`}
            className="flex items-center gap-2 py-1.5 px-2 text-sm rounded-lg transition-colors hover:bg-white"
          >
            <span className="min-w-0 flex-1 truncate text-neutral-900">{deck.name}</span>
            <span className="shrink-0 text-neutral-400 text-xs uppercase">
              {deck.set_code}
              {deck.release_date && ` · ${deck.release_date.slice(0, 4)}`}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
