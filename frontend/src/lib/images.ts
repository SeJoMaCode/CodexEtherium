import type { CardSummary } from "../types";

export const GRID_IMAGE_SIZES =
  "(min-width: 1280px) 200px, (min-width: 1024px) 180px, (min-width: 640px) 150px, 45vw";

export interface GridImageAttrs {
  src: string | null;
  srcSet: string | undefined;
  sizes: string;
}

export function gridImageAttrs(card: CardSummary): GridImageAttrs {
  const small = card.image_uris?.small ?? null;
  const normal = card.image_uris?.normal ?? null;
  return {
    src: normal ?? small,
    srcSet: small && normal ? `${small} 146w, ${normal} 488w` : undefined,
    sizes: GRID_IMAGE_SIZES,
  };
}

export function preloadImage(attrs: GridImageAttrs, onSettle?: () => void): void {
  if (!attrs.src) {
    onSettle?.();
    return;
  }
  const img = new Image();
  if (onSettle) {
    img.onload = onSettle;
    img.onerror = onSettle;
  }
  if (attrs.srcSet) img.srcset = attrs.srcSet;
  img.sizes = attrs.sizes;
  img.src = attrs.src;
}
