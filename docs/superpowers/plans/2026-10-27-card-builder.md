# Card Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/builder` page to Codex Etherium where users fill in a blank Magic card (name, mana, type line, text box, P/T, art, set symbol, back face) and the page generates and runs a normal search query.

**Architecture:** All query logic lives in pure, unit-tested modules (`src/builder/query.ts`, `src/builder/reducer.ts`). React components render the CSS-drawn card, region popovers, a "not printed on the card" side panel and a live query preview; the page only ever produces a query string and navigates to `/?q=…`. mtgDB gets one new read-only endpoint (`GET /tags`) and `/sets?q=` learns to match set codes, both for autocomplete.

**Tech Stack:** React 19, react-router-dom 7, Vite 5, Tailwind v4, TypeScript (strict), Vitest 3 (added here), FastAPI + psycopg2 (mtgDB API).

**Spec:** `docs/superpowers/specs/2026-10-27-card-builder-design.md` (visual reference: `mockups/card-builder.html`; open it in a browser)

## Global Constraints

- Frontend root: `webapps/mtgSearch/frontend` (paths below are relative to `webapps/mtgSearch` unless they start with `mtgDB/`).
- mtgDB root: `/home/sejoma/Projects/webapps/mtgDB`. **It is not a git repository**; back up any file before editing it (Task 1, Step 1).
- Fonts and look must match the site: `font-display` (Fraunces) for headings, `font-body` (Instrument Sans) for UI, neutral palette, `rounded-2xl bg-neutral-50 border border-neutral-200/70` panels.
- Color accents (same as `CardPage.tsx`): W `#B8860B`, U `#1D5C9E`, B `#4A3164`, R `#C1432F`, G `#2F7A54`, none `#5B6472`, multicolor `#B8860B`. Back-face blue: `#1D5C9E`.
- Generated queries must only use syntax the mtgDB parser accepts: `c`/`id` with `>= = <=`, `mv pow tou edhrank jank` with `= < <= > >=`, `t: o: ft: keyword: otag: atag: artist: s: r: f: is: sort: order:`, `-` negation, `( … OR … )`, `back:( … )`, `-back:( … )`. Never generate `front:()`.
- Card frame art is drawn with CSS only; do not use Wizards of the Coast frame images.
- Do not include any model identifiers in commits or code.
- Debounce: match preview 350 ms; autocomplete 200 ms, min 2 characters.

## File Structure

```
mtgDB/api/routers/tags.py            NEW   GET /tags autocomplete
mtgDB/api/routers/sets.py            MOD   /sets?q= also matches set code
mtgDB/api/main.py                    MOD   register tags router

frontend/package.json                MOD   vitest + "test" script
frontend/vitest.config.ts            NEW
frontend/vite.config.ts              MOD   dev proxy strips /api (matches prod backend)
frontend/src/builder/types.ts        NEW   state types, Region, blank factories
frontend/src/builder/constants.ts    NEW   colors, tints, rarities, formats, suggestions
frontend/src/builder/query.ts        NEW   state → query segments/string (pure)
frontend/src/builder/query.test.ts   NEW
frontend/src/builder/reducer.ts      NEW   state transitions (pure)
frontend/src/builder/reducer.test.ts NEW
frontend/src/builder/useDebouncedValue.ts NEW
frontend/src/builder/useSuggestions.ts    NEW  tags/sets autocomplete
frontend/src/builder/useMatchPreview.ts   NEW  live count + top match
frontend/src/builder/controls.tsx    NEW   Segmented, NegToggle, OpNumber, ChipInput, SetPicker, Field, Eyebrow
frontend/src/builder/SetSymbol.tsx   NEW
frontend/src/builder/BuilderCard.tsx NEW   the flippable card with clickable regions
frontend/src/builder/RegionPopover.tsx NEW popover shell (position, Esc, outside click)
frontend/src/builder/RegionEditor.tsx  NEW per-region editor contents + titles
frontend/src/builder/QueryPreview.tsx  NEW
frontend/src/builder/SidePanel.tsx     NEW
frontend/src/pages/BuilderPage.tsx   NEW
frontend/src/App.tsx                 MOD   /builder route
frontend/src/components/SearchHeader.tsx MOD "Card builder" link
frontend/src/index.css               MOD   card + builder styles (cb- prefix)
```

---

### Task 0: Baseline and branch

