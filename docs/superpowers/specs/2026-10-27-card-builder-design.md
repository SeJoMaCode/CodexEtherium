# Card Builder: Design

**Date:** 2026-10-27
**Status:** Approved (mockup reviewed by owner)
**Mockup:** `mockups/card-builder.html` (open in a browser; self-contained)

## Problem

Codex Etherium's search is driven by a Scryfall-style query syntax. People who
don't want to learn the syntax have no other way to search by type, color,
tags, etc.

## Solution

A new page, **`/builder`**, where the user fills in a blank, CSS-drawn Magic
card. Each region of the card is a button that opens a small editor popover;
the page turns the filled-in card into a standard query string and runs it on
the normal search page (`/?q=…`).

The builder never talks to a special backend: it only generates the same query
text a power user would type. That keeps results shareable and teaches the
syntax via a live preview.

## Region → query mapping (front face)

| Region | Editor | Generates |
|---|---|---|
| Name bar | text + is/is not | `bolt`, `"sol ring"`, `-"sol ring"` |
| Mana cost | WUBRG toggles; Including/Exactly/At most; Card colors vs Commander identity; mana value op+number | `c>=ug`, `c=ug`, `id<=ug`, `mv<=3` |
| Art box (+ artist line) | illustration-tag chips with All/Any; artist text | `atag:dragon`, `(atag:a OR atag:b)`, `artist:"rebecca guay"` |
| Type line | type chips + is/is not | `t:creature t:elf`, `-t:creature` |
| Set symbol | rarity toggles (symbol recolors; multiple = split color); set code autocomplete | `r:rare`, `(r:rare OR r:mythic)`, `s:mh3` |
| Text box | have / don't have; keyword chips; rules-text phrase chips; oracle-tag chips with All/Any | `keyword:flying`, `o:"draw a card"`, `(otag:ramp OR otag:draw)`, negated with `-` |
| Flavor text | text | `ft:"urza"` |
| P/T box | op+number for power and toughness | `pow>=4 tou<=2` |

Frame tint follows the chosen colors (none = gray, one color = tinted,
multicolor = gold). The page accent (rule under the title) follows it too.

## Back face (`back:()`)

- A **Turn over** button flips the card (3D CSS flip) to a second blank face.
  Everything set on the back is wrapped in `back:(…)`.
- Back face hides mana value; colors become a **color indicator** dot and
  always use `c` (never `id`).
- Art, artist, set and rarity regions are **locked** on the back ("shared with
  the front") and their popover offers "Turn to front".
- A **matches / doesn't match** switch under the flipped card produces
  `-back:(…)`.
- When the back has criteria, a blue tab on the front's right edge summarizes
  them; clicking it flips.
- Label under the flipped card: "Back face · also matches split, adventure &
  flip halves" (the parser treats every non-front face as back).
- `front:()` is never generated (front is the parser default).

## Outside the card ("Not printed on the card" panel)

Format legality rows (format + Legal/Not legal → `f:x` / `-f:x`), flags
(`is:reserved` etc.), EDHREC rank op+number (`edhrank<=1000`), jank op+number
(`jank>=7`), sort field + order (`sort:usd order:desc`, emitted only when not
the default `name`/`asc`). Format/flags never go inside `back:()`.

## Query preview

- Shows the generated query as tokens styled by scope: front (gray), whole
  card (dashed), back (blue; clicking it flips the card), sort/order (muted).
- **Live match count** and the **top match's art** shown in the art box,
  from a debounced (350 ms) `GET /api/cards/search?q=…&page_size=1`. Query
  errors (HTTP 400 `detail`) are shown in place of the count.
- **Edit as text** switches to a textarea. If the text differs from what the
  card generates, the card is dimmed with a "Custom query" notice. **Back to
  card** discards text edits. (Loading a typed query onto the card is out of
  scope.)
- **Search →** navigates to `/?q=<query>`.

## Autocomplete

- Oracle and illustration tags: new mtgDB endpoint
  `GET /tags?type=oracle|illustration&q=<text>&limit=<n>` →
  `[{slug, label}]`, prefix matches first.
- Sets: existing `GET /sets?q=` extended to match set **code** as well as name.
- Types and keywords: static suggestion lists in the frontend; free text
  allowed.

## Navigation, a11y, mobile

- Header gets a "Card builder" link next to "Syntax help →".
- Every region is a `<button>` with an `aria-label`; Esc closes the popover
  and returns focus to the region; tab order follows the card.
- Popover sits to the right of the card on wide screens; on screens
  < 960 px it's a bottom sheet.

## Out of scope

`is:dfc` / "must be double-faced" flag, per-field "either face" scope,
parsing a typed query back onto the card, persisting builder state in the URL.
