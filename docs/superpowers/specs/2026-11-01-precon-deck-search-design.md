# Precon Deck Search: Design

**Date:** 2026-11-01
**Status:** Design approved in chat; written spec awaiting owner review
**Repos:** `mtgDB` (data, parser, API) and `mtgSearch` (Codex Etherium UI)

## Problem

Precons are a natural pool to build from, but a search can't target one. The
motivating case is an artifact-creature deck drawn from Necron Dynasties (40K),
Urza's Iron Alliance (BRC) and We Are the Borg (TRC).

- `s:40K` returns all four Warhammer decks, and `s:BRC` mixes Urza and Mishra.
- mtgDB doesn't store deck contents. `mtgjson."sealedProducts".contents` only
  names a deck: `{"deck":[{"name":"Necron Dynasties","set":"40k"}]}`.
- People rarely remember exact precon names.

## Solution

A `deck:` search filter (alias `precon:`) that finds precons by whatever someone
remembers: part of the deck name, a commander, the set name, or the set code. It
composes with every other filter:

```
deck:necron|urza|borg t:artifact t:creature
```

Supporting it: a quiet line showing which decks matched, an "In precons" panel on
card pages, and, as the last and removable piece, autocomplete in the main search
box.

## Goals

- `deck:` works in every client of the mtgDB search API.
- A term finds the deck through its name, commander, set name or set code.
- Broad terms and not-yet-published decks are visible, not silently wrong.
- No added UI on searches that don't use `deck:`.

## Non-goals

- Deck Mixer, 100-card list building, or export.
- Collection or quantity tracking.
- Automatic theme or similar-deck suggestions.
- Typo tolerance beyond what autocomplete provides.
- Changes to the "Build a card" page.
- Non-Commander products (Jumpstart, Brawl, MTGO Commander, land packs, etc.).

## Data findings behind the design

Measured on 2026-11-01:

| Finding | Evidence | Consequence |
|---|---|---|
| Printing IDs lose cards under dedupe | 45 of 71 Necron cards have a canonical printing from the deck | Match on oracle ID |
| Oracle matching is complete and fast | 71 of 71 cards in about 11 ms against 115,155 identifier rows | No new index required |
| Collector's Editions repeat the list | Necron regular and CE have identical card names, different UUIDs | Import regular decks only |
| Deck names omit the franchise | `warhammer` misses the 40K decks by name | Also match set name |
| Borg list is absent | `WeAreTheBorg_TRC` returns 404; TRC isn't in `DeckList.json` | Need a "not published" state |
| Sealed product names match deck names | Of 226 sealed deck references, only the 8 TRC ones have no Commander deck in `DeckList.json` (normalized comparison) | Pending decks won't falsely flag released ones |
| TRC is partial in mtgDB | 67 cards; `s:TRC "Sol Ring"` and `s:TRC t:land` return nothing | Oracle matching should find reprints through other printings |

## Data model (mtgDB)

Added to `db/init/01-schemas.sql` with `IF NOT EXISTS`:

```sql
CREATE TABLE IF NOT EXISTS app.decks (
    deck_id        TEXT PRIMARY KEY,   -- MTGJSON fileName, or pending:<SET>:<normalized name>
    name           TEXT NOT NULL,
    set_code       TEXT NOT NULL,      -- uppercase
    set_name       TEXT,
    release_date   TEXT,
    commanders     TEXT[] NOT NULL DEFAULT '{}',
    search_text    TEXT NOT NULL,      -- normalized; see Matching
    list_available BOOLEAN NOT NULL,
    imported_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_decks_set_code ON app.decks (set_code);

CREATE TABLE IF NOT EXISTS app.deck_cards (
    deck_id   TEXT NOT NULL REFERENCES app.decks (deck_id) ON DELETE CASCADE,
    oracle_id TEXT NOT NULL,
    name      TEXT NOT NULL,
    quantity  INTEGER NOT NULL,
    board     TEXT NOT NULL,           -- 'commander' or 'main'
    PRIMARY KEY (deck_id, oracle_id, board)
);
CREATE INDEX IF NOT EXISTS idx_deck_cards_oracle ON app.deck_cards (oracle_id);
```