The repo currently has ~25 uncommitted changes (owner's work plus earlier features: multi-tag search, Moxfield drag in/out). Feature commits must not mix with them.

- [ ] **Step 1: Ask the owner** whether to commit the existing working-tree changes as a baseline on `main`. Do not commit them without a yes. If yes:

```bash
cd /home/sejoma/Projects/webapps/mtgSearch
git add -A && git commit -m "Baseline: multi-tag search, Moxfield drag in/out, pending work"
```

- [ ] **Step 2: Branch**

```bash
git checkout -b feature/card-builder
```

---

### Task 1: mtgDB autocomplete endpoints

**Files:**
- Create: `mtgDB/api/routers/tags.py`
- Modify: `mtgDB/api/routers/sets.py` (the `list_sets` route, ~lines 65-106)
- Modify: `mtgDB/api/main.py` (router imports + `include_router` lines)

**Interfaces:**
- Produces: `GET /tags?type=oracle|illustration&q=<text>&limit=<1..100>` → `[{"slug": str, "label": str | null}]`, prefix matches first. `GET /sets?q=<text>` now matches `code` (prefix, case-insensitive) as well as name, exact code match first.

- [ ] **Step 1: Back up the files (mtgDB has no git)**

```bash
cd /home/sejoma/Projects/webapps/mtgDB
mkdir -p backups/2026-10-27 && cp api/main.py api/routers/sets.py backups/2026-10-27/
```

- [ ] **Step 2: Confirm the endpoint doesn't exist yet**

Run: `curl -s -o /dev/null -w '%{http_code}\n' 'localhost:8000/tags?type=oracle&q=ramp'`
Expected: `404`

- [ ] **Step 3: Create `api/routers/tags.py`**

```python
import asyncio

from fastapi import APIRouter, Query
from pydantic import BaseModel

import db

router = APIRouter()


class TagSummary(BaseModel):
    slug: str
    label: str | None


def _like_escape(s: str) -> str:
    return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


@router.get("", response_model=list[TagSummary])
async def list_tags(
    type: str = Query(..., pattern="^(oracle|illustration)$", description="Tag type"),
    q: str = Query("", max_length=80, description="Partial slug or label"),
    limit: int = Query(20, ge=1, le=100),
):
    """Autocomplete for oracle/illustration tags. Prefix matches on slug rank first."""
    text = q.strip()
    slug_term = _like_escape(text.lower().replace(" ", "-"))
    label_term = _like_escape(text)

    def _query():
        with db.get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT slug, label FROM app.tags "
                    "WHERE type = %s AND (slug ILIKE %s OR label ILIKE %s) "
                    "ORDER BY (slug ILIKE %s) DESC, length(slug), slug "
                    "LIMIT %s",
                    [type, f"%{slug_term}%", f"%{label_term}%", f"{slug_term}%", limit],
                )
                return cur.fetchall()

    rows = await asyncio.to_thread(_query)
    return [TagSummary(slug=r[0], label=r[1]) for r in rows]
```

- [ ] **Step 4: Register it in `api/main.py`**

Change the import line to:

```python
from routers import cards, ev, sealed, sets, symbols, tags
```

and add after the `symbols` `include_router` line:

```python
app.include_router(tags.router, prefix="/tags", tags=["tags"])
```

- [ ] **Step 5: Make `/sets?q=` match codes**

In `api/routers/sets.py` `list_sets._query`, replace:

```python
        if q:
            clauses.append('"name" ILIKE %s')
            params.append(f"%{q}%")
```

with:

```python
        order_sql = '"releaseDate" DESC NULLS LAST'
        order_params: list = []
        if q:
            clauses.append('("name" ILIKE %s OR "code" ILIKE %s)')
            params.extend([f"%{q}%", f"{q}%"])
            order_sql = '("code" ILIKE %s) DESC, ' + order_sql
            order_params = [q]
```

and replace the page query:

```python
                cur.execute(
                    f'SELECT "code","name","type","releaseDate","baseSetSize","totalSetSize","block","isOnlineOnly" '
                    f'FROM mtgjson.sets {where} ORDER BY "releaseDate" DESC NULLS LAST LIMIT %s OFFSET %s',
                    params + [page_size, offset],
                )
```

with:

```python
                cur.execute(
                    f'SELECT "code","name","type","releaseDate","baseSetSize","totalSetSize","block","isOnlineOnly" '
                    f'FROM mtgjson.sets {where} ORDER BY {order_sql} LIMIT %s OFFSET %s',
                    params + order_params + [page_size, offset],
                )
```

(The `COUNT(*)` query above it keeps using `params` only.)

- [ ] **Step 6: Rebuild the API** (shared by other apps; a few seconds of downtime)

```bash
cd /home/sejoma/Projects/webapps/mtgDB && docker compose up -d --build api
```

- [ ] **Step 7: Verify**

```bash
curl -s 'localhost:8000/tags?type=oracle&q=ramp&limit=3'
curl -s 'localhost:8000/tags?type=illustration&q=drag&limit=3'
curl -s -o /dev/null -w '%{http_code}\n' 'localhost:8000/tags?type=bogus'
curl -s 'localhost:8000/sets?q=mh3&page_size=2' | python3 -c 'import sys,json;print([s["code"] for s in json.load(sys.stdin)["sets"]])'
curl -s 'localhost:8000/sets?q=horizons&page_size=3' | python3 -c 'import sys,json;print([s["name"] for s in json.load(sys.stdin)["sets"]])'
```

Expected: first two print JSON arrays whose first `slug` starts with `ramp` / `drag`; third prints `422`; fourth's first code is `MH3`; fifth lists "Modern Horizons…" sets.

(No commit: mtgDB is not under git. Backups are in `mtgDB/backups/2026-10-27/`.)

---

### Task 2: Test setup, builder state types and query generation

**Files:**
- Modify: `frontend/package.json`, `frontend/vite.config.ts`
- Create: `frontend/vitest.config.ts`, `frontend/src/builder/types.ts`, `frontend/src/builder/constants.ts`, `frontend/src/builder/query.ts`
- Test: `frontend/src/builder/query.test.ts`

**Interfaces:**
- Produces (`types.ts`): `Op`, `OPS`, `Color`, `ColorMode`, `Rarity`, `Side`, `BuilderSort`, `FaceChipField`, `Region`, `LOCKED_ON_BACK`, `FaceState`, `FormatRule`, `CardLevelState`, `BuilderState`, `blankFace()`, `blankCard()`, `blankState()`.
- Produces (`constants.ts`): `COLORS`, `COLOR_NAME`, `ColorKey`, `colorKey()`, `ACCENT`, `FRAME_TINT`, `ART_GLOW`, `indicatorGradient()`, `RARITIES`, `RARITY_COLOR`, `FORMATS`, `FLAGS`, `SORT_FIELDS`, `TYPE_SUGGESTIONS`, `KEYWORD_SUGGESTIONS`, `OP_GLYPH`, `MODE_GLYPH`.
- Produces (`query.ts`): `quote(v: string): string`, `faceTokens(f: FaceState, isBack: boolean): string[]`, `cardTokens(c: CardLevelState): string[]`, `type SegmentKind = "front" | "card" | "back" | "meta"`, `interface Segment { text: string; kind: SegmentKind }`, `buildSegments(s: BuilderState): Segment[]`, `segmentsToQuery(segs: Segment[]): string`, `buildQuery(s: BuilderState): string`.

- [ ] **Step 1: Add Vitest**

```bash
cd /home/sejoma/Projects/webapps/mtgSearch/frontend && npm install -D vitest@^3.2
```

In `package.json` `"scripts"`, add `"test": "vitest run"`.

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 2: Fix the dev proxy** (prod FastAPI strips `/api`; the dev proxy didn't, so `npm run dev` couldn't load cards)

Replace the `server` block in `vite.config.ts` with:

```ts
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
```

- [ ] **Step 3: Create `src/builder/types.ts`**

```ts
export type Op = "=" | "<" | "<=" | ">" | ">=";
export const OPS: Op[] = ["=", "<", "<=", ">", ">="];

export type Color = "W" | "U" | "B" | "R" | "G";
export type ColorMode = "including" | "exactly" | "atmost";
export type Rarity = "common" | "uncommon" | "rare" | "mythic";
export type Side = "front" | "back";
export type BuilderSort = "name" | "mv" | "edhrec" | "usd" | "usd_foil" | "tix" | "jank";
export type FaceChipField = "types" | "keywords" | "phrases" | "otags";

export type Region = "name" | "mana" | "art" | "type" | "set" | "text" | "flavor" | "pt";
/** Regions that describe the whole card; read-only on the back face. */
export const LOCKED_ON_BACK: Region[] = ["art", "set"];

export interface FaceState {
  name: string;
  nameNeg: boolean;
  colors: Color[];
  colorMode: ColorMode;
  colorTarget: "c" | "id";
  mvOp: Op;
  mv: string;
  types: string[];
  typesNeg: boolean;
  keywords: string[];
  phrases: string[];
  otags: string[];
  otagAny: boolean;
  textNeg: boolean;
  flavor: string;
  powOp: Op;
  pow: string;
  touOp: Op;
  tou: string;
}

export interface FormatRule {
  name: string;
  legal: boolean;
}

export interface CardLevelState {
  atags: string[];
  atagAny: boolean;
  artist: string;
  set: string;
  rarities: Rarity[];
  formats: FormatRule[];
  flags: string[];
  edhOp: Op;
  edh: string;
  jankOp: Op;
  jank: string;
  sort: BuilderSort;
  order: "asc" | "desc";
}

export interface BuilderState {
  front: FaceState;
  back: FaceState;
  backNeg: boolean;
  card: CardLevelState;
}

export function blankFace(): FaceState {
  return {
    name: "", nameNeg: false,
    colors: [], colorMode: "including", colorTarget: "c",
    mvOp: "=", mv: "",
    types: [], typesNeg: false,
    keywords: [], phrases: [], otags: [], otagAny: false, textNeg: false,
    flavor: "",
    powOp: ">=", pow: "", touOp: ">=", tou: "",
  };
}

export function blankCard(): CardLevelState {
  return {
    atags: [], atagAny: false, artist: "",
    set: "", rarities: [],
    formats: [], flags: [],
    edhOp: "<=", edh: "", jankOp: ">=", jank: "",
    sort: "name", order: "asc",
  };
}

export function blankState(): BuilderState {
  return { front: blankFace(), back: blankFace(), backNeg: false, card: blankCard() };
}
```

- [ ] **Step 4: Create `src/builder/constants.ts`**

```ts
import type { BuilderSort, Color, ColorMode, Op, Rarity } from "./types";

export const COLORS: Color[] = ["W", "U", "B", "R", "G"];
export const COLOR_NAME: Record<Color, string> = { W: "White", U: "Blue", B: "Black", R: "Red", G: "Green" };

export type ColorKey = Color | "none" | "multi";
export function colorKey(colors: Color[]): ColorKey {
  if (colors.length === 0) return "none";
  if (colors.length > 1) return "multi";
  return colors[0];
}

/** Same accents as CardPage.tsx. */
export const ACCENT: Record<ColorKey, string> = {
  none: "#5B6472", multi: "#B8860B",
  W: "#B8860B", U: "#1D5C9E", B: "#4A3164", R: "#C1432F", G: "#2F7A54",
};

/** [light, deep] frame gradient stops. */
export const FRAME_TINT: Record<ColorKey, [string, string]> = {
  none: ["#d3d6da", "#a3a8ae"],
  W: ["#f3ecd7", "#d8cba3"],
  U: ["#cfe1f1", "#8fb5d6"],
  B: ["#cdc6d1", "#8e8396"],
  R: ["#f3d2c6", "#d99a84"],
  G: ["#cfe5d7", "#8fbea0"],
  multi: ["#efdfa3", "#cfb05c"],
};

export const ART_GLOW: Record<ColorKey, string> = {
  none: "rgba(91,100,114,.35)", W: "rgba(184,134,11,.35)", U: "rgba(29,92,158,.35)",
  B: "rgba(74,49,100,.4)", R: "rgba(193,67,47,.35)", G: "rgba(47,122,84,.35)", multi: "rgba(184,134,11,.45)",
};

export function indicatorGradient(colors: Color[]): string {
  const n = colors.length;
  const stops = colors.map((c, i) => `${ACCENT[c]} ${(i / n) * 360}deg ${((i + 1) / n) * 360}deg`);
  return `conic-gradient(${stops.join(", ")})`;
}

export const RARITIES: Rarity[] = ["common", "uncommon", "rare", "mythic"];
export const RARITY_COLOR: Record<Rarity, string> = {
  common: "#1a1a1a", uncommon: "#9aa4ad", rare: "#c9a227", mythic: "#d4572a",
};

export const FORMATS = [
  "standard", "pioneer", "modern", "legacy", "vintage",
  "commander", "oathbreaker", "pauper", "brawl",
  "historic", "alchemy", "explorer", "timeless",
];
export const FLAGS = ["reserved", "promo", "reprint", "fullart", "colorless", "multicolor"];
export const SORT_FIELDS: BuilderSort[] = ["name", "mv", "edhrec", "usd", "usd_foil", "tix", "jank"];

export const TYPE_SUGGESTIONS = [
  "creature", "instant", "sorcery", "artifact", "enchantment", "land", "planeswalker", "battle",
  "legendary", "basic", "snow", "equipment", "aura", "vehicle", "saga",
  "elf", "dragon", "zombie", "goblin", "human", "angel", "wizard",
];
export const KEYWORD_SUGGESTIONS = [
  "flying", "trample", "deathtouch", "lifelink", "haste", "vigilance", "flash",
  "ward", "menace", "hexproof", "first strike", "double strike", "reach", "indestructible",
];

export const OP_GLYPH: Record<Op, string> = { "=": "", "<": "<", "<=": "≤", ">": ">", ">=": "≥" };
export const MODE_GLYPH: Record<ColorMode, string> = { including: "≥", exactly: "=", atmost: "≤" };
```

- [ ] **Step 5: Write the failing tests `src/builder/query.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { buildQuery, buildSegments, quote } from "./query";
import { blankState, type BuilderState, type CardLevelState, type FaceState } from "./types";

function make(
  front: Partial<FaceState> = {},
  card: Partial<CardLevelState> = {},
  back: Partial<FaceState> = {},
  backNeg = false,
): BuilderState {
  const s = blankState();
  return { front: { ...s.front, ...front }, back: { ...s.back, ...back }, card: { ...s.card, ...card }, backNeg };
}

describe("quote", () => {
  it("leaves simple values bare", () => expect(quote("bolt")).toBe("bolt"));
  it("quotes values with spaces or syntax characters", () => {
    expect(quote("sol ring")).toBe('"sol ring"');
    expect(quote("t:x")).toBe('"t:x"');
  });
  it("strips embedded double quotes", () => expect(quote('say "hi"')).toBe('"say hi"'));
});

describe("buildQuery: front face", () => {
  it("is empty for a blank card", () => expect(buildQuery(blankState())).toBe(""));

  it("quotes multi-word names and negates", () => {
    expect(buildQuery(make({ name: "sol ring" }))).toBe('"sol ring"');
    expect(buildQuery(make({ name: "bolt", nameNeg: true }))).toBe("-bolt");
  });

  it("writes colors with the chosen mode and target", () => {
    expect(buildQuery(make({ colors: ["U", "G"] }))).toBe("c>=ug");
    expect(buildQuery(make({ colors: ["U", "G"], colorMode: "exactly" }))).toBe("c=ug");
    expect(buildQuery(make({ colors: ["U", "G"], colorMode: "atmost", colorTarget: "id" }))).toBe("id<=ug");
  });

  it("adds mana value only when set", () => {
    expect(buildQuery(make({ mv: " " }))).toBe("");
    expect(buildQuery(make({ mv: "3", mvOp: "<=" }))).toBe("mv<=3");
  });

  it("writes types, negated when asked", () => {
    expect(buildQuery(make({ types: ["creature", "elf"] }))).toBe("t:creature t:elf");
    expect(buildQuery(make({ types: ["creature"], typesNeg: true }))).toBe("-t:creature");
  });

  it("writes text box criteria", () => {
    expect(buildQuery(make({ keywords: ["flying"], phrases: ["draw a card"], otags: ["ramp", "draw"] })))
      .toBe('keyword:flying o:"draw a card" otag:ramp otag:draw');
    expect(buildQuery(make({ otags: ["ramp", "draw"], otagAny: true }))).toBe("(otag:ramp OR otag:draw)");
    expect(buildQuery(make({ otags: ["ramp"], otagAny: true }))).toBe("otag:ramp");
    expect(buildQuery(make({ keywords: ["first strike"] }))).toBe('keyword:"first strike"');
  });

  it("negates every text box criterion when textNeg is set", () => {
    expect(buildQuery(make({ keywords: ["flying"], phrases: ["draw"], otags: ["ramp", "draw"], otagAny: true, textNeg: true })))
      .toBe('-keyword:flying -o:"draw" -(otag:ramp OR otag:draw)');
  });

  it("writes flavor and power/toughness", () => {
    expect(buildQuery(make({ flavor: "urza", pow: "4", powOp: ">=", tou: "2", touOp: "<=" })))
      .toBe('ft:"urza" pow>=4 tou<=2');
  });
});

describe("buildQuery: whole card", () => {
  it("writes art, set, rarity, formats, flags and ranks", () => {
    expect(buildQuery(make({}, {
      atags: ["dragon"], artist: "rebecca guay", set: "MH3", rarities: ["rare", "mythic"],
      formats: [{ name: "commander", legal: true }, { name: "modern", legal: false }],
      flags: ["reserved"], edh: "1000", edhOp: "<=", jank: "7", jankOp: ">=",
    }))).toBe('atag:dragon artist:"rebecca guay" s:mh3 (r:rare OR r:mythic) f:commander -f:modern is:reserved edhrank<=1000 jank>=7');
  });

  it("groups illustration tags with OR when atagAny", () => {
    expect(buildQuery(make({}, { atags: ["dragon", "moon"], atagAny: true }))).toBe("(atag:dragon OR atag:moon)");
  });

  it("uses a single rarity without parentheses", () => {
    expect(buildQuery(make({}, { rarities: ["rare"] }))).toBe("r:rare");
  });

  it("adds sort/order only when not the default", () => {
    expect(buildQuery(make({}, { sort: "usd", order: "desc" }))).toBe("sort:usd order:desc");
    expect(buildQuery(make({}, { sort: "name", order: "asc" }))).toBe("");
  });
});

describe("buildQuery: back face", () => {
  it("wraps back criteria in back:()", () => {
    expect(buildQuery(make({ types: ["enchantment"] }, {}, { types: ["creature"], pow: "5", powOp: ">=" })))
      .toBe("t:enchantment back:(t:creature pow>=5)");
  });

  it("negates the whole back group", () => {
    expect(buildQuery(make({}, {}, { types: ["creature"] }, true))).toBe("-back:(t:creature)");
  });

  it("ignores mana value and commander identity on the back", () => {
    expect(buildQuery(make({}, {}, { mv: "3", colors: ["G"], colorTarget: "id" }))).toBe("back:(c>=g)");
  });

  it("omits back:() when the back is blank, even if negated", () => {
    expect(buildQuery(make({}, {}, {}, true))).toBe("");
  });
});

describe("buildSegments", () => {
  it("labels each token with its scope, in order", () => {
    expect(buildSegments(make({ types: ["creature"] }, { rarities: ["rare"], sort: "usd" }, { types: ["land"] }))).toEqual([
      { text: "t:creature", kind: "front" },
      { text: "r:rare", kind: "card" },
      { text: "back:(t:land)", kind: "back" },
      { text: "sort:usd", kind: "meta" },
    ]);
  });
});
```

- [ ] **Step 6: Run it to make sure it fails**

Run: `cd frontend && npm test`
Expected: FAIL: `Failed to resolve import "./query"`.

- [ ] **Step 7: Implement `src/builder/query.ts`**

```ts
import type { BuilderState, CardLevelState, FaceState } from "./types";

export type SegmentKind = "front" | "card" | "back" | "meta";
export interface Segment {
  text: string;
  kind: SegmentKind;
}

const COLOR_OP = { including: ">=", exactly: "=", atmost: "<=" } as const;

/** Quote a value if it contains whitespace or query syntax characters. */
export function quote(value: string): string {
  const v = value.replace(/"/g, "");
  return /[\s:()]/.test(v) ? `"${v}"` : v;
}

const tok = (key: string, value: string) => `${key}:${quote(value)}`;
const neg = (negated: boolean) => (negated ? "-" : "");
const phrase = (key: string, value: string) => `${key}:"${value.replace(/"/g, "")}"`;

function group(tokens: string[], any: boolean, negated: boolean): string[] {
  if (tokens.length === 0) return [];
  if (any && tokens.length > 1) return [`${neg(negated)}(${tokens.join(" OR ")})`];
  return tokens.map((t) => neg(negated) + t);
}

