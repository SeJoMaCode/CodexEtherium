import type { CardSummary } from "../types";
import CardTile from "./CardTile";

interface Props {
  cards: CardSummary[];
  loading: boolean;
  onCardClick: (card: CardSummary) => void;
}

export default function CardGrid({ cards, loading, onCardClick }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[2.5/3.5] bg-gray-800 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-20 text-gray-600">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-lg">No cards found</p>
        <p className="text-sm mt-1">Try a different query or check the syntax guide</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {cards.map((card) => (
        <CardTile key={card.uuid} card={card} onClick={onCardClick} />
      ))}
    </div>
  );
}
