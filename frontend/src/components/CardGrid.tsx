import { Link } from "react-router-dom";
import type { CardSummary } from "../types";
import CardTile from "./CardTile";

interface Props {
  cards: CardSummary[];
  loading: boolean;
  revealedCount: number;
  eagerCount: number;
}

export default function CardGrid({ cards, loading, revealedCount, eagerCount }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[2.5/3.5] bg-neutral-100 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-20 font-body">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-lg text-neutral-500">No cards found</p>
        <p className="text-sm mt-1 text-neutral-400">
          Try a different query or check the{" "}
          <Link to="/syntax" className="text-neutral-400 underline hover:text-neutral-900 transition-colors">
            syntax guide
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {cards.map((card, i) => {
        if (i >= eagerCount) {
          return <CardTile key={card.uuid} card={card} />;
        }
        return i < revealedCount ? (
          <CardTile key={card.uuid} card={card} eager />
        ) : (
          <div
            key={card.uuid}
            className="aspect-[2.5/3.5] bg-neutral-100 rounded-xl animate-pulse"
          />
        );
      })}
    </div>
  );
}