export function faceTokens(f: FaceState, isBack: boolean): string[] {
  const out: string[] = [];
  const name = f.name.trim();
  if (name) out.push(neg(f.nameNeg) + quote(name));
  if (f.colors.length > 0) {
    const key = isBack ? "c" : f.colorTarget;
    out.push(`${key}${COLOR_OP[f.colorMode]}${f.colors.join("").toLowerCase()}`);
  }
  if (!isBack && f.mv.trim() !== "") out.push(`mv${f.mvOp}${f.mv.trim()}`);
  out.push(...f.types.map((t) => neg(f.typesNeg) + tok("t", t)));
  out.push(...f.keywords.map((k) => neg(f.textNeg) + tok("keyword", k)));
  out.push(...f.phrases.map((p) => neg(f.textNeg) + phrase("o", p)));
  out.push(...group(f.otags.map((t) => tok("otag", t)), f.otagAny, f.textNeg));
  const flavor = f.flavor.trim();
  if (flavor) out.push(phrase("ft", flavor));
  if (f.pow.trim() !== "") out.push(`pow${f.powOp}${f.pow.trim()}`);
  if (f.tou.trim() !== "") out.push(`tou${f.touOp}${f.tou.trim()}`);
  return out;
}

export function cardTokens(c: CardLevelState): string[] {
  const out: string[] = [];
  out.push(...group(c.atags.map((t) => tok("atag", t)), c.atagAny, false));
  if (c.artist.trim()) out.push(tok("artist", c.artist.trim()));
  if (c.set.trim()) out.push(tok("s", c.set.trim().toLowerCase()));
  out.push(...group(c.rarities.map((r) => `r:${r}`), true, false));
  c.formats.forEach((f) => out.push(`${neg(!f.legal)}f:${f.name}`));
  c.flags.forEach((f) => out.push(`is:${f}`));
  if (c.edh.trim() !== "") out.push(`edhrank${c.edhOp}${c.edh.trim()}`);
  if (c.jank.trim() !== "") out.push(`jank${c.jankOp}${c.jank.trim()}`);
  return out;
}

export function buildSegments(s: BuilderState): Segment[] {
  const segs: Segment[] = [];
  faceTokens(s.front, false).forEach((text) => segs.push({ text, kind: "front" }));
  cardTokens(s.card).forEach((text) => segs.push({ text, kind: "card" }));
  const back = faceTokens(s.back, true);
  if (back.length > 0) segs.push({ text: `${neg(s.backNeg)}back:(${back.join(" ")})`, kind: "back" });
  if (s.card.sort !== "name") segs.push({ text: `sort:${s.card.sort}`, kind: "meta" });
  if (s.card.order !== "asc") segs.push({ text: `order:${s.card.order}`, kind: "meta" });
  return segs;
}

export function segmentsToQuery(segs: Segment[]): string {
  return segs.map((s) => s.text).join(" ");
}

export function buildQuery(s: BuilderState): string {
  return segmentsToQuery(buildSegments(s));
}
```

- [ ] **Step 8: Run tests and type-check**

Run: `npm test && npx tsc -b`
Expected: all `query.test.ts` tests PASS; `tsc` exits 0.

- [ ] **Step 9: Sanity-check generated syntax against the real parser**

```bash
for q in 'c>=ug mv<=3 t:creature' '-keyword:flying -(otag:ramp OR otag:draw)' 't:enchantment back:(t:creature pow>=5)' '-back:(t:creature)' 'id<=ug (r:rare OR r:mythic) -f:modern sort:usd order:desc'; do
  curl -s -G localhost:8000/cards/search --data-urlencode "q=$q" --data-urlencode page_size=1 -o /dev/null -w "%{http_code} $q\n"
done
```

Expected: every line starts with `200`.

- [ ] **Step 10: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vitest.config.ts frontend/vite.config.ts frontend/src/builder/types.ts frontend/src/builder/constants.ts frontend/src/builder/query.ts frontend/src/builder/query.test.ts
git commit -m "Card builder: state types and query generation"
```

---

### Task 3: Builder reducer

**Files:**
- Create: `frontend/src/builder/reducer.ts`
- Test: `frontend/src/builder/reducer.test.ts`

**Interfaces:**
- Consumes: `types.ts`, `COLORS`, `RARITIES` from Task 2.
- Produces: `type BuilderAction` (union below) and `builderReducer(state: BuilderState, action: BuilderAction): BuilderState`.

- [ ] **Step 1: Write the failing tests `src/builder/reducer.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { builderReducer } from "./reducer";
import { blankState } from "./types";

describe("builderReducer", () => {
  it("toggles colors keeping WUBRG order", () => {
    let s = builderReducer(blankState(), { type: "toggleColor", side: "front", color: "G" });
    s = builderReducer(s, { type: "toggleColor", side: "front", color: "W" });
    expect(s.front.colors).toEqual(["W", "G"]);
    s = builderReducer(s, { type: "toggleColor", side: "front", color: "W" });
    expect(s.front.colors).toEqual(["G"]);
  });

  it("only touches the requested face", () => {
    const s = builderReducer(blankState(), { type: "setFace", side: "back", patch: { name: "x" } });
    expect(s.back.name).toBe("x");
    expect(s.front.name).toBe("");
  });

  it("normalizes, dedupes and ignores empty chips", () => {
    let s = builderReducer(blankState(), { type: "addChip", side: "front", field: "types", value: "  Creature " });
    s = builderReducer(s, { type: "addChip", side: "front", field: "types", value: "creature" });
    expect(s.front.types).toEqual(["creature"]);
    s = builderReducer(s, { type: "addChip", side: "front", field: "phrases", value: "Draw  a Card" });
    expect(s.front.phrases).toEqual(["Draw a Card"]);
    expect(builderReducer(s, { type: "addChip", side: "front", field: "otags", value: "   " })).toBe(s);
  });

  it("removes chips by index", () => {
    let s = builderReducer(blankState(), { type: "addChip", side: "back", field: "otags", value: "ramp" });
    s = builderReducer(s, { type: "addChip", side: "back", field: "otags", value: "draw" });
    s = builderReducer(s, { type: "removeChip", side: "back", field: "otags", index: 0 });
    expect(s.back.otags).toEqual(["draw"]);
  });

  it("manages art tags", () => {
    let s = builderReducer(blankState(), { type: "addArtTag", value: " Dragon" });
    s = builderReducer(s, { type: "addArtTag", value: "dragon" });
    expect(s.card.atags).toEqual(["dragon"]);
    s = builderReducer(s, { type: "removeArtTag", index: 0 });
    expect(s.card.atags).toEqual([]);
  });

  it("toggles rarities in rarity order and flags in click order", () => {
    let s = builderReducer(blankState(), { type: "toggleRarity", rarity: "mythic" });
    s = builderReducer(s, { type: "toggleRarity", rarity: "common" });
    expect(s.card.rarities).toEqual(["common", "mythic"]);
    s = builderReducer(s, { type: "toggleFlag", flag: "promo" });
    s = builderReducer(s, { type: "toggleFlag", flag: "reserved" });
    expect(s.card.flags).toEqual(["promo", "reserved"]);
    s = builderReducer(s, { type: "toggleFlag", flag: "promo" });
    expect(s.card.flags).toEqual(["reserved"]);
  });

  it("adds, updates and removes format rules", () => {
    let s = builderReducer(blankState(), { type: "addFormat" });
    expect(s.card.formats).toEqual([{ name: "commander", legal: true }]);
    s = builderReducer(s, { type: "updateFormat", index: 0, patch: { name: "modern", legal: false } });
    expect(s.card.formats).toEqual([{ name: "modern", legal: false }]);
    s = builderReducer(s, { type: "removeFormat", index: 0 });
    expect(s.card.formats).toEqual([]);
  });

  it("sets card fields, backNeg, and resets", () => {
    let s = builderReducer(blankState(), { type: "setCard", patch: { artist: "guay", sort: "usd" } });
    s = builderReducer(s, { type: "setBackNeg", value: true });
    expect(s.card.artist).toBe("guay");
    expect(s.card.sort).toBe("usd");
    expect(s.backNeg).toBe(true);
    expect(builderReducer(s, { type: "reset" })).toEqual(blankState());
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npm test`
Expected: FAIL: `Failed to resolve import "./reducer"`.

- [ ] **Step 3: Implement `src/builder/reducer.ts`**

```ts
import { COLORS, RARITIES } from "./constants";
import {
  blankState,
  type BuilderState, type CardLevelState, type Color, type FaceChipField,
  type FaceState, type FormatRule, type Rarity, type Side,
} from "./types";

export type BuilderAction =
  | { type: "setFace"; side: Side; patch: Partial<FaceState> }
  | { type: "toggleColor"; side: Side; color: Color }
  | { type: "addChip"; side: Side; field: FaceChipField; value: string }
  | { type: "removeChip"; side: Side; field: FaceChipField; index: number }
  | { type: "setCard"; patch: Partial<CardLevelState> }
  | { type: "addArtTag"; value: string }
  | { type: "removeArtTag"; index: number }
  | { type: "toggleRarity"; rarity: Rarity }
  | { type: "toggleFlag"; flag: string }
  | { type: "addFormat" }
  | { type: "updateFormat"; index: number; patch: Partial<FormatRule> }
  | { type: "removeFormat"; index: number }
  | { type: "setBackNeg"; value: boolean }
  | { type: "reset" };

function withFace(state: BuilderState, side: Side, face: FaceState): BuilderState {
  return side === "front" ? { ...state, front: face } : { ...state, back: face };
}

function withCard(state: BuilderState, patch: Partial<CardLevelState>): BuilderState {
  return { ...state, card: { ...state.card, ...patch } };
}

/** Collapse whitespace; lowercase everything except free-text phrases. */
function normalize(value: string, keepCase: boolean): string {
  const v = value.trim().replace(/\s+/g, " ");
  return keepCase ? v : v.toLowerCase();
}

function toggleOrdered<T>(order: T[], current: T[], item: T): T[] {
  const has = current.includes(item);
  return order.filter((x) => (x === item ? !has : current.includes(x)));
}

export function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case "setFace":
      return withFace(state, action.side, { ...state[action.side], ...action.patch });

    case "toggleColor": {
      const face = state[action.side];
      return withFace(state, action.side, { ...face, colors: toggleOrdered(COLORS, face.colors, action.color) });
    }

    case "addChip": {
      const face = state[action.side];
      const value = normalize(action.value, action.field === "phrases");
      if (!value || face[action.field].includes(value)) return state;
      const next = { ...face };
      next[action.field] = [...face[action.field], value];
      return withFace(state, action.side, next);
    }

    case "removeChip": {
      const face = state[action.side];
      const next = { ...face };
      next[action.field] = face[action.field].filter((_, i) => i !== action.index);
      return withFace(state, action.side, next);
    }

    case "setCard":
      return withCard(state, action.patch);

    case "addArtTag": {
      const value = normalize(action.value, false);
      if (!value || state.card.atags.includes(value)) return state;
      return withCard(state, { atags: [...state.card.atags, value] });
    }

    case "removeArtTag":
      return withCard(state, { atags: state.card.atags.filter((_, i) => i !== action.index) });

    case "toggleRarity":
      return withCard(state, { rarities: toggleOrdered(RARITIES, state.card.rarities, action.rarity) });

    case "toggleFlag": {
      const flags = state.card.flags;
      return withCard(state, {
        flags: flags.includes(action.flag) ? flags.filter((f) => f !== action.flag) : [...flags, action.flag],
      });
    }

    case "addFormat":
      return withCard(state, { formats: [...state.card.formats, { name: "commander", legal: true }] });

    case "updateFormat":
      return withCard(state, {
        formats: state.card.formats.map((f, i) => (i === action.index ? { ...f, ...action.patch } : f)),
      });

    case "removeFormat":
      return withCard(state, { formats: state.card.formats.filter((_, i) => i !== action.index) });

    case "setBackNeg":
      return { ...state, backNeg: action.value };

    case "reset":
      return blankState();
  }
}
```

- [ ] **Step 4: Run tests and type-check**

Run: `npm test && npx tsc -b`
Expected: all tests PASS (query + reducer); `tsc` exits 0.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/builder/reducer.ts frontend/src/builder/reducer.test.ts
git commit -m "Card builder: state reducer"
```

---

### Task 4: Data hooks and shared controls

**Files:**
- Create: `frontend/src/builder/useDebouncedValue.ts`, `frontend/src/builder/useSuggestions.ts`, `frontend/src/builder/useMatchPreview.ts`, `frontend/src/builder/controls.tsx`
- Modify: `frontend/src/index.css` (append the control styles)

**Interfaces:**
- Consumes: `Op`, `OPS` (Task 2); `GET /api/tags`, `GET /api/sets` (Task 1); `CardSummary`, `CardSearchResponse` from `src/types.ts`.
- Produces:
  - `useDebouncedValue<T>(value: T, ms: number): T`
  - `type SuggestionSource = "oracle" | "illustration" | "set"`, `interface Suggestion { value: string; label: string }`, `useSuggestions(source: SuggestionSource | null, text: string): Suggestion[]`
  - `interface MatchPreview { total: number | null; top: CardSummary | null; error: string | null; loading: boolean }`, `useMatchPreview(query: string): MatchPreview`
  - `inputClass: string`, `Eyebrow({ accent, children })`, `Field({ label, aside?, children })`, `Segmented<T extends string>({ value, options, onChange, ariaLabel })`, `NegToggle({ negated, onChange, ariaLabel, labels? })`, `OpNumber({ op, value, onOp, onValue, ariaLabel, placeholder? })`, `ChipInput({ values, onAdd, onRemove, ariaLabel, placeholder, suggestions?, source? })`, `SetPicker({ value, onChange })`

- [ ] **Step 1: Create `src/builder/useDebouncedValue.ts`**

```ts
import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}
```

- [ ] **Step 2: Create `src/builder/useSuggestions.ts`**

```ts
import { useEffect, useState } from "react";
import { useDebouncedValue } from "./useDebouncedValue";

