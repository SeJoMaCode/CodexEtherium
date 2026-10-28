import { Link } from "react-router-dom";
import { useState } from "react";
import type { CardSummary } from "../types";
import { gridImageAttrs } from "../lib/images";
import { setCardDragData } from "../lib/cardDrag";

interface Props {
  card: CardSummary;
  eager?: boolean;
}

function PlaceholderCard({ name }: { name: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <span className="text-neutral-400 text-xs text-center px-2 font-body">{name}</span>
    </div>
  );
}

export default function CardTile({ card, eager = false }: Props) {
  const { src, srcSet, sizes } = gridImageAttrs(card);
  const smallSrc = card.image_uris?.small ?? null;
  const price = card.prices?.usd;
  const [loaded, setLoaded] = useState(false);
  const nativeLoading = eager ? "eager" : "lazy";

  return (
    <Link
      to={`/card/${card.uuid}`}
      className="group block text-left w-full focus:outline-none"
      onDragStart={(e) => setCardDragData(e, card, card.image_uris?.normal ?? smallSrc)}
      style={{ animation: "tile-reveal 220ms ease-out" }}
    >
      <div className="rounded-xl border border-neutral-200 group-hover:border-neutral-400 transition-colors bg-white overflow-hidden">
        <div className="aspect-[2.5/3.5] bg-neutral-100 relative overflow-hidden">
          {src ? (
            <>
              {smallSrc && (
                <img
                  src={smallSrc}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover scale-110 blur-md"
                  loading={nativeLoading}
                  decoding="async"
                />
              )}
              <img
                src={src}
                srcSet={srcSet}
                sizes={sizes}
                alt={card.name}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                  loaded ? "opacity-100" : "opacity-0"
                }`}
                loading={nativeLoading}
                decoding="async"
                onLoad={() => setLoaded(true)}
              />
            </>
          ) : (
            <PlaceholderCard name={card.name} />
          )}
        </div>

        <div className="p-2.5">
          <p className="font-display text-sm text-neutral-900 truncate leading-tight">
            {card.name}
          </p>
          <div className="flex items-center justify-between mt-1 font-body">
            <span className="text-xs text-neutral-500 uppercase">
              {card.set_code}
            </span>
            {price != null && (
              <span className="text-xs text-neutral-900 font-medium">${price.toFixed(2)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
