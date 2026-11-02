import { formatDeckMatchLine } from "../lib/decks";
import type { DeckTermMatch } from "../types";

export default function DeckMatchLine({ matches }: { matches: DeckTermMatch[] }) {
  const segments = formatDeckMatchLine(matches);
  if (segments.length === 0) return null;
  return <p className="-mt-2 mb-4 text-sm text-neutral-400">{segments.join(" · ")}</p>;
}
