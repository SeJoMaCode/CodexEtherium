import { useEffect, useState } from "react";
import type { CardSummary } from "../types";
import { gridImageAttrs, preloadImage } from "../lib/images";

// If a card image stalls or fails, don't block the rest of the eager set forever.
const TIMEOUT_MS = 4000;

export interface ProgressiveRevealState {
  revealedCount: number;
  allReady: boolean;
}

// Reveals only the first `eagerCount` cards as a contiguous leading prefix,
// preloading just that many images up front (the rest render lazily via
// native <img loading="lazy"> in CardTile). Because the grid is row-major
// CSS, this sweeps top-to-bottom without needing to track column count for
// the reveal order itself — eagerCount is what determines how many rows are
// covered, computed by the caller from the live column count.
export function useProgressiveImageReveal(cards: CardSummary[], eagerCount: number): ProgressiveRevealState {
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    setRevealedCount(0);
    const eagerCards = cards.slice(0, eagerCount);
    if (eagerCards.length === 0) return;

    let cancelled = false;
    const settled = new Array<boolean>(eagerCards.length).fill(false);
    let frontier = 0;

    const advance = () => {
      while (frontier < settled.length && settled[frontier]) frontier += 1;
      if (!cancelled) setRevealedCount(frontier);
    };

    const timeoutId = window.setTimeout(() => {
      // Pin the frontier at the end so a late onload/onerror after the
      // timeout can't walk revealedCount backwards below eagerCards.length.
      frontier = settled.length;
      if (!cancelled) setRevealedCount(eagerCards.length);
    }, TIMEOUT_MS);

    eagerCards.forEach((card, i) => {
      preloadImage(gridImageAttrs(card), () => {
        if (cancelled) return;
        settled[i] = true;
        advance();
      });
    });

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [cards, eagerCount]);

  return { revealedCount, allReady: revealedCount >= Math.min(cards.length, eagerCount) };
}