Quantities for one oracle ID within a board are summed, since a deck can hold
several printings of the same card (Necron has 73 printings across 71 cards).
`quantity` isn't used by search; it's kept so a later feature doesn't need a new
import format.

The running database needs this applied once by hand because init scripts only
run on a fresh volume. The file is idempotent:

```bash
docker compose exec -T db psql -U mtg -d mtg < db/init/01-schemas.sql
```

## Importer (mtgDB `manager/importer.py`)

New `run_deck_import()`, logged through `_log_start("decks", version)`:

1. Fetch `https://mtgjson.com/api/v5/DeckList.json`. Keep `type == "Commander Deck"`.
2. Drop a deck whose name ends in `Collector's Edition` when a sibling with the
   base name exists in the same set. A CE with no regular sibling is kept.
3. Fetch each `https://mtgjson.com/api/v5/decks/<fileName>.json` one at a time with
   a short delay, using the shared `HEADERS`.
4. Parse with a pure function. Read `commander` and `mainBoard`; ignore
   `displayCommander`, `sideBoard`, `tokens`, `planes` and `schemes`. Take the
   oracle ID from `identifiers.scryfallOracleId`. Skip a card that has none, log a
   warning, and record the count in the import log notes.
5. Add pending decks: rows from `mtgjson."sealedProducts"` with `category = 'deck'`
   and `subtype = 'commander'` whose `contents.deck[].name` has no imported deck in
   that set, comparing normalized names, with Collector's Editions dropped by the
   same rule. They get
   `list_available = false`, no cards, and an empty `commanders`.
6. In one transaction, upsert each fetched deck and replace its cards, replace all
   pending rows, and delete decks no longer in `DeckList.json`.

### Failure handling

- `DeckList.json` failure: no writes; the existing data stays.
- A single deck file failure: that deck keeps its previous rows and the failure is
  counted in the notes.
- More than 10% of deck files failing: nothing is written and the run is logged as
  failed.
- `run_deck_import()` catches its own exceptions and logs them, so a deck failure
  can't stop card, image or price imports.

### When it runs

- In `run_full_import()`, after `run_mtgjson_import()`.
- In `_weekly_mtgjson_check()`, when the MTGJSON version changed, after
  `run_mtgjson_import()`. The Borg list is picked up this way.
- In `_startup_check()`, when the database is populated but `app.decks` is empty.
  This is the backfill for the existing install.

If the tables were never created, the startup check logs a clear error naming the
manual step and the manager carries on.

## Matching

`normalize_deck_text()` is applied to stored `search_text` and to query terms:

1. NFKD, drop combining marks, casefold, and map `æ` to `ae`.
2. Replace hyphens with a space.
3. Remove all other non-alphanumeric characters except spaces.
4. Collapse whitespace and trim.

Examples: `Urza's` → `urzas`, `Khârn` → `kharn`, `Warhammer 40,000` →
`warhammer 40000`.

`search_text` joins the normalized name, each commander and the set name with
` | `. Normalized terms can't contain `|`, so a phrase can't match across fields.

A deck matches a term when either is true:

