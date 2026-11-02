import type { DeckTermMatch } from "../types";

const MAX_NAMES = 3;

/** Segments of the "which decks matched" line: names first, then anything to explain. */
export function formatDeckMatchLine(matches: DeckTermMatch[]): string[] {
  const names: string[] = [];
  const problems: string[] = [];

  for (const { term, decks } of matches) {
    const published = decks.filter((d) => d.list_available);
    if (published.length > 0) {
      for (const deck of published) {
        if (!names.includes(deck.name)) names.push(deck.name);
      }
    } else if (decks.length === 0) {
      problems.push(`No precon matches "${term}"`);
    } else if (decks.length === 1) {
      problems.push(`${term}: ${decks[0].name}'s card list isn't published yet`);
    } else {
      problems.push(`${term}: ${decks.length} decks aren't published yet`);
    }
  }

  const hidden = names.length - MAX_NAMES;
  return [...names.slice(0, MAX_NAMES), ...(hidden > 0 ? [`+${hidden} more`] : []), ...problems];
}

/** A deck name that's safe inside quotes: the parser would split on | and &. */
export function deckTermValue(name: string): string {
  return name.replace(/[|&"]/g, " ").replace(/\s+/g, " ").trim();
}

export function deckSearchQuery(name: string): string {
  return `deck:"${deckTermValue(name)}"`;
}
