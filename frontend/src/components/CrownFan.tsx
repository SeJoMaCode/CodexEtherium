import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { CardSummary } from "../types";

interface Props {
  cards: CardSummary[];
}

const CARD_W = "clamp(52px, 17vw, 150px)";
const OVERLAP_RATIO = -0.4933; // matches original -74px / 150px
const RISE_RATIO = 16 / 150; // matches original 16px translateY per |offset| unit at 150px

function crownImage(card: CardSummary) {
  const large = card.image_uris?.large ?? null;
  const normal = card.image_uris?.normal ?? null;
  const png = card.image_uris?.png ?? null;
  const src = large ?? normal ?? card.image_uris?.small ?? null;
  const srcSet = large ? `${large} 1x, ${png ?? large} 2x` : undefined;
  return { src, srcSet };
}

export default function CrownFan({ cards }: Props) {
  const shown = cards.slice(0, 7);
  const ids = shown.map((c) => c.uuid).join(",");
  const [ready, setReady] = useState(false);

  // Preload every fanned card off-DOM first so the <img> only ever mounts with
  // a fully-downloaded image already cached — otherwise a baseline JPEG this
  // large visibly renders top-to-bottom ("scan line") as bytes stream in.
  useEffect(() => {
    if (shown.length === 0) return;
    setReady(false);
    let cancelled = false;
    let remaining = shown.length;

    const settle = () => {
      remaining -= 1;
      if (remaining <= 0 && !cancelled) setReady(true);
    };

    shown.forEach((card) => {
      const { src, srcSet } = crownImage(card);
      if (!src) {
        settle();
        return;
      }
      const img = new Image();
      img.onload = settle;
      img.onerror = settle;
      if (srcSet) img.srcset = srcSet;
      img.src = src;
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  if (cards.length === 0) return null;
  const mid = (shown.length - 1) / 2;

  return (
    <div className="flex justify-center items-end">
      {shown.map((card, i) => {
        const offset = i - mid;
        const rotate = offset * 8;
        const zIndex = 100 - Math.round(Math.abs(offset) * 10);
        const { src, srcSet } = crownImage(card);

        return (
          <div
            key={card.uuid}
            style={{
              marginLeft: i === 0 ? 0 : `calc(${CARD_W} * ${OVERLAP_RATIO})`,
              transform: `rotate(${rotate}deg) translateY(calc(${CARD_W} * ${(Math.abs(offset) * RISE_RATIO).toFixed(4)}))`,
              transformOrigin: "bottom center",
              zIndex,
            }}
          >
            <div
              className={ready ? "opacity-0" : ""}
              style={ready ? { animation: `crown-rise 0.6s ease ${i * 80}ms forwards` } : undefined}
            >
              <Link to={`/card/${card.uuid}`} className="block" style={{ width: CARD_W }}>
                {ready && src ? (
                  <div className="w-full aspect-[2.5/3.5] rounded-lg overflow-hidden drop-shadow-[0_20px_45px_-18px_rgba(0,0,0,0.35)]">
                    <img
                      src={src}
                      srcSet={srcSet}
                      alt={card.name}
                      className="w-full h-full object-cover"
                      decoding="async"
                      fetchPriority={Math.abs(offset) <= 1 ? "high" : "auto"}
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-[2.5/3.5] bg-neutral-100 rounded-lg" />
                )}
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