- `search_text` contains the normalized term. Normalization removes `%`, `_` and
  `\`, so no `LIKE` escaping is needed.
- `set_code` equals the uppercased term exactly.

The API and manager are separate Docker build contexts, so each holds a copy of this
small function. Both copies run the same table of test cases.

## Search syntax (mtgDB `api/query_parser.py`)

Add `'deck': 'deck'` and `'precon': 'deck'` to `_KEY_ALIASES`, and handle them in
`_key_to_sql` through `_combine_terms`, so these all work:

| Query | Meaning |
|---|---|
| `deck:necron` | Cards in any matching deck |
| `deck:"iron alliance"` | Multi-word term |
| `deck:necron\|urza` | In either |
| `deck:necron&urza` | In both |
| `-deck:urza` | Not in any matching deck |

Each term follows the uncorrelated `IN` pattern `_tag_term_sql` uses, which keeps
`OR` and `NOT` fast:

```sql
c."uuid" IN (
  SELECT ci."uuid" FROM mtgjson."cardIdentifiers" ci
  WHERE ci."uuid" IS NOT NULL AND ci."scryfallOracleId" IN (
    SELECT dc.oracle_id FROM app.deck_cards dc
    JOIN app.decks d ON d.deck_id = dc.deck_id
    WHERE d.search_text LIKE %s OR d.set_code = %s
  )
)
```

Behavior:

- Any printing of a deck's card matches, so `_has_set_filter` doesn't count `deck:`
  and results dedupe to one row per name by default. Results therefore show the
  canonical printing, not always the deck's. `deck:necron s:40K` shows the 40K
  printing, and with the set filter present may show more than one row per card.
- Non-`:` operators (`deck>=x`) raise `QueryError`.
- A term that normalizes to nothing raises `QueryError`.
- `deck:` inside `back:(...)` raises `QueryError`. Deck membership belongs to the
  whole card, not a face.
- A term matching nothing returns zero rows, not an error, so `deck_matches` can
  explain it and other terms in the query still work.

`/cards/search/syntax` gets a `deck:` entry, which also updates the Codex syntax
page.

## API (mtgDB)

### `GET /cards/search`: new `deck_matches` field

Additive and empty for queries without `deck:`, so other clients are unaffected.

```json
{
  "total": 12, "page": 1, "page_size": 60, "cards": [],
  "deck_matches": [
    {
      "term": "borg",
      "decks": [
        {
          "deck_id": "pending:TRC:we are the borg",
          "name": "We Are the Borg",
          "set_code": "TRC",
          "set_name": "Star Trek Commander",
          "release_date": null,
          "commanders": [],
          "list_available": false
        }
      ]
    }
  ]
}
```

A public `extract_deck_terms(expr)` in the parser walks the parsed expression,
including `NotNode`, and returns terms in query order without duplicates. The
router makes one extra indexed query, only when terms exist. A negated term is
reported the same way as a positive one.

### `GET /cards/{uuid}/decks`: new

Resolves the card's oracle ID and returns the decks containing it, newest first,
using the same deck shape. Returns 404 for an unknown UUID and `[]` for a card in
no precon. Pending decks never appear because they have no cards.

### `GET /decks?q=&limit=`: new, autocomplete only

Lives in a new `routers/decks.py`. Requires a normalized `q` of at least 2
characters, otherwise `[]`. Default limit 8, maximum 20. Ranking: name prefix, then
commander or word prefix, then newest. Ships in the autocomplete commit.

## Codex Etherium UI (mtgSearch)

### Match line (`SearchPage.tsx`)

One muted line directly below the result-count row, rendered only when
`deck_matches` is non-empty:

```
Necron Dynasties · Urza's Iron Alliance · borg: We Are the Borg's card list isn't published yet
```

- Matched decks with lists come first, showing up to three names, then `+N more`.
- Every problem term is always shown and doesn't count toward the three:
  - No deck: `No precon matches "xyz"`.
  - Only pending decks: `borg: We Are the Borg's card list isn't published yet`.
    With several pending decks, the wording is `trek: 4 decks aren't published yet`.
- The formatting is a pure function so it can be unit tested.
- No chips, narrowing controls, or anything interactive.

### "In precons" panel (`CardPage.tsx`)

A new `PreconPanel` component beside `PrintingsPanel`, with matching styling and
its `max-h-72` scrolling list, because a staple like Sol Ring appears in many decks.

- Heading: `In precons (N)`. Hidden when N is 0 or the request fails.
- Row: deck name, set code and release year, linking to `/?q=deck:"<name>"`.
- `|` and `&` in a name are replaced with spaces before building the link, since the
  parser would otherwise split on them. Normalization makes the result still match.

### Autocomplete (`SearchHeader.tsx`), the last commit

Exact behavior:

- Active only when the token at the cursor is `deck:` or `precon:`, optionally
  `-`-prefixed, followed by at least 2 characters, including an opened quote.
  Terms after `|` or `&` get no suggestions. Other searches make no requests and
  render nothing.
- Debounced at 150 ms with stale requests aborted, the same approach as
  `useSuggestions`. Up to 8 rows: name, then commander and set in muted text.
  Pending decks are marked `list not published`.