export type SuggestionSource = "oracle" | "illustration" | "set";
export interface Suggestion {
  value: string;
  label: string;
}

/** Autocomplete from mtgDB: tags via /api/tags, sets via /api/sets. Needs 2+ characters. */
export function useSuggestions(source: SuggestionSource | null, text: string): Suggestion[] {
  const term = useDebouncedValue(text.trim(), 200);
  const [items, setItems] = useState<Suggestion[]>([]);

  useEffect(() => {
    if (!source || term.length < 2) {
      setItems([]);
      return;
    }
    const ctrl = new AbortController();
    const url = source === "set"
      ? `/api/sets?${new URLSearchParams({ q: term, page_size: "10" })}`
      : `/api/tags?${new URLSearchParams({ type: source, q: term, limit: "12" })}`;
    fetch(url, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Error ${r.status}`))))
      .then((data) => {
        if (source === "set") {
          const sets = (data as { sets: { code: string; name: string }[] }).sets;
          setItems(sets.map((s) => ({ value: s.code.toLowerCase(), label: `${s.code} · ${s.name}` })));
        } else {
          const tags = data as { slug: string; label: string | null }[];
          setItems(tags.map((t) => ({ value: t.slug, label: t.slug })));
        }
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setItems([]);
      });
    return () => ctrl.abort();
  }, [source, term]);

  return items;
}
```

- [ ] **Step 3: Create `src/builder/useMatchPreview.ts`**

```ts
import { useEffect, useState } from "react";
import type { CardSearchResponse, CardSummary } from "../types";
import { useDebouncedValue } from "./useDebouncedValue";

export interface MatchPreview {
  total: number | null;
  top: CardSummary | null;
  error: string | null;
  loading: boolean;
}

const EMPTY: MatchPreview = { total: null, top: null, error: null, loading: false };

/** Debounced count + top result for the query being built. */
export function useMatchPreview(query: string): MatchPreview {
  const q = useDebouncedValue(query.trim(), 350);
  const [state, setState] = useState<MatchPreview>(EMPTY);

  useEffect(() => {
    if (!q) {
      setState(EMPTY);
      return;
    }
    const ctrl = new AbortController();
    setState((s) => ({ ...s, loading: true }));
    fetch(`/api/cards/search?${new URLSearchParams({ q, page_size: "1" })}`, { signal: ctrl.signal })
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(typeof body.detail === "string" ? body.detail : `Search failed (${r.status})`);
        return body as CardSearchResponse;
      })
      .then((data) => setState({ total: data.total, top: data.cards[0] ?? null, error: null, loading: false }))
      .catch((e: Error) => {
        if (!ctrl.signal.aborted) setState({ total: null, top: null, error: e.message, loading: false });
      });
    return () => ctrl.abort();
  }, [q]);

  return state;
}
```

- [ ] **Step 4: Create `src/builder/controls.tsx`**

```tsx
import { useState, type ReactNode } from "react";
import { OPS, type Op } from "./types";
import { useSuggestions, type SuggestionSource } from "./useSuggestions";

export const inputClass =
  "font-body text-sm bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 min-w-0";

export function Eyebrow({ accent, children }: { accent: string; children: ReactNode }) {
  return (
    <p className="flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500 mb-3">
      <span className="w-1.5 h-1.5 rounded-sm transition-colors" style={{ backgroundColor: accent }} />
      {children}
    </p>
  );
}

export function Field({ label, aside, children }: { label: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="font-body text-xs font-semibold text-neutral-700">{label}</span>
        {aside}
      </div>
      {children}
    </div>
  );
}

interface SegOption<T extends string> {
  value: T;
  label: string;
  danger?: boolean;
}

export function Segmented<T extends string>({
  value, options, onChange, ariaLabel,
}: { value: T; options: SegOption<T>[]; onChange: (v: T) => void; ariaLabel: string }) {
  return (
    <div className="cb-seg" role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          className={`${o.value === value ? "is-on" : ""} ${o.danger ? "is-danger" : ""}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function NegToggle({
  negated, onChange, ariaLabel, labels = ["is", "is not"],
}: { negated: boolean; onChange: (negated: boolean) => void; ariaLabel: string; labels?: [string, string] }) {
  return (
    <Segmented
      ariaLabel={ariaLabel}
      value={negated ? "not" : "is"}
      onChange={(v) => onChange(v === "not")}
      options={[{ value: "is", label: labels[0] }, { value: "not", label: labels[1], danger: true }]}
    />
  );
}

export function OpNumber({
  op, value, onOp, onValue, ariaLabel, placeholder = "any",
}: { op: Op; value: string; onOp: (op: Op) => void; onValue: (v: string) => void; ariaLabel: string; placeholder?: string }) {
  return (
    <div className="flex gap-1.5">
      <select className={`${inputClass} w-16`} aria-label={`${ariaLabel} comparison`} value={op} onChange={(e) => onOp(e.target.value as Op)}>
        {OPS.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <input
        type="number"
        inputMode="numeric"
        className={`${inputClass} w-20`}
        aria-label={ariaLabel}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onValue(e.target.value)}
      />
    </div>
  );
}

interface ChipInputProps {
  values: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  ariaLabel: string;
  placeholder: string;
  /** Static suggestions, filtered by what's typed. */
  suggestions?: string[];
  /** Remote autocomplete source; overrides `suggestions`. */
  source?: SuggestionSource;
}

export function ChipInput({ values, onAdd, onRemove, ariaLabel, placeholder, suggestions = [], source }: ChipInputProps) {
  const [text, setText] = useState("");
  const remote = useSuggestions(source ?? null, text);
  const typed = text.trim().toLowerCase();
  const shown = source
    ? remote.filter((s) => !values.includes(s.value))
    : suggestions
        .filter((s) => !values.includes(s) && (!typed || s.includes(typed)))
        .slice(0, 12)
        .map((s) => ({ value: s, label: s }));

  const add = (v: string) => {
    onAdd(v);
    setText("");
  };

  return (
    <>
      <div className="cb-chips">
        {values.map((v, i) => (
          <span key={v} className="cb-chip">
            {v}
            <button type="button" aria-label={`Remove ${v}`} onClick={() => onRemove(i)}>✕</button>
          </span>
        ))}
        <input
          type="text"
          value={text}
          aria-label={ariaLabel}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && text.trim()) {
              e.preventDefault();
              add(text);
            } else if (e.key === "Backspace" && !text && values.length > 0) {
              onRemove(values.length - 1);
            }
          }}
        />
      </div>
      {shown.length > 0 && (
        <div className="cb-suggest">
          {shown.map((s) => (
            <button key={s.value} type="button" onClick={() => add(s.value)}>+ {s.label}</button>
          ))}
        </div>
      )}
    </>
  );
}

const SET_CODE = /^[a-z0-9]{2,6}$/i;

/** Set code input with name/code autocomplete. Only code-shaped text is committed. */
export function SetPicker({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const [text, setText] = useState(value);
  const items = useSuggestions("set", text === value ? "" : text);
  return (
    <>
      <input
        type="text"
        className={`${inputClass} w-full`}
        value={text}
        aria-label="Set"
        placeholder="Set name or code, e.g. mh3"
        onChange={(e) => {
          const t = e.target.value;
          setText(t);
          onChange(SET_CODE.test(t.trim()) ? t.trim().toLowerCase() : "");
        }}
      />
      {items.length > 0 && (
        <div className="cb-suggest">
          {items.map((s) => (
            <button key={s.value} type="button" onClick={() => { setText(s.value); onChange(s.value); }}>
              {s.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 5: Append control styles to `src/index.css`**

```css
/* ── Card builder: controls ───────────────────────────────────────── */
.cb-seg { display: inline-flex; border: 1px solid #d4d4d4; border-radius: 999px; overflow: hidden; font-size: 12px; background: #fff; font-family: "Instrument Sans", sans-serif; }
.cb-seg button { border: none; background: none; padding: 5px 11px; cursor: pointer; color: #737373; }
.cb-seg button.is-on { background: #171717; color: #fff; }
.cb-seg button.is-on.is-danger { background: #b91c1c; }
.cb-chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 6px; border: 1px solid #d4d4d4; border-radius: 10px; background: #fff; align-items: center; }
.cb-chips:focus-within { border-color: #171717; box-shadow: 0 0 0 1px #171717; }
.cb-chips input { border: none; padding: 3px 4px; flex: 1; min-width: 110px; outline: none; font: inherit; font-size: 13px; background: transparent; }
.cb-chip { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; padding: 3px 6px 3px 10px; border-radius: 999px; background: #171717; color: #fff; }
.cb-chip button { border: none; background: rgba(255,255,255,.2); color: #fff; border-radius: 50%; width: 16px; height: 16px; font-size: 10px; line-height: 1; cursor: pointer; padding: 0; }
.cb-suggest { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 7px; }
.cb-suggest button { font-size: 11.5px; border: 1px dashed #d4d4d4; background: none; border-radius: 999px; padding: 3px 9px; color: #737373; cursor: pointer; }
.cb-suggest button:hover { border-style: solid; color: #171717; }
.cb-check { display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; padding: 5px 11px; border-radius: 999px; border: 1px solid #d4d4d4; background: #fff; cursor: pointer; color: #404040; text-transform: capitalize; }
.cb-check.is-on { background: #171717; border-color: #171717; color: #fff; }
.cb-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.cb-pill-btn { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: #737373; border: 1px solid #d4d4d4; border-radius: 999px; padding: 7px 14px; background: #fff; cursor: pointer; transition: all .15s; }
.cb-pill-btn:hover { color: #171717; border-color: #a3a3a3; }
.cb-pill-btn.is-on { background: #1D5C9E; border-color: #1D5C9E; color: #fff; }
.cb-note { font-size: 12px; color: #737373; background: #f5f5f5; border-radius: 10px; padding: 9px 11px; line-height: 1.45; }
```

- [ ] **Step 6: Type-check**

Run: `npx tsc -b && npm test`
Expected: exits 0; tests still PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/builder/useDebouncedValue.ts frontend/src/builder/useSuggestions.ts frontend/src/builder/useMatchPreview.ts frontend/src/builder/controls.tsx frontend/src/index.css
git commit -m "Card builder: data hooks and shared controls"
```

---

### Task 5: The card, the page shell and the route

**Files:**
- Create: `frontend/src/builder/SetSymbol.tsx`, `frontend/src/builder/BuilderCard.tsx`, `frontend/src/pages/BuilderPage.tsx`
- Modify: `frontend/src/App.tsx`, `frontend/src/components/SearchHeader.tsx`, `frontend/src/index.css`

**Interfaces:**
- Consumes: everything from Tasks 2–4.
- Produces: `SetSymbol({ rarities: Rarity[]; muted: boolean })`; `BuilderCard(props: BuilderCardProps)` with
  `interface BuilderCardProps { state: BuilderState; side: Side; openRegion: Region | null; artUrl: string | null; artCaption: string | null; dimmed: boolean; onRegion: (region: Region, el: HTMLElement) => void; onFlip: (side: Side) => void }`;
  default export `BuilderPage`. In this task the page opens no popover yet (Task 6), so `onRegion` only records the open region.

- [ ] **Step 1: Create `src/builder/SetSymbol.tsx`**

```tsx
import { useId } from "react";
import { RARITY_COLOR } from "./constants";
import type { Rarity } from "./types";

/** Generic set symbol (not a real set's); fill = selected rarities, split diagonally. */
export default function SetSymbol({ rarities, muted }: { rarities: Rarity[]; muted: boolean }) {
  const id = `cb-set-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const colors = rarities.length > 0 ? rarities.map((r) => RARITY_COLOR[r]) : ["rgba(0,0,0,.28)"];
  const n = colors.length;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden style={{ opacity: muted ? 0.45 : 1 }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          {colors.flatMap((c, i) => [
            <stop key={`${i}a`} offset={`${(i / n) * 100}%`} stopColor={c} />,
            <stop key={`${i}b`} offset={`${((i + 1) / n) * 100}%`} stopColor={c} />,
          ])}
        </linearGradient>
      </defs>
      <path
        d="M12 1.5 21 6v6.5c0 5-3.9 8.6-9 10-5.1-1.4-9-5-9-10V6z"
        fill={`url(#${id})`}
        stroke="#111"
        strokeWidth={1.3}
        strokeDasharray={rarities.length > 0 ? undefined : "2.5 2"}
      />
      <path d="M12 6.5 16 12l-4 5.5L8 12z" fill="rgba(255,255,255,.55)" />
    </svg>
  );
}
```

- [ ] **Step 2: Create `src/builder/BuilderCard.tsx`**

```tsx
import type { CSSProperties, ReactNode } from "react";
import {
  ART_GLOW, FRAME_TINT, MODE_GLYPH, OP_GLYPH, colorKey, indicatorGradient,
} from "./constants";
import { faceTokens } from "./query";
import SetSymbol from "./SetSymbol";
import { LOCKED_ON_BACK, type BuilderState, type Region, type Side } from "./types";

export interface BuilderCardProps {
  state: BuilderState;
  side: Side;
  openRegion: Region | null;
  /** Art of the top matching card, shown in the front art box. */
  artUrl: string | null;
  artCaption: string | null;
  /** True while a custom (text-edited) query is active. */
  dimmed: boolean;
  onRegion: (region: Region, el: HTMLElement) => void;
  onFlip: (side: Side) => void;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface FaceProps extends Omit<BuilderCardProps, "side" | "dimmed" | "onFlip"> {
  faceSide: Side;
  current: Side;
}

function Face({ state, faceSide, current, openRegion, artUrl, artCaption, onRegion }: FaceProps) {
  const f = state[faceSide];
  const c = state.card;
  const isBack = faceSide === "back";
  const hidden = faceSide !== current;
  const key = colorKey(f.colors);
  const [tint, deep] = FRAME_TINT[key];

  const region = (r: Region, label: string, className: string, children: ReactNode, style?: CSSProperties) => {
    const locked = isBack && LOCKED_ON_BACK.includes(r);
    const isOpen = !hidden && openRegion === r;
    return (
      <button
        type="button"
        className={`cb-region ${className}${isOpen ? " is-open" : ""}${locked ? " is-locked" : ""}`}
        aria-label={label}
        aria-expanded={isOpen}
        style={style}
        onClick={(e) => onRegion(r, e.currentTarget)}
      >
        {children}
      </button>
    );
  };

  let mana: ReactNode;
  if (isBack) {
    mana = f.colors.length > 0
      ? <span className="cb-indicator" style={{ background: indicatorGradient(f.colors) }} />
      : <span className="cb-pip cb-pip-empty">◐</span>;
  } else if (f.colors.length > 0 || f.mv.trim()) {
    mana = (
      <>
        {f.colors.length > 0 && (
          <span className="cb-mode-tag">{f.colorTarget === "id" ? "id " : ""}{MODE_GLYPH[f.colorMode]}</span>
        )}
        {f.colors.map((col) => <span key={col} className={`cb-pip cb-pip-${col}`}>{col}</span>)}
        {f.mv.trim() && <span className="cb-pip cb-pip-mv">mv {OP_GLYPH[f.mvOp]}{f.mv.trim()}</span>}
      </>
    );
  } else {
    mana = <span className="cb-pip cb-pip-empty">+</span>;
  }

  const name = f.name.trim()
    ? <span className="cb-ellipsis">{f.nameNeg ? "not " : ""}{f.name}</span>
    : <span className="cb-ph">{isBack ? "Any back-face name" : "Any name"}</span>;

  const type = f.types.length > 0
    ? <span className="cb-ellipsis">{f.typesNeg ? "Not " : ""}{f.types.map(cap).join(f.typesNeg ? ", " : " ")}</span>
    : <span className="cb-ph">Any type</span>;

  const hasText = f.keywords.length > 0 || f.phrases.length > 0 || f.otags.length > 0;
  const text = hasText ? (
    <>
      {f.textNeg && <span className="cb-neg">Without</span>}
      {f.keywords.length > 0 && <span className="cb-kw">{f.keywords.map(cap).join(", ")}</span>}
      {f.phrases.map((p) => <span key={p} className="cb-phrase">“…{p}…”</span>)}
      {f.otags.length > 0 && (
        <span className="cb-chiprow">
          {f.otags.map((t, i) => (
            <span key={t} className="contents">
              {i > 0 && <span className="cb-mini cb-mini-join">{f.otagAny ? "or" : "and"}</span>}
              <span className="cb-mini">{t}</span>
            </span>
          ))}
        </span>
      )}
    </>
  ) : <span className="cb-ph">Rules text, keywords, or what the card does…</span>;

  const pt = f.pow.trim() || f.tou.trim()
    ? `${f.pow.trim() ? OP_GLYPH[f.powOp] + f.pow.trim() : "*"}/${f.tou.trim() ? OP_GLYPH[f.touOp] + f.tou.trim() : "*"}`
    : <span className="cb-ph text-[13px]">P / T</span>;

  const showArt = !isBack && artUrl;
  let art: ReactNode;
  if (isBack) {
    art = (
      <>
        <span className="cb-glyph">↺</span>
        <span className="cb-ph">Art, artist, set and rarity<br />are shared with the front</span>
      </>
    );
  } else if (c.atags.length > 0 || c.artist.trim()) {
    art = (
      <>
        <span className="cb-chiprow justify-center">
          {c.atags.map((t, i) => (
            <span key={t} className="contents">
              {i > 0 && <span className="cb-mini cb-mini-join">{c.atagAny ? "or" : "and"}</span>}
              <span className="cb-mini cb-mini-light">{t}</span>
            </span>
          ))}
        </span>
        {c.artist.trim() && <span className="cb-art-artist">by {c.artist}</span>}
      </>
    );
  } else if (showArt) {
    art = <span className="cb-art-caption">{artCaption}</span>;
  } else {
    art = (
      <>
        <span className="cb-glyph">✦</span>
        <span className="cb-ph">Any art: click to search by<br />what's in the illustration</span>
      </>
    );
  }

  const frameStyle = {
    "--cb-frame": tint,
    "--cb-frame-deep": deep,
    "--cb-art-glow": ART_GLOW[key],
  } as CSSProperties;

  return (
    <div className={`cb-face${isBack ? " is-back" : ""}`} inert={hidden}>
      <div className="cb-card">
        <div className="cb-frame" style={frameStyle}>
          <div className="cb-bar">
            {region("name", "Card name", "cb-name", name)}
            {region("mana", isBack ? "Color indicator" : "Mana cost and colors", "cb-mana", mana)}
          </div>
          {region(
            "art", "Illustration", `cb-art${showArt ? " has-image" : ""}`, art,
            showArt ? { backgroundImage: `linear-gradient(transparent 55%, rgba(0,0,0,.55)), url("${artUrl}")` } : undefined,
          )}
          <div className="cb-bar">
            {region("type", "Type line", "cb-type", type)}
            {region("set", "Set and rarity", "cb-set", <SetSymbol rarities={c.rarities} muted={isBack} />)}
          </div>
          {region("text", "Rules text", "cb-text", text)}
          {region("flavor", "Flavor text", "cb-flavor", f.flavor.trim() ? f.flavor : <span className="cb-ph text-[11.5px]">Flavor text</span>)}
          <div className="cb-foot">
            {region("art", "Artist", "cb-artist", (
              <>
                <span className="cb-setline">
                  {c.set ? c.set.toUpperCase() : "SET"}
                  {c.rarities.length > 0 && ` • ${c.rarities.map((r) => r[0].toUpperCase()).join("/")}`}
                </span>
                <span>✎ Illus. {c.artist.trim() || "any artist"}</span>
              </>
            ))}
            {region("pt", "Power and toughness", "cb-pt", pt)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BuilderCard(props: BuilderCardProps) {
  const { state, side, dimmed, onFlip } = props;
  const backTokens = faceTokens(state.back, true);
  return (
    <div className={`cb-scene${dimmed ? " is-dimmed" : ""}`}>
      <div className={`cb-flipper${side === "back" ? " is-flipped" : ""}`}>
        <Face {...props} faceSide="front" current={side} />
        <Face {...props} faceSide="back" current={side} />
      </div>
      {side === "front" && backTokens.length > 0 && !dimmed && (
        <button type="button" className="cb-back-tab" title="Turn over to edit the back face" onClick={() => onFlip("back")}>
          {state.backNeg ? "Back must not be" : "Back"} ▸ <small>{backTokens.join(" ")}</small>
        </button>
      )}
      {dimmed && (
        <p className="cb-dim-note">Custom query: the card is paused while you edit the text.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Append the card styles to `src/index.css`** (ported from `mockups/card-builder.html`)

```css
/* ── Card builder: card ───────────────────────────────────────────── */
.cb-scene { perspective: 1600px; width: 360px; max-width: 100%; height: 502px; margin: 0 auto; position: relative; }
.cb-flipper { position: absolute; inset: 0; transform-style: preserve-3d; transition: transform .7s cubic-bezier(.3,.7,.2,1), opacity .3s, filter .3s; }
.cb-flipper.is-flipped { transform: rotateY(180deg); }
.cb-scene.is-dimmed .cb-flipper { opacity: .35; filter: grayscale(.6); pointer-events: none; }
.cb-dim-note { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 240px; text-align: center; font-size: 13px; color: #92400e; background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 10px 14px; }
@media (prefers-reduced-motion: reduce) { .cb-flipper { transition: none; } }
.cb-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.cb-face.is-back { transform: rotateY(180deg); }
.cb-card { width: 100%; height: 100%; border-radius: 18px; background: #141414; padding: 13px; box-shadow: 0 28px 55px -22px rgba(0,0,0,.45); }
.cb-frame {
  height: 100%; border-radius: 9px 9px 14px 14px; padding: 9px 9px 7px; display: flex; flex-direction: column; gap: 6px;
  background: radial-gradient(120% 60% at 20% 0%, rgba(255,255,255,.45), transparent 60%), linear-gradient(160deg, var(--cb-frame) 0%, var(--cb-frame-deep) 100%);
}
.cb-face.is-back .cb-frame { filter: saturate(.9) brightness(.82); }

.cb-region { all: unset; box-sizing: border-box; cursor: pointer; position: relative; display: flex; align-items: center; border-radius: 7px; transition: box-shadow .15s; }
.cb-region:hover, .cb-region.is-open { box-shadow: 0 0 0 2px #171717, 0 0 0 5px rgba(23,23,23,.12); }
.cb-region:focus-visible { box-shadow: 0 0 0 2px #171717, 0 0 0 5px rgba(29,92,158,.35); }
.cb-region.is-locked { cursor: help; }
.cb-region.is-locked:hover { box-shadow: 0 0 0 2px #a3a3a3; }
.cb-ph { color: rgba(0,0,0,.38); font-style: italic; }
.cb-ellipsis { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.cb-bar {
  background: linear-gradient(180deg, rgba(255,255,255,.88), rgba(244,241,234,.95)); border: 1.5px solid rgba(0,0,0,.55); border-radius: 8px / 14px;
  height: 34px; padding: 0 10px; display: flex; align-items: center; justify-content: space-between; gap: 8px;
  box-shadow: 0 1px 0 rgba(255,255,255,.6) inset, 0 2px 3px rgba(0,0,0,.2);
}
.cb-name { flex: 1; min-width: 0; font-family: "Fraunces", serif; font-weight: 600; font-size: 16px; height: 26px; padding: 0 4px; }
.cb-mana { gap: 3px; height: 26px; padding: 0 3px; flex-shrink: 0; }
.cb-pip { width: 19px; height: 19px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 10.5px; font-weight: 700; color: #1a1a1a; box-shadow: 0 1px 1px rgba(0,0,0,.35); }
.cb-pip-W { background: #F8F1D8; } .cb-pip-U { background: #A9D3EE; } .cb-pip-B { background: #CBC2BF; } .cb-pip-R { background: #F1A98C; } .cb-pip-G { background: #9BD3AE; }
.cb-pip-mv { background: #d6d3cd; width: auto; padding: 0 6px; border-radius: 10px; }
.cb-pip-empty { background: transparent; border: 1.5px dashed rgba(0,0,0,.3); box-shadow: none; color: rgba(0,0,0,.35); }
.cb-mode-tag { font-size: 9px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: rgba(0,0,0,.45); margin-right: 2px; }
.cb-indicator { width: 15px; height: 15px; border-radius: 50%; border: 1.5px solid rgba(0,0,0,.6); margin-right: 6px; }

.cb-art {
  height: 196px; margin: 0 4px; border: 1.5px solid rgba(0,0,0,.6); border-radius: 3px; flex-direction: column; justify-content: center; gap: 8px; padding: 14px; text-align: center; font-size: 13px;
  background: repeating-linear-gradient(135deg, rgba(0,0,0,.035) 0 10px, transparent 10px 20px), radial-gradient(80% 90% at 50% 100%, var(--cb-art-glow), transparent 70%), linear-gradient(180deg, #ecebe7, #dcd9d2);
}
.cb-art.has-image { background-size: cover; background-position: center; justify-content: flex-end; }
.cb-glyph { font-size: 26px; opacity: .35; }
.cb-art-caption { font-size: 11px; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,.6); }
.cb-art-artist { font-size: 12px; color: #444; }
.cb-art.has-image .cb-art-artist { color: #fff; }

.cb-type { flex: 1; min-width: 0; font-family: "Fraunces", serif; font-weight: 600; font-size: 13.5px; height: 26px; padding: 0 4px; }
.cb-set { width: 30px; height: 26px; justify-content: center; flex-shrink: 0; }

.cb-text {
  flex: 1; margin: 0 4px; border: 1.5px solid rgba(0,0,0,.45); border-radius: 3px; flex-direction: column; align-items: stretch; justify-content: flex-start;
  background: linear-gradient(180deg, #f8f6f0, #f4f1ea); padding: 10px 12px; gap: 6px; font-size: 13px; line-height: 1.4; overflow: hidden;
}
.cb-kw { font-weight: 700; }
.cb-phrase { font-family: "Fraunces", serif; }
.cb-neg { color: #b91c1c; font-weight: 700; font-size: 11px; letter-spacing: .05em; text-transform: uppercase; }
.cb-chiprow { display: flex; flex-wrap: wrap; gap: 4px; }
.cb-mini { font-size: 10.5px; padding: 2px 7px; border-radius: 999px; background: rgba(0,0,0,.07); border: 1px solid rgba(0,0,0,.12); }
.cb-mini-light { background: rgba(255,255,255,.75); }
.cb-mini-join { background: none; border: none; color: #737373; padding: 2px 0; font-style: italic; }
.cb-flavor {
  margin: -7px 4px 0; padding: 6px 12px; min-height: 30px; font-family: "Fraunces", serif; font-style: italic; font-size: 12px; color: #444; background: #f4f1ea;
  border: 1.5px solid rgba(0,0,0,.45); border-top: 1px solid rgba(0,0,0,.18); border-radius: 0 0 3px 3px;
}
.cb-foot { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; padding: 0 4px; min-height: 30px; }
.cb-artist { font-size: 10px; color: rgba(0,0,0,.65); padding: 3px 5px; flex-direction: column; align-items: flex-start; }
.cb-setline { font-weight: 700; letter-spacing: .08em; }
.cb-pt {
  min-width: 66px; height: 30px; justify-content: center; padding: 0 10px; font-family: "Fraunces", serif; font-weight: 700; font-size: 15px; margin-bottom: 2px;
  background: linear-gradient(180deg, rgba(255,255,255,.9), rgba(244,241,234,.95)); border: 1.5px solid rgba(0,0,0,.55); border-radius: 8px / 12px; box-shadow: 0 2px 3px rgba(0,0,0,.2);
}

.cb-back-tab {
  position: absolute; right: 0; top: 56px; transform: translateX(100%); writing-mode: vertical-rl; max-height: 260px; padding: 12px 6px;
  background: #1D5C9E; color: #fff; font-size: 11.5px; font-weight: 600; border: none; border-radius: 0 9px 9px 0; cursor: pointer;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; box-shadow: 0 8px 16px -8px rgba(29,92,158,.6);
}
.cb-back-tab small { font-weight: 400; opacity: .85; margin-top: 6px; }
@media (max-width: 959px) {
  .cb-back-tab { writing-mode: horizontal-tb; right: auto; left: 50%; top: auto; bottom: -40px; transform: translateX(-50%); border-radius: 9px; padding: 7px 12px; max-width: 300px; }
}
```

- [ ] **Step 4: Create `src/pages/BuilderPage.tsx`** (popover wiring arrives in Task 6, preview and side panel in Task 7)

```tsx
import { useCallback, useMemo, useReducer, useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchHeader from "../components/SearchHeader";
import BuilderCard from "../builder/BuilderCard";
import { ACCENT, colorKey } from "../builder/constants";
import { NegToggle } from "../builder/controls";
import { buildSegments, segmentsToQuery } from "../builder/query";
import { builderReducer, type BuilderAction } from "../builder/reducer";
import { blankState, type Region, type Side } from "../builder/types";
import { useMatchPreview } from "../builder/useMatchPreview";

export default function BuilderPage() {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(builderReducer, undefined, blankState);
  const [side, setSide] = useState<Side>("front");
  const [open, setOpen] = useState<{ region: Region; anchor: HTMLElement } | null>(null);
  const [raw, setRaw] = useState<string | null>(null);

  const segments = useMemo(() => buildSegments(state), [state]);
  const generated = segmentsToQuery(segments);
  const query = raw ?? generated;
  const isCustom = raw !== null && raw.trim() !== generated;
  const preview = useMatchPreview(query);
  const accent = ACCENT[colorKey(state.front.colors)];

  const update = useCallback((action: BuilderAction) => {
    dispatch(action);
    setRaw(null);
  }, []);
  const flip = useCallback((to: Side) => {
    setOpen(null);
    setSide(to);
  }, []);
  const onRegion = useCallback((region: Region, anchor: HTMLElement) => {
    setOpen((o) => (o?.region === region ? null : { region, anchor }));
  }, []);

  const faceLabel = side === "back"
    ? state.backNeg ? "Back face · must NOT match" : "Back face · also matches split, adventure & flip halves"
    : "Front face";

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-body">
      <SearchHeader onSearch={(q) => navigate(`/?q=${encodeURIComponent(q)}`)} />

      <main className="max-w-6xl mx-auto px-5 lg:px-10 pt-7 pb-16 grid gap-10 lg:grid-cols-[400px_1fr] items-start">
        <section className="lg:sticky lg:top-5">
          <p className="text-sm text-neutral-500 mb-3.5">
            Click <b className="text-neutral-900 font-semibold">any part of the card</b> to describe what you're looking for.
          </p>
          <BuilderCard
            state={state}
            side={side}
            openRegion={open?.region ?? null}
            artUrl={!isCustom ? preview.top?.image_uris?.art_crop ?? null : null}
            artCaption={preview.top ? `Top match: ${preview.top.name}` : null}
            dimmed={isCustom}
            onRegion={onRegion}
            onFlip={flip}
          />
          <p className={`text-center text-[11px] font-semibold tracking-[0.12em] uppercase mt-2.5 ${side === "back" ? "text-[#1D5C9E]" : "text-neutral-400"}`}>
            {faceLabel}
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <button
              type="button"
              className={`cb-pill-btn${side === "back" ? " is-on" : ""}`}
              onClick={() => flip(side === "front" ? "back" : "front")}
            >
              <span aria-hidden>⇄</span> {side === "back" ? "Turn to front" : "Turn over"}
            </button>
            <button type="button" className="cb-pill-btn" onClick={() => { update({ type: "reset" }); flip("front"); }}>
              Reset card
            </button>
          </div>
          {side === "back" && (
            <div className="flex justify-center items-center gap-2 mt-3">
              <span className="text-xs text-neutral-500">Back face</span>
              <NegToggle
                ariaLabel="Back face match"
                labels={["matches", "doesn't match"]}
                negated={state.backNeg}
                onChange={(value) => update({ type: "setBackNeg", value })}
              />
            </div>
          )}
        </section>

        <section className="flex flex-col gap-5 min-w-0">
          <div>
            <h1 className="font-display font-semibold text-4xl leading-[1.1]">Build a search, one card at a time</h1>
            <div className="w-10 h-[3px] rounded-full mt-3 mb-3 transition-colors" style={{ backgroundColor: accent }} />
            <p className="text-neutral-700 leading-relaxed max-w-xl">
              Fill in the blank card with what you want: colors in the mana cost, types on the type line, words in the
              text box. Turn it over to search double-faced cards by their back. Codex Etherium writes the query for you.
            </p>
          </div>
          <p className="font-mono text-sm text-neutral-600 break-words">{query || "—"}</p>
        </section>
      </main>

      <footer className="border-t border-neutral-200 mt-6">
        <p className="max-w-6xl mx-auto px-6 lg:px-10 py-6 font-body text-xs text-neutral-400">
          Card data: MTGJSON &bull; Images and prices: Scryfall (CC BY 4.0)
        </p>
      </footer>
    </div>
  );
}
```

(The temporary `<p className="font-mono …">{query}</p>` is replaced by `QueryPreview` in Task 7.)

- [ ] **Step 5: Add the route in `src/App.tsx`**

Add the import `import BuilderPage from "./pages/BuilderPage";` and, next to the `/syntax` route:

```tsx
        <Route path="/builder" element={<BuilderPage />} />
```

- [ ] **Step 6: Add the header link in `src/components/SearchHeader.tsx`**

Immediately before the existing `<Link to="/syntax" …>Syntax help →</Link>`, add:

```tsx
        <Link
          to="/builder"
          className="hidden sm:inline font-body text-sm text-neutral-500 hover:text-neutral-900 transition-colors shrink-0"
        >
          Card builder
        </Link>
```

- [ ] **Step 7: Type-check, test, and look at it**

Run: `npx tsc -b && npm test`, then `npm run dev` and open `http://localhost:5173/builder` (the dev proxy now works because of Task 2 Step 2; mtgDB API must be up on :8000).
Expected: blank gray card renders with placeholders; "Turn over" flips it in 3D and the face label changes; the header shows "Card builder"; clicking a region outlines it (no popover yet).

- [ ] **Step 8: Commit**

```bash
git add frontend/src/builder/SetSymbol.tsx frontend/src/builder/BuilderCard.tsx frontend/src/pages/BuilderPage.tsx frontend/src/App.tsx frontend/src/components/SearchHeader.tsx frontend/src/index.css
git commit -m "Card builder: flippable card, page and route"
```

---

### Task 6: Region popovers

**Files:**
- Create: `frontend/src/builder/RegionPopover.tsx`, `frontend/src/builder/RegionEditor.tsx`
- Modify: `frontend/src/pages/BuilderPage.tsx`, `frontend/src/index.css`

**Interfaces:**
- Consumes: `BuilderAction`, controls, constants, types.
- Produces: `RegionPopover({ anchor: HTMLElement; title: string; badge: "front face" | "back face" | "whole card"; description?: string; onClose: () => void; children })`; `editorMeta(region: Region, side: Side): EditorMeta`; default export `RegionEditor({ region, side, state, dispatch, onFlip })`.

- [ ] **Step 1: Create `src/builder/RegionPopover.tsx`**

```tsx
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface Props {
  anchor: HTMLElement;
  title: string;
  badge: "front face" | "back face" | "whole card";
  description?: string;
  onClose: () => void;
  children: ReactNode;
}

const MOBILE = 960;

/** Fixed-position popover to the right of the card (bottom sheet on small screens). */
export default function RegionPopover({ anchor, title, badge, description, onClose, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const place = () => {
      if (window.innerWidth < MOBILE) {
        setPos(null);
        return;
      }
      const card = anchor.closest(".cb-scene")?.getBoundingClientRect() ?? anchor.getBoundingClientRect();
      const r = anchor.getBoundingClientRect();
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      let left = card.right + 24;
      let top = r.top - 10;
      if (left + w > window.innerWidth - 12) {
        left = Math.max(12, Math.min(window.innerWidth - w - 12, r.left + r.width / 2 - w / 2));
        top = r.bottom + 10;
      }
      top = Math.max(12, Math.min(top, window.innerHeight - h - 12));
      setPos({ left, top });
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place);
    };
  }, [anchor]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        anchor.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element;
      if (ref.current?.contains(t) || t.closest?.(".cb-region")) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [anchor, onClose]);

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>(".cb-pop-body input, .cb-pop-body select, .cb-pop-body button")?.focus({ preventScroll: true });
  }, [anchor]);

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label={title}
      className="cb-pop"
      style={pos ? { left: pos.left, top: pos.top } : undefined}
    >
      <button type="button" className="cb-pop-close" aria-label="Close" onClick={onClose}>×</button>
      <h3 className="cb-pop-title">
        {title}
        <span className={`cb-badge${badge === "back face" ? " is-back" : ""}`}>{badge}</span>
      </h3>
      {description && <p className="cb-pop-desc">{description}</p>}
      <div className="cb-pop-body">{children}</div>
      <button type="button" className="cb-pop-done" onClick={onClose}>Done</button>
    </div>,
    document.body,
  );
}
```

- [ ] **Step 2: Create `src/builder/RegionEditor.tsx`**

```tsx
import { COLORS, COLOR_NAME, KEYWORD_SUGGESTIONS, RARITIES, RARITY_COLOR, TYPE_SUGGESTIONS } from "./constants";
import { ChipInput, Field, NegToggle, OpNumber, Segmented, SetPicker, inputClass } from "./controls";
import type { BuilderAction } from "./reducer";
import { LOCKED_ON_BACK, type BuilderState, type FaceChipField, type FaceState, type Region, type Side } from "./types";

export interface EditorMeta {
  title: string;
  badge: "front face" | "back face" | "whole card";
  description?: string;
}

export function editorMeta(region: Region, side: Side): EditorMeta {
  const isBack = side === "back";
  const face = isBack ? "back face" : "front face";
  if (isBack && LOCKED_ON_BACK.includes(region)) {
    return { title: region === "art" ? "Illustration" : "Set & rarity", badge: "whole card" };
  }
  switch (region) {
    case "name":
      return { title: "Name", badge: face, description: "Matches part of the card name, upper or lower case doesn't matter." };
    case "mana":
      return isBack
        ? { title: "Color indicator", badge: face, description: "Back faces usually have no mana cost. Their color comes from the dot next to the name." }
        : { title: "Mana cost & colors", badge: face, description: "Pick colors, then how strictly they should match." };
    case "art":
      return { title: "Illustration", badge: "whole card", description: "Illustration tags describe what's in the art. They apply to the whole card." };
    case "type":
      return { title: "Type line", badge: face, description: "Card types, supertypes and subtypes. All of them must be on the type line." };
    case "set":
      return { title: "Set & rarity", badge: "whole card", description: "The set symbol's color shows the rarity. Pick more than one to match any of them." };
    case "text":
      return { title: "Text box", badge: face, description: "What the card says or does. Oracle tags describe a card's role, e.g. ramp or removal." };
    case "flavor":
      return { title: "Flavor text", badge: face, description: "The italic text under the rules." };
    case "pt":
      return { title: "Power / toughness", badge: face, description: "Leave one blank to match any value." };
  }
}

interface Props {
  region: Region;
  side: Side;
  state: BuilderState;
  dispatch: (action: BuilderAction) => void;
  onFlip: (side: Side) => void;
}

const ALL_ANY = [{ value: "all" as const, label: "All" }, { value: "any" as const, label: "Any" }];

export default function RegionEditor({ region, side, state, dispatch, onFlip }: Props) {
  const f = state[side];
  const isBack = side === "back";
  const setFace = (patch: Partial<FaceState>) => dispatch({ type: "setFace", side, patch });
  const chips = (field: FaceChipField) => ({
    values: f[field],
    onAdd: (value: string) => dispatch({ type: "addChip", side, field, value }),
    onRemove: (index: number) => dispatch({ type: "removeChip", side, field, index }),
  });

  if (isBack && LOCKED_ON_BACK.includes(region)) {
    return (
      <>
        <p className="cb-note">
          Art, artist, set and rarity describe the <b>whole card</b>, not one face. Edit them on the front.
        </p>
        <button type="button" className="cb-pill-btn self-start" onClick={() => onFlip("front")}>⇄ Turn to front</button>
      </>
    );
  }

  switch (region) {
    case "name":
      return (
        <Field label="Name" aside={<NegToggle ariaLabel="Name match" negated={f.nameNeg} onChange={(nameNeg) => setFace({ nameNeg })} />}>
          <input
            type="text"
            className={`${inputClass} w-full`}
            value={f.name}
            aria-label="Name contains"
            placeholder='e.g. bolt, "sol ring"'
            onChange={(e) => setFace({ name: e.target.value })}
          />
        </Field>
      );

    case "mana":
      return (
        <>
          <div className="cb-color-pick" role="group" aria-label="Colors">
            {COLORS.map((col) => (
              <button
                key={col}
                type="button"
                className={`cb-pip cb-pip-${col}${f.colors.includes(col) ? " is-on" : ""}`}
                aria-pressed={f.colors.includes(col)}
                aria-label={COLOR_NAME[col]}
                onClick={() => dispatch({ type: "toggleColor", side, color: col })}
              >
                {col}
              </button>
            ))}
          </div>
          <Field label="Match">
            <Segmented
              ariaLabel="Color match mode"
              value={f.colorMode}
              onChange={(colorMode) => setFace({ colorMode })}
              options={[
                { value: "including", label: "Including" },
                { value: "exactly", label: "Exactly" },
                { value: "atmost", label: "At most" },
              ]}
            />
          </Field>
          {!isBack && (
            <>
              <Field label="Use for">
                <Segmented
                  ariaLabel="Color target"
                  value={f.colorTarget}
                  onChange={(colorTarget) => setFace({ colorTarget })}
                  options={[{ value: "c", label: "Card colors" }, { value: "id", label: "Commander identity" }]}
                />
              </Field>
              <Field label="Mana value">
                <OpNumber ariaLabel="Mana value" op={f.mvOp} value={f.mv} onOp={(mvOp) => setFace({ mvOp })} onValue={(mv) => setFace({ mv })} />
              </Field>
            </>
          )}
        </>
      );

    case "type":
      return (
        <Field label="Types" aside={<NegToggle ariaLabel="Type match" negated={f.typesNeg} onChange={(typesNeg) => setFace({ typesNeg })} />}>
          <ChipInput ariaLabel="Add type" placeholder="Type and press Enter…" suggestions={TYPE_SUGGESTIONS} {...chips("types")} />
        </Field>
      );

    case "text":
      return (
        <>
          <Field label="Match cards that">
            <NegToggle ariaLabel="Text match" labels={["have this", "don't have this"]} negated={f.textNeg} onChange={(textNeg) => setFace({ textNeg })} />
          </Field>
          <Field label="Keywords">
            <ChipInput ariaLabel="Add keyword" placeholder="flying, ward…" suggestions={KEYWORD_SUGGESTIONS} {...chips("keywords")} />
          </Field>
          <Field label="Rules text contains">
            <ChipInput ariaLabel="Add rules text phrase" placeholder="e.g. draw a card ⏎" {...chips("phrases")} />
          </Field>
          <Field
            label="Oracle tags"
            aside={f.otags.length > 1 && (
              <Segmented ariaLabel="Oracle tag match" value={f.otagAny ? "any" : "all"} onChange={(v) => setFace({ otagAny: v === "any" })} options={ALL_ANY} />
            )}
          >
            <ChipInput ariaLabel="Add oracle tag" placeholder="Search tags…" source="oracle" {...chips("otags")} />
          </Field>
        </>
      );

    case "flavor":
      return (
        <input
          type="text"
          className={`${inputClass} w-full`}
          value={f.flavor}
          aria-label="Flavor text contains"
          placeholder="e.g. Urza"
          onChange={(e) => setFace({ flavor: e.target.value })}
        />
      );

    case "pt":
      return (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Power">
            <OpNumber ariaLabel="Power" op={f.powOp} value={f.pow} onOp={(powOp) => setFace({ powOp })} onValue={(pow) => setFace({ pow })} />
          </Field>
          <Field label="Toughness">
            <OpNumber ariaLabel="Toughness" op={f.touOp} value={f.tou} onOp={(touOp) => setFace({ touOp })} onValue={(tou) => setFace({ tou })} />
          </Field>
        </div>
      );

    case "art":
      return (
        <>
          <Field
            label="Illustration tags"
            aside={state.card.atags.length > 1 && (
              <Segmented
                ariaLabel="Illustration tag match"
                value={state.card.atagAny ? "any" : "all"}
                onChange={(v) => dispatch({ type: "setCard", patch: { atagAny: v === "any" } })}
                options={ALL_ANY}
              />
            )}
          >
            <ChipInput
              ariaLabel="Add illustration tag"
              placeholder="Search illustration tags…"
              source="illustration"
              values={state.card.atags}
              onAdd={(value) => dispatch({ type: "addArtTag", value })}
              onRemove={(index) => dispatch({ type: "removeArtTag", index })}
            />
          </Field>
          <Field label="Artist">
            <input
              type="text"
              className={`${inputClass} w-full`}
              value={state.card.artist}
              aria-label="Artist"
              placeholder="e.g. Rebecca Guay"
              onChange={(e) => dispatch({ type: "setCard", patch: { artist: e.target.value } })}
            />
          </Field>
        </>
      );

    case "set":
      return (
        <>
          <Field label="Rarity">
            <div className="flex flex-wrap gap-1.5">
              {RARITIES.map((r) => {
                const on = state.card.rarities.includes(r);
                return (
                  <button key={r} type="button" aria-pressed={on} className={`cb-check${on ? " is-on" : ""}`} onClick={() => dispatch({ type: "toggleRarity", rarity: r })}>
                    <span className="cb-dot" style={{ background: RARITY_COLOR[r] }} />
                    {r}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Set">
            <SetPicker value={state.card.set} onChange={(set) => dispatch({ type: "setCard", patch: { set } })} />
          </Field>
        </>
      );
  }
}
```

- [ ] **Step 3: Append popover styles to `src/index.css`**

```css
/* ── Card builder: popover ────────────────────────────────────────── */
.cb-pop {
  position: fixed; left: -9999px; top: 0; z-index: 40; width: 340px; background: #fff; border: 1px solid #e5e5e5; border-radius: 16px; padding: 16px 16px 14px;
  box-shadow: 0 24px 50px -18px rgba(0,0,0,.28), 0 2px 6px rgba(0,0,0,.05); animation: cb-pop-in .18s ease-out; font-family: "Instrument Sans", sans-serif;
}
@keyframes cb-pop-in { from { opacity: 0; transform: translateY(6px) scale(.98); } }
@media (max-width: 959px) {
  .cb-pop { left: 0 !important; right: 0; top: auto !important; bottom: 0; width: auto; max-height: 75vh; overflow-y: auto; border-radius: 18px 18px 0 0; }
}
.cb-pop-title { margin: 0; font-family: "Fraunces", serif; font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 8px; padding-right: 24px; }
.cb-badge { font-family: "Instrument Sans", sans-serif; font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; padding: 3px 7px; border-radius: 999px; background: #f5f5f5; color: #737373; }
.cb-badge.is-back { background: rgba(29,92,158,.12); color: #1D5C9E; }
.cb-pop-desc { font-size: 12.5px; color: #737373; margin: 4px 0 14px; line-height: 1.45; }
.cb-pop-body { display: flex; flex-direction: column; gap: 14px; }
.cb-pop-close { position: absolute; top: 10px; right: 12px; border: none; background: none; font-size: 20px; color: #a3a3a3; cursor: pointer; }
.cb-pop-done { margin-top: 14px; width: 100%; padding: 8px; border-radius: 10px; border: none; background: #171717; color: #fff; font-weight: 600; font-size: 13px; cursor: pointer; }
.cb-color-pick { display: flex; gap: 8px; }
.cb-color-pick .cb-pip { width: 38px; height: 38px; font-size: 14px; border: 2px solid transparent; cursor: pointer; opacity: .45; transition: all .15s; }
.cb-color-pick .cb-pip.is-on { opacity: 1; border-color: #171717; transform: translateY(-2px); }
```

- [ ] **Step 4: Wire the popover into `src/pages/BuilderPage.tsx`**

Add imports:

```tsx
import RegionPopover from "../builder/RegionPopover";
import RegionEditor, { editorMeta } from "../builder/RegionEditor";
```

Add after the `onRegion` callback:

```tsx
  const closePopover = useCallback(() => setOpen(null), []);
```

Add just before `<footer`:

```tsx
      {open && (
        <RegionPopover anchor={open.anchor} {...editorMeta(open.region, side)} onClose={closePopover}>
          <RegionEditor region={open.region} side={side} state={state} dispatch={update} onFlip={flip} />
        </RegionPopover>
      )}
```

- [ ] **Step 5: Type-check, test, try it**

Run: `npx tsc -b && npm test`, then in the dev server at `/builder`:
- Click the mana cost → popover to the right; pick U and G, "At most", "Commander identity", mana value `<=` `3` → pips show `id ≤ U G mv ≤3`, frame turns gold, temporary query line shows `id<=ug mv<=3`.
- Type line → add `creature` via suggestion, type `elf` + Enter; Backspace in empty input removes `elf`.
- Text box → oracle tag input, type `ram` → remote suggestions appear (from `/api/tags`).
- Esc closes and focus returns to the region; clicking outside closes; clicking another region switches.
- Turn over, click art → locked note with "Turn to front".
- Narrow the window below 960 px → popover becomes a bottom sheet.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/builder/RegionPopover.tsx frontend/src/builder/RegionEditor.tsx frontend/src/pages/BuilderPage.tsx frontend/src/index.css
git commit -m "Card builder: region popovers and editors"
```

---

### Task 7: Query preview, live count and side panel

**Files:**
- Create: `frontend/src/builder/QueryPreview.tsx`, `frontend/src/builder/SidePanel.tsx`
- Modify: `frontend/src/pages/BuilderPage.tsx`, `frontend/src/index.css`

**Interfaces:**
- Consumes: `Segment`, `MatchPreview`, controls, `BuilderAction`.
- Produces: `QueryPreview(props: QueryPreviewProps)`, `SidePanel({ card: CardLevelState; accent: string; dispatch })`.

- [ ] **Step 1: Create `src/builder/QueryPreview.tsx`**

```tsx
import { Eyebrow } from "./controls";
import type { Segment } from "./query";
import type { MatchPreview } from "./useMatchPreview";

interface QueryPreviewProps {
  segments: Segment[];
  raw: string | null;
  isCustom: boolean;
  preview: MatchPreview;
  accent: string;
  onRawChange: (text: string) => void;
  onToggleRaw: () => void;
  onBackClick: () => void;
  onSearch: () => void;
}

export default function QueryPreview({
  segments, raw, isCustom, preview, accent, onRawChange, onToggleRaw, onBackClick, onSearch,
}: QueryPreviewProps) {
  const query = raw ?? segments.map((s) => s.text).join(" ");

  let count: React.ReactNode = null;
  if (preview.error) count = <span className="text-red-600">{preview.error}</span>;
  else if (preview.total !== null) {
    count = (
      <>
        <b className="font-display text-lg font-semibold text-neutral-900">{preview.total.toLocaleString()}</b>{" "}
        {preview.total === 1 ? "card matches" : "cards match"}
      </>
    );
  } else if (preview.loading) count = "Counting…";

  return (
    <div className="rounded-2xl bg-neutral-50 border border-neutral-200/70 p-5">
      <Eyebrow accent={accent}>Your query</Eyebrow>

      {raw === null ? (
        <>
          <div className="cb-query">
            {segments.length === 0 ? (
              <span className="cb-query-empty">Click the card to start. Your query appears here.</span>
            ) : (
              segments.map((s, i) =>
                s.kind === "back" ? (
                  <button key={i} type="button" className="cb-tk is-back" title="Turn the card over" onClick={onBackClick}>{s.text}</button>
                ) : (
                  <span key={i} className={`cb-tk is-${s.kind}`}>{s.text}</span>
                ),
              )
            )}
          </div>
          <div className="cb-legend">
            <span className="is-front">front face</span>
            <span className="is-card">whole card</span>
            <span className="is-back">back face, click to flip</span>
          </div>
        </>
      ) : (
        <>
          <textarea className="cb-raw" value={raw} aria-label="Query text" onChange={(e) => onRawChange(e.target.value)} />
          {isCustom && (
            <p className="cb-custom-note">
              <b>Custom query.</b> The card can't show this, so it's paused. The text is what gets searched.
              "Back to card" discards your text edits.
            </p>
          )}
        </>
      )}

      <div className="flex flex-wrap items-center gap-2.5 mt-3.5">
        <span className="text-sm text-neutral-500 mr-auto" aria-live="polite">{count}</span>
        <button type="button" className="text-sm text-neutral-500 underline underline-offset-4 hover:text-neutral-900" onClick={onToggleRaw}>
          {raw === null ? "Edit as text" : "Back to card"}
        </button>
        <button
          type="button"
          disabled={!query.trim()}
          onClick={onSearch}
          className="font-body text-sm font-semibold bg-neutral-900 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-full transition-colors"
        >
          Search →
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/builder/SidePanel.tsx`**

```tsx
import { FLAGS, FORMATS, SORT_FIELDS } from "./constants";
import { Eyebrow, Field, NegToggle, OpNumber, Segmented, inputClass } from "./controls";
import type { BuilderAction } from "./reducer";
import type { BuilderSort, CardLevelState } from "./types";

interface Props {
  card: CardLevelState;
  accent: string;
  dispatch: (action: BuilderAction) => void;
}

export default function SidePanel({ card, accent, dispatch }: Props) {
  const set = (patch: Partial<CardLevelState>) => dispatch({ type: "setCard", patch });
  return (
    <div className="rounded-2xl bg-neutral-50 border border-neutral-200/70 p-5">
      <Eyebrow accent={accent}>Not printed on the card</Eyebrow>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        <div className="sm:col-span-2">
          <Field label="Format legality">
            <div className="flex flex-col gap-1.5">
              {card.formats.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    className={`${inputClass} flex-1 capitalize`}
                    aria-label="Format"
                    value={f.name}
                    onChange={(e) => dispatch({ type: "updateFormat", index: i, patch: { name: e.target.value } })}
                  >
                    {FORMATS.map((x) => <option key={x} value={x}>{x}</option>)}
                  </select>
                  <NegToggle
                    ariaLabel="Legality"
                    labels={["Legal", "Not legal"]}
                    negated={!f.legal}
                    onChange={(negated) => dispatch({ type: "updateFormat", index: i, patch: { legal: !negated } })}
                  />
                  <button type="button" aria-label="Remove format" className="text-neutral-400 hover:text-neutral-900 px-1" onClick={() => dispatch({ type: "removeFormat", index: i })}>✕</button>
                </div>
              ))}
              <button type="button" className="self-start text-xs text-neutral-500 border border-dashed border-neutral-300 rounded-lg px-2.5 py-1.5 hover:text-neutral-900" onClick={() => dispatch({ type: "addFormat" })}>
                + Add format
              </button>
              <p className="text-[11.5px] text-neutral-400">Legality applies to the whole card. Back faces have no legality data.</p>
            </div>
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field label="Flags">
            <div className="flex flex-wrap gap-1.5">
              {FLAGS.map((flag) => {
                const on = card.flags.includes(flag);
                return (
                  <button key={flag} type="button" aria-pressed={on} className={`cb-check${on ? " is-on" : ""}`} onClick={() => dispatch({ type: "toggleFlag", flag })}>
                    {flag}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        <Field label="EDHREC rank">
          <OpNumber ariaLabel="EDHREC rank" op={card.edhOp} value={card.edh} onOp={(edhOp) => set({ edhOp })} onValue={(edh) => set({ edh })} />
          <p className="text-[11.5px] text-neutral-400 mt-1">Lower is more popular</p>
        </Field>
        <Field label="Jank score">
          <OpNumber ariaLabel="Jank score" placeholder="0–10" op={card.jankOp} value={card.jank} onOp={(jankOp) => set({ jankOp })} onValue={(jank) => set({ jank })} />
        </Field>
        <Field label="Sort by">
          <div className="flex gap-2 items-center">
            <select className={inputClass} aria-label="Sort field" value={card.sort} onChange={(e) => set({ sort: e.target.value as BuilderSort })}>
              {SORT_FIELDS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Segmented
              ariaLabel="Sort order"
              value={card.order}
              onChange={(order) => set({ order })}
              options={[{ value: "asc", label: "↑ Asc" }, { value: "desc", label: "↓ Desc" }]}
            />
          </div>
        </Field>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Append preview styles to `src/index.css`**

```css
/* ── Card builder: query preview ──────────────────────────────────── */
.cb-query { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 13.5px; line-height: 1.9; background: #fff; border: 1px solid #e5e5e5; border-radius: 12px; padding: 12px 14px; min-height: 52px; word-break: break-word; }
.cb-tk { padding: 2px 5px; border-radius: 5px; margin-right: 4px; display: inline; }
.cb-tk.is-front { background: #f5f5f5; color: #171717; }
.cb-tk.is-card { color: #404040; border: 1px dashed #d4d4d4; }
.cb-tk.is-back { all: unset; display: inline; padding: 2px 5px; border-radius: 5px; margin-right: 4px; background: rgba(29,92,158,.1); color: #1D5C9E; border: 1px solid rgba(29,92,158,.25); cursor: pointer; font: inherit; }
.cb-tk.is-back:hover { background: rgba(29,92,158,.18); }
.cb-tk.is-meta { color: #a3a3a3; }
.cb-query-empty { color: #a3a3a3; font-family: "Instrument Sans", sans-serif; font-style: italic; }
.cb-legend { display: flex; flex-wrap: wrap; gap: 14px; font-size: 11.5px; color: #737373; margin-top: 10px; }
.cb-legend span::before { content: ""; display: inline-block; width: 9px; height: 9px; border-radius: 3px; margin-right: 5px; vertical-align: -1px; }
.cb-legend .is-front::before { background: #e5e5e5; }
.cb-legend .is-card::before { border: 1px dashed #a3a3a3; }
.cb-legend .is-back::before { background: rgba(29,92,158,.35); }
.cb-raw { width: 100%; min-height: 80px; font-family: ui-monospace, Menlo, monospace; font-size: 13.5px; border: 1px solid #d4d4d4; border-radius: 12px; padding: 12px 14px; resize: vertical; background: #fff; }
.cb-raw:focus { outline: none; border-color: #171717; box-shadow: 0 0 0 1px #171717; }
.cb-custom-note { margin-top: 10px; font-size: 12.5px; color: #92400e; background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 8px 12px; }
```

- [ ] **Step 4: Use them in `src/pages/BuilderPage.tsx`**

Add imports:

```tsx
import QueryPreview from "../builder/QueryPreview";
import SidePanel from "../builder/SidePanel";
```

Add after `closePopover`:

```tsx
  const search = () => {
    const q = query.trim();
    if (q) navigate(`/?q=${encodeURIComponent(q)}`);
  };
```

Replace the temporary line

```tsx
          <p className="font-mono text-sm text-neutral-600 break-words">{query || "—"}</p>
```

with:

```tsx
          <QueryPreview
            segments={segments}
            raw={raw}
            isCustom={isCustom}
            preview={preview}
            accent={accent}
            onRawChange={setRaw}
            onToggleRaw={() => setRaw((r) => (r === null ? generated : null))}
            onBackClick={() => flip("back")}
            onSearch={search}
          />
          <SidePanel card={state.card} accent={accent} dispatch={update} />
```

- [ ] **Step 5: Type-check, test, try it**

Run: `npx tsc -b && npm test`, then at `/builder` in the dev server:
- Add `t:creature` → within ~0.4 s the count shows a real number and the art box shows the top match's art with "Top match: …".
- Add a back-face type → blue `back:(…)` token; clicking it flips the card; the front gets the blue vertical tab.
- Edit as text, change the text → card dims with "Custom query" notice; "Back to card" restores it.
- Type an invalid query like `t:(` in the text box → error text in place of the count.
- Search → navigates to `/?q=…` and the results page shows the same query.
- Side panel: add format, toggle "Not legal" → `-f:modern`; sort `usd` + Desc → `sort:usd order:desc`.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/builder/QueryPreview.tsx frontend/src/builder/SidePanel.tsx frontend/src/pages/BuilderPage.tsx frontend/src/index.css
git commit -m "Card builder: query preview, live count and side panel"
```

---

### Task 8: End-to-end check and deploy

**Files:**
- No source changes expected. Scratch script lives in `/tmp/cb-e2e/` (not committed).

- [ ] **Step 1: Production build**

Run: `cd frontend && npm run build`
Expected: `tsc -b` and `vite build` succeed.

- [ ] **Step 2: Headless end-to-end run against the dev server**

Start `npm run dev -- --port 5199 --strictPort` in the background, then:

```bash
mkdir -p /tmp/cb-e2e && cd /tmp/cb-e2e && npm i --silent playwright-core
cat > e2e.cjs <<'EOF'
const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/chromium' });
  const p = await b.newPage({ viewport: { width: 1320, height: 900 } });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto('http://localhost:5199/builder');
  await p.click('.cb-face:not(.is-back) [aria-label="Mana cost and colors"]');
  await p.click('[aria-label="Blue"]'); await p.click('[aria-label="Green"]');
  await p.click('text=At most'); await p.click('text=Commander identity');
  await p.keyboard.press('Escape');
  await p.click('.cb-face:not(.is-back) [aria-label="Type line"]');
  await p.fill('[aria-label="Add type"]', 'creature'); await p.press('[aria-label="Add type"]', 'Enter');
  await p.keyboard.press('Escape');
  await p.click('text=Turn over'); await p.waitForTimeout(800);
  await p.click('.cb-face.is-back [aria-label="Type line"]');
  await p.fill('[aria-label="Add type"]', 'land'); await p.press('[aria-label="Add type"]', 'Enter');
  await p.keyboard.press('Escape');
  const q = (await p.locator('.cb-query').innerText()).replace(/\s+/g, ' ').trim();
  console.log('QUERY:', q);
  await p.waitForSelector('text=/cards? match/');
  console.log('COUNT:', await p.locator('[aria-live="polite"]').innerText());
  await p.screenshot({ path: '/tmp/cb-e2e/builder.png', fullPage: true });
  await p.click('text=Search →'); await p.waitForURL(/\?q=/);
  console.log('URL:', decodeURIComponent(p.url()));
  console.log('ERRORS:', errors);
  await b.close();
})();
EOF
node e2e.cjs
```

Expected:
```
QUERY: id<=ug t:creature back:(t:land)
COUNT: <some number> cards match
URL: http://localhost:5199/?q=id<=ug t:creature back:(t:land)
ERRORS: []
```

Look at `/tmp/cb-e2e/builder.png` and compare with `mockups/card-builder.html`. Then stop the dev server and `rm -rf /tmp/cb-e2e`.

- [ ] **Step 3: Deploy (confirm with the owner first)**

```bash
cd /home/sejoma/Projects/webapps/mtgSearch && docker compose up -d --build
JS=$(curl -s https://codexetherium.sejoma.net/ | grep -o '/assets/[^"]*\.js' | head -1)
curl -s "https://codexetherium.sejoma.net$JS" | grep -c 'Build a search, one card at a time'
curl -s -o /dev/null -w '%{http_code}\n' 'https://codexetherium.sejoma.net/api/tags?type=oracle&q=ramp'
```

Expected: `1` and `200`. Then open `https://codexetherium.sejoma.net/builder`.

- [ ] **Step 4: Finish the branch**

Use superpowers:finishing-a-development-branch to merge or open a PR, as the owner prefers.
