import type { DragEvent } from "react";
import type { CardSummary } from "../types";

// Moxfield's deck drop zone reads the first `src="..."` in text/html, falling
// back to text/uri-list. It accepts a Scryfall CDN image URL (file name is the
// Scryfall ID, must be followed by `?`) or a scryfall.com/card/{set}/{number}/ URL.
// Set both explicitly so drags behave the same in every browser.
export function setCardDragData(
  e: DragEvent<HTMLElement>,
  card: Pick<CardSummary, "set_code" | "number">,
  imageUrl: string | null | undefined,
) {
  const pageUrl =
    card.set_code && card.number
      ? `https://scryfall.com/card/${card.set_code.toLowerCase()}/${encodeURIComponent(card.number)}/`
      : null;
  if (!imageUrl && !pageUrl) return;

  const dt = e.dataTransfer;
  dt.clearData();
  dt.effectAllowed = "copyLink";
  if (imageUrl) dt.setData("text/html", `<img src="${imageUrl}">`);
  const uri = pageUrl ?? imageUrl!;
  dt.setData("text/uri-list", uri);
  dt.setData("text/plain", uri);
}
