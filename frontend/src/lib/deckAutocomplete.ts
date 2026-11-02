import { deckTermValue } from "./decks";

const MIN_TERM_LENGTH = 2;
const TOKEN_RE = /^(-?(?:deck|precon):)("?)(.*)$/i;

export interface DeckToken {
  start: number;
  end: number;
  key: string;
  term: string;
}

/** The deck: token being typed at the cursor, or null if suggestions shouldn't show. */
export function findDeckToken(value: string, cursor: number): DeckToken | null {
  let start = 0;
  let inQuote = false;
  for (let i = 0; i < cursor; i++) {
    const ch = value[i];
    if (ch === '"') inQuote = !inQuote;
    else if (!inQuote && /[\s()]/.test(ch)) start = i + 1;
  }

  const match = TOKEN_RE.exec(value.slice(start, cursor));
  if (!match) return null;
  const [, key, quote, rawTerm] = match;
  if (/["|&]/.test(rawTerm)) return null;
  const term = rawTerm.trim();
  if (term.length < MIN_TERM_LENGTH) return null;

  let end = cursor;
  if (quote) {
    const close = value.indexOf('"', cursor);
    end = close === -1 ? value.length : close + 1;
  } else {
    while (end < value.length && !/[\s()"|&]/.test(value[end])) end++;
  }
  return { start, end, key, term };
}

export function applyDeckSuggestion(
  value: string,
  token: DeckToken,
  name: string,
): { value: string; cursor: number } {
  const before = value.slice(0, token.start);
  const after = value.slice(token.end);
  const inserted = `${token.key}"${deckTermValue(name)}"${after === "" ? " " : ""}`;
  return { value: before + inserted + after, cursor: before.length + inserted.length };
}

/** Rows fetched for `term`, or `empty` while they belong to an earlier term. */
export function freshItems<T>(stored: { term: string; items: T[] } | null, term: string | null, empty: T[]): T[] {
  return term !== null && stored?.term === term ? stored.items : empty;
}

/** The active row index, or -1 if a shorter list left it out of range. */
export function clampActive(active: number, length: number): number {
  return active < length ? active : -1;
}
