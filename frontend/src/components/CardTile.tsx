import type { CardSummary } from "../types";

interface Props {
  card: CardSummary;
  onClick: (card: CardSummary) => void;
}

const RARITY_COLOR: Record<string, string> = {
  common: "text-gray-400",
  uncommon: "text-slate-300",
  rare: "text-amber-400",
  mythic: "text-orange-400",
};

function PlaceholderCard({ name }: { name: string }) {
  return (
    <div className="w-full aspect-[2.5/3.5] bg-gray-800 rounded-lg flex items-center justify-center border border-gray-700">
      <span className="text-gray-600 text-xs text-center px-2">{name}</span>
    </div>
  );
}

export default function CardTile({ card, onClick }: Props) {
  const imageUrl = card.image_uris?.normal ?? null;
  const price = card.prices?.usd;
  const rarity = card.rarity ?? "common";
  const rarityClass = RARITY_COLOR[rarity] ?? "text-gray-400";

  return (
    <button
      onClick={() => onClick(card)}
      className="group text-left w-full focus:outline-none"
    >
      <div className="relative overflow-hidden rounded-lg border border-gray-800 group-hover:border-amber-600 transition-colors bg-gray-900">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={card.name}
            className="w-full object-cover"
            loading="lazy"
          />
        ) : (
          <PlaceholderCard name={card.name} />
        )}

        <div className="p-2 bg-gray-900">
          <p className="text-xs font-medium text-gray-200 truncate leading-tight">
            {card.name}
          </p>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-xs ${rarityClass} capitalize`}>
              {card.set_code?.toUpperCase()}
            </span>
            {price != null && (
              <span className="text-xs text-green-400">${price.toFixed(2)}</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