- Enter runs the search unless a row has been arrowed to. Tab or click accepts.
  Arrow keys move. Escape or blur closes. No row is selected by default.
- Accepting replaces the term with `deck:"<name>"`, keeping the `-` and the key the
  user typed, and doesn't run the search.
- The list is an absolutely positioned popover, so nothing shifts.
- Token detection is a pure function in its own file.

**Removal test:** deleting this commit must leave `deck:`, the match line and the
panel working. The endpoint and its router ship in a matching last commit in
`mtgDB`, since the two repos can't share a commit. Reverting just the frontend commit
is enough to remove it from the UI.

Keep or drop is decided by the owner after using it on the live site.

## Error handling summary

| Situation | Result |
|---|---|
| Deck tables empty (before backfill) | `deck:` returns zero rows; match line says no precon matches |
| Unknown term | Zero rows for that term; match line explains |
| Pending deck | Zero rows for that term; match line says not published |
| `deck_matches` lookup fails | The search request fails like any other database error |
| `/decks` or `/cards/{uuid}/decks` fails in the UI | Suggestions or panel stay hidden; search is unaffected |
| MTGJSON unavailable during import | Existing deck data stays; failure in `import_log` |

## Testing

mtgDB has no tests today. This adds `pytest` as a dev-only dependency in each
service and doesn't add it to the production images.

**Parser and normalization (no database):**

- Aliases and SQL parameters for `deck:` and `precon:`.
- `|`, `&`, `-`, quoted terms, and `deck:urza's` unquoted.
- `QueryError` for bad operators, empty terms and `back:(deck:x)`.
- `_has_set_filter` is false for `deck:` queries.
- `extract_deck_terms` through `OR`, `AND`, `NOT` and duplicates.
- Shared normalization table in both services, including `urzas`, `kharn`,
  `warhammer 40000`, and removal of `LIKE` wildcards.

**Importer (saved fixture, no network or database):**

- Parsing a trimmed deck file: boards, summed quantities, a missing oracle ID.
- Collector's Edition filtering, with and without a regular sibling.
- Pending-deck derivation from sealed product `contents`.

**Frontend (Vitest):** match-line formatting, link-value sanitizing, and
autocomplete token detection.

**Live checks after the import:**

| Check | Expected |
|---|---|
| `deck:necron` total | 71 |
| `deck:"Necron Dynasties"` contains Sol Ring | Yes, from a non-40K canonical printing |
| `deck:warhammer` `deck_matches` | Includes all four 40K precons |
| `deck:urza` `deck_matches` | Urza's Iron Alliance, not the Jumpstart pack |
| `deck:szarekh` | Necron Dynasties |
| `deck:borg` | Zero rows with We Are the Borg pending |
| `deck:necron\|urza t:artifact t:creature` under normal load | Well under the 15 s query timeout |
| Search without `deck:` | Empty `deck_matches`; no visible UI change |

## Delivery order

Each step has at least one commit, and no commit spans two steps:

1. `mtgDB`: schema and importer, then run the manual schema step and backfill.
2. `mtgDB`: parser, `deck_matches`, syntax entry.
3. `mtgDB`: `GET /cards/{uuid}/decks`.
4. `mtgSearch`: match line.
5. `mtgSearch`: "In precons" panel.
6. `mtgDB`: `GET /decks`, the autocomplete endpoint.
7. `mtgSearch`: autocomplete.

Steps 6 and 7 are the removable pair. Steps 1 to 5 must work without them.

## Risks

- **Borg availability.** The list may not appear until after the Nov 13 release.
  Until then `deck:borg` reports it as unpublished, and individual Borg cards remain
  searchable by name or `s:TRC`.
- **Oracle IDs in TRC's deck file.** Matching reprints not stored under TRC relies on
  that file carrying oracle IDs, as the 40K and BRC files do. This can't be verified
  until it's published. Cards without one are skipped and counted in the import log.
- **Broad terms.** `deck:war` matches both The Brothers' War and the WAR set code.
  This is intended; the match line makes it visible.
- **Import size.** About 180 sequential fetches at around 0.5 MB each, only when the
  MTGJSON version changes.
