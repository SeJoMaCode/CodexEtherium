# Precon Deck Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a forgiving `deck:` search filter (alias `precon:`) to mtgDB, with a match line, an "In precons" card panel and removable autocomplete in Codex Etherium.

**Architecture:** mtgDB imports Commander precon lists from MTGJSON into two new `app` tables. The parser resolves a term to decks by normalized name, commander, set name or exact set code, then to cards by oracle ID, so results survive canonical-printing dedupe. Codex only reads three API additions: `deck_matches` on search, `GET /cards/{uuid}/decks`, and `GET /decks`.

**Tech Stack:** Python 3.12, FastAPI, psycopg2, httpx, APScheduler, PostgreSQL 16, pytest (new, dev only); React 19, TypeScript, Tailwind v4, Vitest 3.

**Spec:** `mtgSearch/docs/superpowers/specs/2026-11-01-precon-deck-search-design.md`

## Global Constraints

- All paths are relative to `/home/sejoma/Projects/webapps`. `mtgDB` and `mtgSearch` are **separate git repos**.
- Work on branch `precon-deck-search` in each repo. Never commit to `main`. Don't push.
- End every commit message with the attribution trailer the session specifies.
- Commit subjects follow repo style: plain imperative, for example `Add GET /tags autocomplete`.
- Import only `type == "Commander Deck"`, and only the `commander` and `mainBoard` boards.
- Match cards on oracle ID (`identifiers.scryfallOracleId`), never on printing UUID.
- Don't change the "Build a card" page or any file under `frontend/src/builder/`.
- No visible UI change on searches that don't use `deck:`.
- `pytest` goes only in `requirements-dev.txt`, never in `requirements.txt`.
- Python tests run through `mtgDB/scripts/test.sh` (created in Task 1), because the host has Python 3.14 and no project dependencies. It uses the same Python 3.12 as production.
- Frontend commands run from `mtgSearch/frontend`.
- The autocomplete tasks (8 and 9) must come last. Nothing earlier may depend on them.

### Stop for owner approval

Task 2 changes the running database and rebuilds a running container. Task 4 and later tasks rebuild containers too. Before the first command in any section headed **Deploy**, confirm with the owner.

---

### Task 1: Pure deck import logic and Python test setup

**Files:**
- Create: `mtgDB/scripts/test.sh`
- Create: `mtgDB/manager/requirements-dev.txt`
- Create: `mtgDB/manager/pytest.ini`
- Create: `mtgDB/manager/decks.py`
- Test: `mtgDB/manager/tests/test_decks.py`

**Interfaces:**
- Produces, all in `manager/decks.py`:
  - `normalize_deck_text(text: str) -> str`
  - `select_commander_entries(deck_list: list[dict]) -> list[dict]`
  - `known_deck_keys(deck_list: list[dict]) -> set[tuple[str, str]]`
  - `parse_deck_file(data: dict) -> ParsedDeck`, with fields `commanders: list[str]`, `cards: list[DeckCard]`, `skipped: int`
  - `DeckCard`, with fields `oracle_id`, `name`, `quantity`, `board`
  - `build_search_text(name: str, commanders: list[str], set_name: str | None) -> str`
  - `pending_decks(sealed_rows, known, set_names) -> list[PendingDeck]`, with `PendingDeck` fields `deck_id`, `name`, `set_code`, `set_name`, `search_text`
  - `too_many_failures(failed: int, total: int) -> bool`

- [ ] **Step 1: Create the branch and test tooling**

```bash
cd mtgDB && git checkout -b precon-deck-search
```

Create `mtgDB/scripts/test.sh`:

```sh
#!/bin/sh
# Run a service's tests in the production Python version.
# Usage: scripts/test.sh api|manager [pytest args]
set -eu
svc="$1"
shift
root="$(cd "$(dirname "$0")/.." && pwd)"
exec docker run --rm -v "$root/$svc:/app" -w /app -e PYTHONDONTWRITEBYTECODE=1 python:3.12-slim \
  sh -c 'pip install -q --root-user-action=ignore -r requirements-dev.txt && python -m pytest -q -p no:cacheprovider "$@"' -- "$@"
```

Then `chmod +x mtgDB/scripts/test.sh`.

Create `mtgDB/manager/requirements-dev.txt`:

```
-r requirements.txt
pytest==8.3.4
```

Create `mtgDB/manager/pytest.ini`:

```ini
[pytest]
pythonpath = .
testpaths = tests
```

- [ ] **Step 2: Write the failing tests**

Create `mtgDB/manager/tests/test_decks.py`:

```python
import json

import pytest

from decks import (
    build_search_text,
    known_deck_keys,
    normalize_deck_text,
    parse_deck_file,
    pending_decks,
    select_commander_entries,
    too_many_failures,
)


@pytest.mark.parametrize("raw,expected", [
    ("Urza's Iron Alliance", "urzas iron alliance"),
    ("Khârn the Betrayer", "kharn the betrayer"),
    ("Warhammer 40,000 Commander", "warhammer 40000 commander"),
    ("Bio-Asset Allocator", "bio asset allocator"),
    ("Æther  Vial", "aether vial"),
    ("  50%_off\\ ", "50off"),
    ("!!!", ""),
])
def test_normalize_deck_text(raw, expected):
    assert normalize_deck_text(raw) == expected


def entry(name, code="40K", type_="Commander Deck"):
    return {"name": name, "code": code, "type": type_, "fileName": name.replace(" ", ""), "releaseDate": "2022-10-07"}


def test_select_keeps_only_commander_decks():
    kept = select_commander_entries([entry("Necron Dynasties"), entry("Urza's", code="J22", type_="Jumpstart")])
    assert [e["name"] for e in kept] == ["Necron Dynasties"]


def test_select_drops_collector_edition_with_regular_sibling():
    kept = select_commander_entries([entry("Necron Dynasties"), entry("Necron Dynasties Collector's Edition")])
    assert [e["name"] for e in kept] == ["Necron Dynasties"]


def test_select_keeps_collector_edition_without_sibling():
    kept = select_commander_entries([entry("Lonely Collector's Edition")])
    assert [e["name"] for e in kept] == ["Lonely Collector's Edition"]


def test_select_requires_sibling_in_same_set():
    kept = select_commander_entries([entry("Same Name", code="AAA"), entry("Same Name Collector's Edition", code="BBB")])
    assert len(kept) == 2


def test_known_deck_keys_includes_collector_editions_and_ignores_other_types():
    keys = known_deck_keys([
        entry("Necron Dynasties Collector's Edition"),
        entry("Urza's", code="J22", type_="Jumpstart"),
    ])
    assert keys == {("40K", "necron dynasties collectors edition")}


def card(name, oracle="o1", count=1):
    identifiers = {"scryfallOracleId": oracle} if oracle else {}
    return {"name": name, "count": count, "identifiers": identifiers}


def test_parse_deck_file_reads_commander_and_main_only():
    parsed = parse_deck_file({
        "commander": [card("Szarekh", "o-sz")],
        "displayCommander": [card("Szarekh", "o-sz")],
        "mainBoard": [card("Sol Ring", "o-sol")],
        "sideBoard": [card("Side", "o-side")],
        "tokens": [card("Token", "o-tok")],
    })
    assert parsed.commanders == ["Szarekh"]
    assert {(c.oracle_id, c.board) for c in parsed.cards} == {("o-sz", "commander"), ("o-sol", "main")}


def test_parse_deck_file_sums_printings_of_one_card():
    parsed = parse_deck_file({
        "commander": [],
        "mainBoard": [card("Swamp", "o-sw", 10), card("Swamp", "o-sw", 5)],
    })
    assert [(c.name, c.quantity) for c in parsed.cards] == [("Swamp", 15)]


def test_parse_deck_file_counts_missing_oracle_ids():
    parsed = parse_deck_file({"commander": [], "mainBoard": [card("Mystery", None), card("Known", "o-k")]})
    assert parsed.skipped == 1
    assert [c.name for c in parsed.cards] == ["Known"]


def test_build_search_text_separates_fields():
    text = build_search_text("Necron Dynasties", ["Szarekh, the Silent King"], "Warhammer 40,000 Commander")
    assert text == "necron dynasties | szarekh the silent king | warhammer 40000 commander"


def test_build_search_text_omits_missing_set_name():
    assert build_search_text("Deck", [], None) == "deck"


def sealed(code, *names):
    return (code, json.dumps({"deck": [{"name": n, "set": code.lower()} for n in names]}))


def test_pending_decks_lists_unpublished_deck():
    pending = pending_decks([sealed("TRC", "We Are the Borg")], set(), {"TRC": "Star Trek Commander"})
    assert len(pending) == 1
    deck = pending[0]
    assert deck.deck_id == "pending:TRC:we are the borg"
    assert deck.name == "We Are the Borg"
    assert deck.set_code == "TRC"
    assert deck.set_name == "Star Trek Commander"
    assert deck.search_text == "we are the borg | star trek commander"


def test_pending_decks_skips_published_using_normalized_names():
    known = {("BRC", "urzas iron alliance")}
    assert pending_decks([sealed("BRC", "Urzas Iron Alliance")], known, {}) == []


def test_pending_decks_drops_collector_edition_with_pending_sibling():
    rows = [sealed("TRC", "We Are the Borg"), sealed("TRC", "We Are the Borg Collector's Edition")]
    assert [d.name for d in pending_decks(rows, set(), {})] == ["We Are the Borg"]


def test_pending_decks_drops_collector_edition_with_published_sibling():
    known = {("TRC", "we are the borg")}
    assert pending_decks([sealed("TRC", "We Are the Borg Collector's Edition")], known, {}) == []


def test_pending_decks_removes_duplicates():
    rows = [sealed("TRC", "We Are the Borg"), sealed("TRC", "We Are the Borg")]
    assert len(pending_decks(rows, set(), {})) == 1


def test_pending_decks_ignores_products_without_deck_contents():
    rows = [("TRC", None), ("TRC", "not json"), ("TRC", json.dumps({"sealed": []}))]
    assert pending_decks(rows, set(), {}) == []


@pytest.mark.parametrize("failed,total,expected", [
    (0, 100, False),
    (10, 100, False),
    (11, 100, True),
    (0, 0, True),
])
def test_too_many_failures(failed, total, expected):
    assert too_many_failures(failed, total) is expected
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `mtgDB/scripts/test.sh manager tests/test_decks.py`
Expected: collection error, `ModuleNotFoundError: No module named 'decks'`

- [ ] **Step 4: Write the implementation**

Create `mtgDB/manager/decks.py`:

```python
"""Pure logic for the precon deck import: no database or network access."""
from __future__ import annotations

import json
import re
import unicodedata
from collections.abc import Iterable
from dataclasses import dataclass, field

COMMANDER_DECK_TYPE = "Commander Deck"
MAX_FAILURE_RATIO = 0.1

_COLLECTOR_SUFFIX = " collectors edition"


def normalize_deck_text(text: str) -> str:
    """Lowercase, strip accents and punctuation. Same rules as api/deck_text.py."""
    decomposed = unicodedata.normalize("NFKD", text)
    stripped = "".join(ch for ch in decomposed if not unicodedata.combining(ch))
    lowered = stripped.casefold().replace("æ", "ae")
    spaced = re.sub(r"[-–—\s]+", " ", lowered)
    cleaned = re.sub(r"[^\w ]|_", "", spaced)
    return re.sub(r" +", " ", cleaned).strip()


def _collector_base(normalized_name: str) -> str | None:
    """The regular deck's normalized name if this is a Collector's Edition."""
    if normalized_name.endswith(_COLLECTOR_SUFFIX):
        return normalized_name[: -len(_COLLECTOR_SUFFIX)]
    return None


def known_deck_keys(deck_list: list[dict]) -> set[tuple[str, str]]:
    """(SET, normalized name) for every Commander deck in DeckList.json."""
    return {
        (e["code"].upper(), normalize_deck_text(e["name"]))
        for e in deck_list
        if e.get("type") == COMMANDER_DECK_TYPE
    }


def select_commander_entries(deck_list: list[dict]) -> list[dict]:
    """Commander decks to import: a Collector's Edition is skipped if its regular deck exists."""
    keys = known_deck_keys(deck_list)
    kept = []
    for entry in deck_list:
        if entry.get("type") != COMMANDER_DECK_TYPE:
            continue
        base = _collector_base(normalize_deck_text(entry["name"]))
        if base is not None and (entry["code"].upper(), base) in keys:
            continue
        kept.append(entry)
    return kept


@dataclass
class DeckCard:
    oracle_id: str
    name: str
    quantity: int
    board: str


@dataclass
class ParsedDeck:
    commanders: list[str] = field(default_factory=list)
    cards: list[DeckCard] = field(default_factory=list)
    skipped: int = 0


def parse_deck_file(data: dict) -> ParsedDeck:
    """Read an MTGJSON deck file's `data` object. Quantities are summed across printings."""
    parsed = ParsedDeck()
    for card in data.get("commander") or []:
        if card["name"] not in parsed.commanders:
            parsed.commanders.append(card["name"])

    merged: dict[tuple[str, str], DeckCard] = {}
    for board, source in (("commander", "commander"), ("main", "mainBoard")):
        for card in data.get(source) or []:
            oracle_id = (card.get("identifiers") or {}).get("scryfallOracleId")
            if not oracle_id:
                parsed.skipped += 1
                continue
            key = (oracle_id, board)
            if key in merged:
                merged[key].quantity += card.get("count", 1)
            else:
                merged[key] = DeckCard(oracle_id, card["name"], card.get("count", 1), board)
    parsed.cards = list(merged.values())
    return parsed


def build_search_text(name: str, commanders: list[str], set_name: str | None) -> str:
    """Normalized fields joined by ' | ', which a normalized term can never contain."""
    parts = [name, *commanders]
    if set_name:
        parts.append(set_name)
    return " | ".join(normalize_deck_text(part) for part in parts)


@dataclass
class PendingDeck:
    deck_id: str
    name: str
    set_code: str
    set_name: str | None
    search_text: str


def _sealed_deck_refs(sealed_rows: Iterable[tuple[str, str | None]]) -> Iterable[tuple[str, str]]:
    for set_code, contents in sealed_rows:
        if not contents:
            continue
        try:
            parsed = json.loads(contents)
        except ValueError:
            continue
        for ref in parsed.get("deck") or []:
            yield (ref.get("set") or set_code).upper(), ref["name"]


def pending_decks(
    sealed_rows: Iterable[tuple[str, str | None]],
    known: set[tuple[str, str]],
    set_names: dict[str, str],
) -> list[PendingDeck]:
    """Decks sold as sealed products whose card list MTGJSON hasn't published."""
    found: dict[tuple[str, str], str] = {}
    for set_code, name in _sealed_deck_refs(sealed_rows):
        key = (set_code, normalize_deck_text(name))
        if key not in known:
            found.setdefault(key, name)

    pending = []
    for (set_code, normalized), name in found.items():
        base = _collector_base(normalized)
        if base is not None and ((set_code, base) in known or (set_code, base) in found):
            continue
        set_name = set_names.get(set_code)
        pending.append(PendingDeck(
            deck_id=f"pending:{set_code}:{normalized}",
            name=name,
            set_code=set_code,
            set_name=set_name,
            search_text=build_search_text(name, [], set_name),
        ))
    return pending


def too_many_failures(failed: int, total: int) -> bool:
    """True when an import shouldn't write anything. No decks at all counts as failure."""
    return total == 0 or failed > total * MAX_FAILURE_RATIO
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `mtgDB/scripts/test.sh manager tests/test_decks.py`
Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
cd mtgDB
git add scripts/test.sh manager/requirements-dev.txt manager/pytest.ini manager/decks.py manager/tests/test_decks.py
git commit -m "Add pure precon deck import logic and test setup"
```

---

### Task 2: Deck tables, importer and scheduling

**Files:**
- Modify: `mtgDB/db/init/01-schemas.sql` (append)
- Modify: `mtgDB/manager/importer.py` (imports, constants, new section before `# ── Full import cycle`, `run_full_import`)
- Modify: `mtgDB/manager/scheduler.py` (`_startup_check`, `_weekly_mtgjson_check`)

**Interfaces:**
- Consumes: everything from Task 1's `decks.py`.
- Produces: tables `app.decks` and `app.deck_cards`; `importer.run_deck_import(version: str | None = None) -> None`, which never raises for import failures; `importer.deck_table_is_empty() -> bool`.

This task is I/O wiring, so it has no unit tests. The pure logic was tested in Task 1, and the Deploy steps below verify this task against real data.

- [ ] **Step 1: Append the tables to the schema**

Append to `mtgDB/db/init/01-schemas.sql`:

```sql

-- Commander precons from MTGJSON's deck files. A row with list_available = false
-- is a deck sold as a sealed product whose card list isn't published yet.
CREATE TABLE IF NOT EXISTS app.decks (
    deck_id        TEXT PRIMARY KEY,
    name           TEXT NOT NULL,
    set_code       TEXT NOT NULL,
    set_name       TEXT,
    release_date   TEXT,
    commanders     TEXT[] NOT NULL DEFAULT '{}',
    search_text    TEXT NOT NULL,
    list_available BOOLEAN NOT NULL,
    imported_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_decks_set_code ON app.decks (set_code);

-- Keyed by oracle id, not printing uuid: search dedupes to one canonical printing
-- per name, which usually isn't the deck's printing.
CREATE TABLE IF NOT EXISTS app.deck_cards (
    deck_id   TEXT NOT NULL REFERENCES app.decks (deck_id) ON DELETE CASCADE,
    oracle_id TEXT NOT NULL,
    name      TEXT NOT NULL,
    quantity  INTEGER NOT NULL,
    board     TEXT NOT NULL,
    PRIMARY KEY (deck_id, oracle_id, board)
);
CREATE INDEX IF NOT EXISTS idx_deck_cards_oracle ON app.deck_cards (oracle_id);
```

- [ ] **Step 2: Add importer imports and constants**

In `mtgDB/manager/importer.py`, add `import time` after `import tempfile`. Replace:

```python
from db import get_conn

logger = logging.getLogger(__name__)
```

with:

```python
from db import get_conn
from decks import (
    ParsedDeck,
    build_search_text,
    known_deck_keys,
    parse_deck_file,
    pending_decks,
    select_commander_entries,
    too_many_failures,
)

logger = logging.getLogger(__name__)
```

After the `MTGJSON_DUMP_URL` line, add:

```python
MTGJSON_DECK_LIST_URL = "https://mtgjson.com/api/v5/DeckList.json"
MTGJSON_DECK_URL = "https://mtgjson.com/api/v5/decks/{}.json"
DECK_FETCH_DELAY_SECONDS = 0.2
```

- [ ] **Step 3: Add the import**

In `mtgDB/manager/importer.py`, insert directly before `# ── Full import cycle`:

```python
# ── Precon deck import ───────────────────────────────────────────────────────

def _fetch_deck_files(client: httpx.Client, entries: list[dict]) -> tuple[dict[str, ParsedDeck], list[str]]:
    parsed: dict[str, ParsedDeck] = {}
    failed: list[str] = []
    for entry in entries:
        file_name = entry["fileName"]
        try:
            resp = client.get(MTGJSON_DECK_URL.format(file_name))
            resp.raise_for_status()
            parsed[file_name] = parse_deck_file(resp.json()["data"])
        except Exception as e:
            logger.warning("Deck file %s failed: %s", file_name, e)
            failed.append(file_name)
        time.sleep(DECK_FETCH_DELAY_SECONDS)
    return parsed, failed


def _write_decks(
    cur,
    entries: list[dict],
    parsed: dict[str, ParsedDeck],
    pending: list,
    set_names: dict[str, str],
) -> None:
    for entry in entries:
        deck = parsed.get(entry["fileName"])
        if deck is None:
            continue  # Fetch failed: this deck keeps its previous rows.
        set_code = entry["code"].upper()
        set_name = set_names.get(set_code)
        cur.execute(
            """
            INSERT INTO app.decks
                (deck_id, name, set_code, set_name, release_date, commanders, search_text, list_available)
            VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE)
            ON CONFLICT (deck_id) DO UPDATE SET
                name = EXCLUDED.name,
                set_code = EXCLUDED.set_code,
                set_name = EXCLUDED.set_name,
                release_date = EXCLUDED.release_date,
                commanders = EXCLUDED.commanders,
                search_text = EXCLUDED.search_text,
                list_available = TRUE,
                imported_at = NOW()
            """,
            (
                entry["fileName"], entry["name"], set_code, set_name, entry.get("releaseDate"),
                deck.commanders, build_search_text(entry["name"], deck.commanders, set_name),
            ),
        )
        cur.execute("DELETE FROM app.deck_cards WHERE deck_id = %s", (entry["fileName"],))
        if deck.cards:
            execute_values(
                cur,
                "INSERT INTO app.deck_cards (deck_id, oracle_id, name, quantity, board) VALUES %s",
                [(entry["fileName"], c.oracle_id, c.name, c.quantity, c.board) for c in deck.cards],
            )

    cur.execute("DELETE FROM app.decks WHERE NOT list_available")
    if pending:
        execute_values(
            cur,
            "INSERT INTO app.decks (deck_id, name, set_code, set_name, search_text, list_available) VALUES %s",
            [(p.deck_id, p.name, p.set_code, p.set_name, p.search_text, False) for p in pending],
        )

    cur.execute(
        "DELETE FROM app.decks WHERE list_available AND NOT (deck_id = ANY(%s))",
        ([e["fileName"] for e in entries],),
    )


def _import_decks() -> str:
    with httpx.Client(headers=HEADERS, timeout=120) as client:
        resp = client.get(MTGJSON_DECK_LIST_URL)
        resp.raise_for_status()
        deck_list = resp.json()["data"]
        entries = select_commander_entries(deck_list)
        parsed, failed = _fetch_deck_files(client, entries)

    if too_many_failures(len(failed), len(entries)):
        raise RuntimeError(f"{len(failed)} of {len(entries)} deck files failed; nothing written")

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT code, name FROM mtgjson.sets")
            set_names = {code.upper(): name for code, name in cur.fetchall()}
            cur.execute(
                'SELECT "setCode", contents FROM mtgjson."sealedProducts" '
                "WHERE category = 'deck' AND subtype = 'commander'"
            )
            pending = pending_decks(cur.fetchall(), known_deck_keys(deck_list), set_names)
            _write_decks(cur, entries, parsed, pending, set_names)

    skipped = sum(deck.skipped for deck in parsed.values())
    return (
        f"{len(parsed)} decks, {len(pending)} pending, "
        f"{len(failed)} failed, {skipped} cards without oracle id"
    )


def run_deck_import(version: str | None = None) -> None:
    """Failures are logged, never raised, so they can't stop card, image or price imports."""
    log_id = _log_start("decks", version)
    try:
        notes = _import_decks()
        _log_finish(log_id, "success", notes)
        logger.info("Deck import complete: %s", notes)
    except Exception as e:
        logger.error("Deck import failed: %s", e)
        _log_finish(log_id, "failed", str(e))


def deck_table_is_empty() -> bool:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT NOT EXISTS (SELECT 1 FROM app.decks)")
            return cur.fetchone()[0]


```

In `run_full_import`, replace:

```python
    run_mtgjson_import(version)
    run_scryfall_images_import()
```

with:

```python
    run_mtgjson_import(version)
    run_deck_import(version)
    run_scryfall_images_import()
```

- [ ] **Step 4: Schedule it**

In `mtgDB/manager/scheduler.py`, replace:

```python
    else:
        logger.info("Database already populated with MTGJSON %s", version)
```

with:

```python
    else:
        logger.info("Database already populated with MTGJSON %s", version)
        _backfill_decks_if_empty(version)
```

Replace:

```python
            importer.run_mtgjson_import(remote)
            importer.run_scryfall_images_import()
```

with:

```python
            importer.run_mtgjson_import(remote)
            importer.run_deck_import(remote)
            importer.run_scryfall_images_import()
```

Insert before `def _weekly_mtgjson_check() -> None:`:

```python
def _backfill_decks_if_empty(version: str) -> None:
    try:
        if importer.deck_table_is_empty():
            logger.info("Deck tables empty — importing decks")
            importer.run_deck_import(version)
    except Exception as e:
        logger.error(
            "Deck tables unavailable; apply db/init/01-schemas.sql to the running database: %s", e
        )


```

- [ ] **Step 5: Run the tests and a syntax check**

Run: `mtgDB/scripts/test.sh manager`
Expected: all tests pass

Run: `cd mtgDB && python3 -m py_compile manager/importer.py manager/scheduler.py manager/decks.py`
Expected: no output. `__pycache__` is gitignored.

- [ ] **Step 6: Commit**

```bash
cd mtgDB
git add db/init/01-schemas.sql manager/importer.py manager/scheduler.py
git commit -m "Import Commander precon lists from MTGJSON"
```

- [ ] **Step 7: Deploy (confirm with owner first)**

This creates tables in the running database and restarts the manager, which starts the backfill.

```bash
cd mtgDB
docker compose exec -T db psql -U mtg -d mtg -v ON_ERROR_STOP=1 < db/init/01-schemas.sql
docker compose up -d --build manager
docker compose logs -f manager
```

Wait for `Deck import complete` (about a minute). Stop following the logs.

- [ ] **Step 8: Verify the import**

```bash
docker compose exec -T db psql -U mtg -d mtg -c "SELECT list_available, count(*) FROM app.decks GROUP BY 1" -c "SELECT count(DISTINCT dc.oracle_id) FROM app.deck_cards dc WHERE dc.deck_id = 'NecronDynasties_40K'" -c "SELECT name, commanders, set_name FROM app.decks WHERE NOT list_available ORDER BY name" -c "SELECT status, notes FROM app.import_log WHERE source = 'decks' ORDER BY id DESC LIMIT 1"
```

Expected on the data measured 2026-11-01. Counts may be higher if MTGJSON has added decks:
- 182 rows with `list_available = t`, 4 with `f`
- Necron has 71 distinct oracle IDs
- Pending: Federation Fleet, Klingon Fury, Landing Party, We Are the Borg
- Latest log: `success`, 0 failed

If any of these differ, stop and investigate before continuing.

---

### Task 3: `deck:` filter in the parser

**Files:**
- Create: `mtgDB/api/requirements-dev.txt`
- Create: `mtgDB/api/pytest.ini`
- Create: `mtgDB/api/deck_text.py`
- Modify: `mtgDB/api/query_parser.py` (imports, `_KEY_ALIASES`, `_key_to_sql`, `_to_sql`, public API)
- Test: `mtgDB/api/tests/test_deck_text.py`
- Test: `mtgDB/api/tests/test_query_parser_decks.py`

**Interfaces:**
- Consumes: the `app.decks` and `app.deck_cards` columns from Task 2.
- Produces:
  - In `api/deck_text.py`: `normalize_deck_text(text: str) -> str`, `DECK_MATCH_SQL: str` (uses alias `d`, takes two params), `deck_match_params(term: str) -> tuple[str, str]`
  - In `api/query_parser.py`: `extract_deck_terms(expr: Expr | None) -> list[str]`

- [ ] **Step 1: Add test setup**

Create `mtgDB/api/requirements-dev.txt`:

```
-r requirements.txt
pytest==8.3.4
```

Create `mtgDB/api/pytest.ini`:

```ini
[pytest]
pythonpath = .
testpaths = tests
```

- [ ] **Step 2: Write the failing tests**

Create `mtgDB/api/tests/test_deck_text.py`. The normalization table must stay identical to the one in `manager/tests/test_decks.py`:

```python
import pytest

from deck_text import deck_match_params, normalize_deck_text


@pytest.mark.parametrize("raw,expected", [
    ("Urza's Iron Alliance", "urzas iron alliance"),
    ("Khârn the Betrayer", "kharn the betrayer"),
    ("Warhammer 40,000 Commander", "warhammer 40000 commander"),
    ("Bio-Asset Allocator", "bio asset allocator"),
    ("Æther  Vial", "aether vial"),
    ("  50%_off\\ ", "50off"),
    ("!!!", ""),
])
def test_normalize_deck_text(raw, expected):
    assert normalize_deck_text(raw) == expected


def test_deck_match_params():
    assert deck_match_params("Urza's") == ("%urzas%", "URZA'S")


def test_deck_match_params_uppercases_set_code():
    assert deck_match_params(" 40k ") == ("%40k%", "40K")


def test_deck_match_params_removes_like_wildcards():
    assert deck_match_params("50%_x")[0] == "%50x%"
```

Create `mtgDB/api/tests/test_query_parser_decks.py`:

```python
import pytest

from query_parser import QueryError, build_search_sql, extract_deck_terms, parse_query


def test_deck_filter_targets_deck_tables_by_oracle_id():
    where, params = build_search_sql("deck:necron")
    assert "app.deck_cards" in where
    assert '"scryfallOracleId"' in where
    assert params == ["%necron%", "NECRON"]


def test_precon_is_an_alias():
    assert build_search_sql("precon:necron") == build_search_sql("deck:necron")


def test_quoted_term():
    _, params = build_search_sql('deck:"Iron Alliance"')
    assert params == ["%iron alliance%", "IRON ALLIANCE"]


def test_unquoted_apostrophe():
    _, params = build_search_sql("deck:urza's")
    assert params == ["%urzas%", "URZA'S"]


def test_or_between_terms():
    where, params = build_search_sql("deck:necron|urza")
    assert " OR " in where
    assert params == ["%necron%", "NECRON", "%urza%", "URZA"]


def test_and_between_terms():
    where, params = build_search_sql("deck:necron&urza")
    assert ") AND (" in where
    assert params == ["%necron%", "NECRON", "%urza%", "URZA"]


def test_negation():
    where, _ = build_search_sql("-deck:urza")
    assert where.startswith("WHERE NOT (")


def test_combines_with_other_filters():
    where, params = build_search_sql("deck:necron t:artifact")
    assert "app.deck_cards" in where
    assert "%necron%" in params


@pytest.mark.parametrize("query", ["deck>=necron", "deck=necron", "deck!=necron"])
def test_other_operators_are_rejected(query):
    with pytest.raises(QueryError):
        build_search_sql(query)


@pytest.mark.parametrize("query", ['deck:"!!!"', "deck:!!!"])
def test_term_with_nothing_searchable_is_rejected(query):
    with pytest.raises(QueryError):
        build_search_sql(query)


def test_deck_inside_back_face_is_rejected():
    with pytest.raises(QueryError):
        build_search_sql("back:(deck:necron)")


def test_deck_inside_front_face_is_allowed():
    where, _ = build_search_sql("front:(deck:necron)")
    assert "app.deck_cards" in where


@pytest.mark.parametrize("query,expected", [
    ("t:creature", []),
    ("deck:necron", ["necron"]),
    ("precon:necron", ["necron"]),
    ("deck:necron|urza", ["necron", "urza"]),
    ("deck:necron&urza", ["necron", "urza"]),
    ("-deck:urza", ["urza"]),
    ("-(deck:urza t:artifact)", ["urza"]),
    ("deck:necron OR deck:urza", ["necron", "urza"]),
    ("deck:necron deck:necron", ["necron"]),
    ('deck:"iron alliance" t:artifact', ["iron alliance"]),
])
def test_extract_deck_terms(query, expected):
    assert extract_deck_terms(parse_query(query)) == expected


def test_extract_deck_terms_handles_empty_query():
    assert extract_deck_terms(None) == []
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `mtgDB/scripts/test.sh api`
Expected: collection errors, `No module named 'deck_text'` and `cannot import name 'extract_deck_terms'`

- [ ] **Step 4: Write `deck_text.py`**

Create `mtgDB/api/deck_text.py`:

```python
"""Deck term matching shared by the search parser and deck lookups."""
import re
import unicodedata

# Uses alias `d` for app.decks. Parameters come from deck_match_params().
DECK_MATCH_SQL = "d.search_text LIKE %s OR d.set_code = %s"


def normalize_deck_text(text: str) -> str:
    """Lowercase, strip accents and punctuation. Same rules as manager/decks.py."""
    decomposed = unicodedata.normalize("NFKD", text)
    stripped = "".join(ch for ch in decomposed if not unicodedata.combining(ch))
    lowered = stripped.casefold().replace("æ", "ae")
    spaced = re.sub(r"[-–—\s]+", " ", lowered)
    cleaned = re.sub(r"[^\w ]|_", "", spaced)
    return re.sub(r" +", " ", cleaned).strip()


def deck_match_params(term: str) -> tuple[str, str]:
    """(LIKE pattern, set code). Normalization already removes LIKE wildcards."""
    return f"%{normalize_deck_text(term)}%", term.strip().upper()
```

- [ ] **Step 5: Add the parser support**

In `mtgDB/api/query_parser.py`, replace:

```python
from typing import Any, Callable
```

with:

```python
from typing import Any, Callable

from deck_text import DECK_MATCH_SQL, deck_match_params, normalize_deck_text
```

In `_KEY_ALIASES`, replace:

```python
    'function': 'oracletag', 'otag': 'oracletag', 'oracletag': 'oracletag',
}
```

with:

```python
    'function': 'oracletag', 'otag': 'oracletag', 'oracletag': 'oracletag',
    'deck': 'deck', 'precon': 'deck',
}
```

Insert before `def _not_ilike_type(`:

```python
def _deck_term_sql(term: str, params: list) -> str:
    if not normalize_deck_text(term):
        raise QueryError(f"Deck filter needs letters or numbers, got: '{term}'")
    params.extend(deck_match_params(term))
    # Oracle ids, not deck printings: search dedupes to a canonical printing per
    # name, which usually isn't the deck's. Uncorrelated IN for the same reason
    # as _tag_term_sql: it stays fast inside OR / NOT.
    return (
        'c."uuid" IN ('
        'SELECT ci3."uuid" FROM mtgjson."cardIdentifiers" ci3 '
        'WHERE ci3."uuid" IS NOT NULL AND ci3."scryfallOracleId" IN ('
        'SELECT dc.oracle_id FROM app.deck_cards dc '
        'JOIN app.decks d ON d.deck_id = dc.deck_id '
        f'WHERE {DECK_MATCH_SQL}'
        ')'
        ')'
    )


```

In `_key_to_sql`, replace:

```python
    if key == 'format':
        inner = _combine_terms(val, _format_term_sql)
```

with:

```python
    if key == 'deck':
        if op != ':':
            raise QueryError("deck: only supports the ':' operator")
        inner = _combine_terms(val, lambda t: _deck_term_sql(t, params))
        return f'NOT ({inner})' if neg else inner

    if key == 'format':
        inner = _combine_terms(val, _format_term_sql)
```

In `_to_sql`, replace:

```python
    if isinstance(expr, FaceNode):
        inner_params: list[Any] = []
```

with:

```python
    if isinstance(expr, FaceNode):
        if expr.face == 'b' and extract_deck_terms(expr.child):
            raise QueryError("deck: can't be used inside back:() because decks contain whole cards")
        inner_params: list[Any] = []
```

Insert directly before `def build_search_sql(`:

```python
def extract_deck_terms(expr: Expr | None) -> list[str]:
    """Every deck: term in the expression, in query order, without duplicates."""
    terms: list[str] = []

    def walk(node: Expr | None) -> None:
        if isinstance(node, KeyToken):
            if node.key == 'deck':
                for group in _split_or_and(node.value):
                    for term in group:
                        if term not in terms:
                            terms.append(term)
        elif isinstance(node, (AndNode, OrNode)):
            for child in node.children:
                walk(child)
        elif isinstance(node, (NotNode, FaceNode)):
            walk(node.child)

    walk(expr)
    return terms


```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `mtgDB/scripts/test.sh api`
Expected: all tests pass. If `deck!=necron` fails because the parser treats `!=` differently, fix the parser path, not the test: the spec requires every non-`:` operator to raise `QueryError`.

- [ ] **Step 7: Commit**

```bash
cd mtgDB
git add api/requirements-dev.txt api/pytest.ini api/deck_text.py api/query_parser.py api/tests
git commit -m "Add deck: search filter with forgiving matching"
```

---

### Task 4: `deck_matches` on search and the syntax entry

**Files:**
- Create: `mtgDB/api/deck_lookup.py`
- Modify: `mtgDB/api/routers/cards.py` (imports, `CardSearchResponse`, `search_cards`, syntax keywords)
- Modify: `mtgDB/README.md`
- Test: `mtgDB/api/tests/test_deck_lookup.py`

**Interfaces:**
- Consumes: `DECK_MATCH_SQL`, `deck_match_params`, `extract_deck_terms`, `parse_query`.
- Produces, in `api/deck_lookup.py`:
  - `DeckSummary`, with `deck_id: str`, `name: str`, `set_code: str`, `set_name: str | None`, `release_date: str | None`, `commanders: list[str]`, `list_available: bool`
  - `DeckTermMatch`, with `term: str`, `decks: list[DeckSummary]`
  - `DECK_COLUMNS: str`, `row_to_deck(row: tuple) -> DeckSummary`
  - `deck_matches(cur, terms: list[str]) -> list[DeckTermMatch]`

- [ ] **Step 1: Write the failing tests**

Create `mtgDB/api/tests/test_deck_lookup.py`:

```python
from deck_lookup import deck_matches, row_to_deck
from query_parser import parse_query, extract_deck_terms
from routers.cards import _has_set_filter


class FakeCursor:
    """Returns one scripted result per execute() and records the calls."""

    def __init__(self, *results):
        self.results = list(results)
        self.calls = []

    def execute(self, sql, params=None):
        self.calls.append((sql, params))

    def fetchall(self):
        return self.results.pop(0)

    def fetchone(self):
        return self.results.pop(0)


NECRON = ("NecronDynasties_40K", "Necron Dynasties", "40K", "Warhammer 40,000 Commander",
          "2022-10-07", ["Szarekh, the Silent King"], True)


def test_row_to_deck():
    deck = row_to_deck(NECRON)
    assert deck.deck_id == "NecronDynasties_40K"
    assert deck.name == "Necron Dynasties"
    assert deck.set_code == "40K"
    assert deck.set_name == "Warhammer 40,000 Commander"
    assert deck.release_date == "2022-10-07"
    assert deck.commanders == ["Szarekh, the Silent King"]
    assert deck.list_available is True


def test_deck_matches_runs_no_query_without_terms():
    cur = FakeCursor()
    assert deck_matches(cur, []) == []
    assert cur.calls == []


def test_deck_matches_returns_one_entry_per_term_in_order():
    cur = FakeCursor([NECRON], [])
    matches = deck_matches(cur, ["necron", "xyz"])
    assert [m.term for m in matches] == ["necron", "xyz"]
    assert [d.name for d in matches[0].decks] == ["Necron Dynasties"]
    assert matches[1].decks == []
    assert cur.calls[0][1] == ("%necron%", "NECRON")


def test_deck_filter_does_not_count_as_a_set_filter():
    assert _has_set_filter("deck:necron") is False
    assert _has_set_filter("-precon:necron t:artifact") is False
    assert _has_set_filter("deck:necron s:40K") is True


def test_terms_flow_from_parser_to_lookup():
    cur = FakeCursor([NECRON])
    matches = deck_matches(cur, extract_deck_terms(parse_query("-deck:necron t:artifact")))
    assert matches[0].term == "necron"
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `mtgDB/scripts/test.sh api tests/test_deck_lookup.py`
Expected: collection error, `No module named 'deck_lookup'`

- [ ] **Step 3: Write the implementation**

Create `mtgDB/api/deck_lookup.py`:

```python
"""Read queries against app.decks, shared by the card routes."""
from pydantic import BaseModel

from deck_text import DECK_MATCH_SQL, deck_match_params

DECK_COLUMNS = "d.deck_id, d.name, d.set_code, d.set_name, d.release_date, d.commanders, d.list_available"


class DeckSummary(BaseModel):
    deck_id: str
    name: str
    set_code: str
    set_name: str | None
    release_date: str | None
    commanders: list[str]
    list_available: bool


class DeckTermMatch(BaseModel):
    term: str
    decks: list[DeckSummary]


def row_to_deck(row: tuple) -> DeckSummary:
    return DeckSummary(
        deck_id=row[0],
        name=row[1],
        set_code=row[2],
        set_name=row[3],
        release_date=row[4],
        commanders=row[5],
        list_available=row[6],
    )


def deck_matches(cur, terms: list[str]) -> list[DeckTermMatch]:
    matches = []
    for term in terms:
        cur.execute(
            f"SELECT {DECK_COLUMNS} FROM app.decks d WHERE {DECK_MATCH_SQL} "
            "ORDER BY d.list_available DESC, d.release_date DESC NULLS LAST, d.name",
            deck_match_params(term),
        )
        matches.append(DeckTermMatch(term=term, decks=[row_to_deck(r) for r in cur.fetchall()]))
    return matches
```

- [ ] **Step 4: Wire it into search**

In `mtgDB/api/routers/cards.py`, replace:

```python
import db
from query_parser import QueryError, build_search_sql, extract_sort_directives, _funny_card_sql
```

with:

```python
import db
from deck_lookup import DeckTermMatch, deck_matches
from query_parser import (
    QueryError,
    build_search_sql,
    extract_deck_terms,
    extract_sort_directives,
    parse_query,
    _funny_card_sql,
)
```

Replace:

```python
class CardSearchResponse(BaseModel):
    total: int
    page: int
    page_size: int
    cards: list[CardSummary]
```

with:

```python
class CardSearchResponse(BaseModel):
    total: int
    page: int
    page_size: int
    cards: list[CardSummary]
    deck_matches: list[DeckTermMatch] = []
```

In `search_cards`, replace:

```python
        where, params = build_search_sql(q)
        order_by = _order_clause(inline_sort or sort, inline_order or order)
    except (QueryError, ValueError) as e:
```

with:

```python
        where, params = build_search_sql(q)
        deck_terms = extract_deck_terms(parse_query(q)) if q else []
        order_by = _order_clause(inline_sort or sort, inline_order or order)
    except (QueryError, ValueError) as e:
```

Replace:

```python
                return _fetch_cards(cur, where, params, page_size, offset, order_by,
                                    deduplicate=deduplicate, compute_count=count)

    total, rows = await asyncio.to_thread(_query)
    return CardSearchResponse(
        total=total,
        page=page,
        page_size=page_size,
        cards=[_row_to_summary(r) for r in rows],
    )
```

with:

```python
                total, rows = _fetch_cards(cur, where, params, page_size, offset, order_by,
                                           deduplicate=deduplicate, compute_count=count)
                return total, rows, deck_matches(cur, deck_terms)

    total, rows, matches = await asyncio.to_thread(_query)
    return CardSearchResponse(
        total=total,
        page=page,
        page_size=page_size,
        cards=[_row_to_summary(r) for r in rows],
        deck_matches=matches,
    )
```

- [ ] **Step 5: Add the syntax entry**

In `mtgDB/api/routers/cards.py`, insert before the `"keyword": "atag:"` entry's opening `{`:

```python
            {
                "keyword": "deck:",
                "aliases": ["precon:"],
                "field": "Commander precon",
                "operators": [":"],
                "notes": (
                    "Finds cards in a Commander precon. Matches part of the deck name, a commander, "
                    "or the set name, or the exact set code, ignoring capitals, accents and punctuation. "
                    "Matches any printing of those cards. Also supports | and & between values: "
                    "deck:a|b is in either, deck:a&b is in both."
                ),
                "examples": [
                    "deck:necron", "precon:szarekh", 'deck:"iron alliance"', "deck:warhammer",
                    "deck:necron|urza t:artifact t:creature", "deck:necron&urza", "-deck:urza",
                ],
            },
```

- [ ] **Step 6: Update the README**

In `mtgDB/README.md`, replace:

```
  avgCommander, and scryfallDataAnalysis. Routers: `cards`, `sets`, `sealed`, `ev`.
```

with:

```
  avgCommander, and scryfallDataAnalysis. Routers: `cards`, `sets`, `sealed`, `ev`.
  Commander precon lists are imported into `app.decks` and `app.deck_cards` and
  searched with `deck:`.

## Tests

`scripts/test.sh api` or `scripts/test.sh manager`, plus optional pytest arguments.
Needs Docker but no running stack.
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `mtgDB/scripts/test.sh api`
Expected: all tests pass

- [ ] **Step 8: Commit**

```bash
cd mtgDB
git add api/deck_lookup.py api/routers/cards.py api/tests/test_deck_lookup.py README.md
git commit -m "Report matched decks on deck: searches"
```

- [ ] **Step 9: Deploy and verify (confirm with owner first)**

```bash
cd mtgDB && docker compose up -d --build api
B='http://localhost:8000/cards/search'
curl -s "$B?q=deck:necron&page_size=1" | jq '{total, decks: [.deck_matches[].decks[].name]}'
curl -s "$B?q=deck:szarekh&page_size=1" | jq '[.deck_matches[].decks[].name]'
curl -s "$B?q=deck:warhammer&page_size=1" | jq '[.deck_matches[].decks[].name]'
curl -s "$B?q=deck:urza&page_size=1" | jq '[.deck_matches[].decks[].name]'
curl -s "$B?q=deck:borg&page_size=1" | jq '{total, decks: [.deck_matches[].decks[] | {name, list_available}]}'
curl -s "$B?q=t:creature&page_size=1" | jq '.deck_matches'
curl -s -G "$B" --data-urlencode 'q=deck:necron "Sol Ring"' | jq '[.cards[] | {name, set_code}]'
curl -s -o /dev/null -w '%{http_code} %{time_total}s\n' -G "$B" --data-urlencode 'q=deck:necron|urza t:artifact t:creature'
curl -s -G "$B" --data-urlencode 'q=back:(deck:necron)' | jq '.detail'
```

Expected:
- `deck:necron`: total 71, with Necron Dynasties listed
- `deck:szarekh`: Necron Dynasties
- `deck:warhammer`: includes all four 40K precons
- `deck:urza`: includes Urza's Iron Alliance, and not the Jumpstart pack
- `deck:borg`: total 0, We Are the Borg with `list_available: false`
- `t:creature`: `[]`
- Sol Ring: one row, from a set other than 40K
- Combined query: status 200, well under 15 s
- `back:(deck:necron)`: the error message

If `deck:necron` isn't 71, compare it with the default exclusions in `_default_where_extra` before changing anything, and report the result.

---

### Task 5: `GET /cards/{uuid}/decks`

**Files:**
- Modify: `mtgDB/api/deck_lookup.py`
- Modify: `mtgDB/api/routers/cards.py` (imports, new route at end of file)
- Test: `mtgDB/api/tests/test_deck_lookup.py`

**Interfaces:**
- Consumes: `DeckSummary`, `DECK_COLUMNS`, `row_to_deck`.
- Produces: `decks_for_card(cur, uuid: str) -> list[DeckSummary] | None` (`None` means unknown UUID); route `GET /cards/{uuid}/decks` returning `DeckSummary[]`.

- [ ] **Step 1: Write the failing tests**

Change the first import in `mtgDB/api/tests/test_deck_lookup.py` to:

```python
from deck_lookup import deck_matches, decks_for_card, row_to_deck
```

Append:

```python
def test_decks_for_card_returns_none_for_unknown_uuid():
    assert decks_for_card(FakeCursor(None), "missing") is None


def test_decks_for_card_returns_empty_without_oracle_id():
    cur = FakeCursor((None,))
    assert decks_for_card(cur, "uuid-1") == []
    assert len(cur.calls) == 1


def test_decks_for_card_looks_up_by_oracle_id():
    cur = FakeCursor(("oracle-1",), [NECRON])
    decks = decks_for_card(cur, "uuid-1")
    assert [d.name for d in decks] == ["Necron Dynasties"]
    assert cur.calls[0][1] == ("uuid-1",)
    assert cur.calls[1][1] == ("oracle-1",)
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `mtgDB/scripts/test.sh api tests/test_deck_lookup.py`
Expected: collection error, `cannot import name 'decks_for_card'`

- [ ] **Step 3: Write the implementation**

Append to `mtgDB/api/deck_lookup.py`:

```python


def decks_for_card(cur, uuid: str) -> list[DeckSummary] | None:
    """Decks containing any printing of this card. None if the uuid is unknown."""
    cur.execute('SELECT "scryfallOracleId" FROM mtgjson."cardIdentifiers" WHERE "uuid" = %s', (uuid,))
    row = cur.fetchone()
    if row is None:
        return None
    if row[0] is None:
        return []
    cur.execute(
        f"SELECT {DECK_COLUMNS} FROM app.decks d "
        "WHERE EXISTS (SELECT 1 FROM app.deck_cards dc WHERE dc.deck_id = d.deck_id AND dc.oracle_id = %s) "
        "ORDER BY d.release_date DESC NULLS LAST, d.name",
        (row[0],),
    )
    return [row_to_deck(r) for r in cur.fetchall()]
```

In `mtgDB/api/routers/cards.py`, replace:

```python
from deck_lookup import DeckTermMatch, deck_matches
```

with:

```python
from deck_lookup import DeckSummary, DeckTermMatch, deck_matches, decks_for_card
```

Append to the end of the file:

```python


@router.get("/{uuid}/decks", response_model=list[DeckSummary])
async def get_card_decks(uuid: str):
    def _query():
        with db.get_conn() as conn:
            with conn.cursor() as cur:
                return decks_for_card(cur, uuid)

    decks = await asyncio.to_thread(_query)
    if decks is None:
        raise HTTPException(status_code=404, detail="Card not found")
    return decks
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `mtgDB/scripts/test.sh api`
Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
cd mtgDB
git add api/deck_lookup.py api/routers/cards.py api/tests/test_deck_lookup.py
git commit -m "Add GET /cards/{uuid}/decks"
```

- [ ] **Step 6: Deploy and verify (confirm with owner first)**

```bash
cd mtgDB && docker compose up -d --build api
B='http://localhost:8000/cards'
SOL=$(curl -s -G "$B/search" --data-urlencode 'q="Sol Ring"' | jq -r '.cards[0].uuid')
curl -s "$B/$SOL/decks" | jq 'length, [.[].name][0:3]'
LOTUS=$(curl -s -G "$B/search" --data-urlencode 'q="Black Lotus"' | jq -r '.cards[0].uuid')
curl -s "$B/$LOTUS/decks" | jq 'length'
curl -s -o /dev/null -w '%{http_code}\n' "$B/not-a-card/decks"
```

Expected: Sol Ring has many decks, newest first. Black Lotus returns `0`. The unknown UUID returns `404`.

---

### Task 6: Match line in Codex

**Files:**
- Create: `mtgSearch/frontend/src/lib/decks.ts`
- Create: `mtgSearch/frontend/src/components/DeckMatchLine.tsx`
- Modify: `mtgSearch/frontend/src/types.ts`
- Modify: `mtgSearch/frontend/src/pages/SearchPage.tsx`
- Test: `mtgSearch/frontend/src/lib/decks.test.ts`

**Interfaces:**
- Consumes: the `deck_matches` response field.
- Produces:
  - In `types.ts`: `DeckSummary`, `DeckTermMatch`
  - In `lib/decks.ts`: `formatDeckMatchLine(matches: DeckTermMatch[]): string[]`

- [ ] **Step 1: Add the types**

The branch `precon-deck-search` already exists in `mtgSearch` and holds the spec and this plan. Run `git -C mtgSearch checkout precon-deck-search` if needed.

In `mtgSearch/frontend/src/types.ts`, replace:

```ts
export interface CardSearchResponse {
  total: number;
  page: number;
  page_size: number;
  cards: CardSummary[];
}
```

with:

```ts
export interface DeckSummary {
  deck_id: string;
  name: string;
  set_code: string;
  set_name: string | null;
  release_date: string | null;
  commanders: string[];
  list_available: boolean;
}

export interface DeckTermMatch {
  term: string;
  decks: DeckSummary[];
}

export interface CardSearchResponse {
  total: number;
  page: number;
  page_size: number;
  cards: CardSummary[];
  deck_matches?: DeckTermMatch[];
}
```

- [ ] **Step 2: Write the failing tests**

Create `mtgSearch/frontend/src/lib/decks.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatDeckMatchLine } from "./decks";
import type { DeckSummary } from "../types";

function deck(name: string, list_available = true): DeckSummary {
  return {
    deck_id: name,
    name,
    set_code: "TST",
    set_name: null,
    release_date: null,
    commanders: [],
    list_available,
  };
}

describe("formatDeckMatchLine", () => {
  it("is empty without matches", () => {
    expect(formatDeckMatchLine([])).toEqual([]);
  });

  it("lists matched decks", () => {
    expect(
      formatDeckMatchLine([
        { term: "necron", decks: [deck("Necron Dynasties")] },
        { term: "urza", decks: [deck("Urza's Iron Alliance")] },
      ]),
    ).toEqual(["Necron Dynasties", "Urza's Iron Alliance"]);
  });

  it("shows three names, then a count", () => {
    expect(
      formatDeckMatchLine([{ term: "warhammer", decks: ["A", "B", "C", "D", "E"].map((n) => deck(n)) }]),
    ).toEqual(["A", "B", "C", "+2 more"]);
  });

  it("doesn't repeat a deck matched by two terms", () => {
    expect(
      formatDeckMatchLine([
        { term: "necron", decks: [deck("Necron Dynasties")] },
        { term: "szarekh", decks: [deck("Necron Dynasties")] },
      ]),
    ).toEqual(["Necron Dynasties"]);
  });

  it("explains a term with no match", () => {
    expect(formatDeckMatchLine([{ term: "xyz", decks: [] }])).toEqual(['No precon matches "xyz"']);
  });

  it("explains a single unpublished deck", () => {
    expect(formatDeckMatchLine([{ term: "borg", decks: [deck("We Are the Borg", false)] }])).toEqual([
      "borg: We Are the Borg's card list isn't published yet",
    ]);
  });

  it("explains several unpublished decks", () => {
    expect(
      formatDeckMatchLine([{ term: "trek", decks: ["A", "B", "C", "D"].map((n) => deck(n, false)) }]),
    ).toEqual(["trek: 4 decks aren't published yet"]);
  });

  it("doesn't count problems toward the three names", () => {
    expect(
      formatDeckMatchLine([
        { term: "a", decks: ["A", "B", "C"].map((n) => deck(n)) },
        { term: "borg", decks: [deck("We Are the Borg", false)] },
        { term: "xyz", decks: [] },
      ]),
    ).toEqual([
      "A",
      "B",
      "C",
      "borg: We Are the Borg's card list isn't published yet",
      'No precon matches "xyz"',
    ]);
  });

  it("ignores unpublished decks when a term also has published ones", () => {
    expect(formatDeckMatchLine([{ term: "x", decks: [deck("Out"), deck("Soon", false)] }])).toEqual(["Out"]);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `cd mtgSearch/frontend && npx vitest run src/lib/decks.test.ts`
Expected: FAIL, cannot resolve `./decks`

- [ ] **Step 4: Write the implementation**

Create `mtgSearch/frontend/src/lib/decks.ts`:

```ts
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
```

Create `mtgSearch/frontend/src/components/DeckMatchLine.tsx`:

```tsx
import { formatDeckMatchLine } from "../lib/decks";
import type { DeckTermMatch } from "../types";

export default function DeckMatchLine({ matches }: { matches: DeckTermMatch[] }) {
  const segments = formatDeckMatchLine(matches);
  if (segments.length === 0) return null;
  return <p className="-mt-2 mb-4 text-sm text-neutral-400">{segments.join(" · ")}</p>;
}
```

- [ ] **Step 5: Show it on the search page**

In `mtgSearch/frontend/src/pages/SearchPage.tsx`, replace:

```tsx
import SortControls from "../components/SortControls";
```

with:

```tsx
import SortControls from "../components/SortControls";
import DeckMatchLine from "../components/DeckMatchLine";
```

Replace:

```tsx
                <SortControls sort={sort} order={order} onChange={handleSort} />
              </div>
            )}

            <CardGrid
```

with:

```tsx
                <SortControls sort={sort} order={order} onChange={handleSort} />
              </div>
            )}

            {results?.deck_matches && <DeckMatchLine matches={results.deck_matches} />}

            <CardGrid
```

- [ ] **Step 6: Run the tests and build**

Run: `cd mtgSearch/frontend && npm test && npm run build`
Expected: all tests pass and the build succeeds

- [ ] **Step 7: Commit**

```bash
cd mtgSearch
git add frontend/src/types.ts frontend/src/lib/decks.ts frontend/src/lib/decks.test.ts frontend/src/components/DeckMatchLine.tsx frontend/src/pages/SearchPage.tsx
git commit -m "Show which decks a deck: search matched"
```

---

### Task 7: "In precons" panel

**Files:**
- Create: `mtgSearch/frontend/src/components/PreconPanel.tsx`
- Modify: `mtgSearch/frontend/src/lib/decks.ts`
- Modify: `mtgSearch/frontend/src/pages/CardPage.tsx`
- Modify: `mtgSearch/README.md`
- Test: `mtgSearch/frontend/src/lib/decks.test.ts`

**Interfaces:**
- Consumes: `GET /api/cards/{uuid}/decks`, `DeckSummary`.
- Produces, in `lib/decks.ts`: `deckTermValue(name: string): string`, `deckSearchQuery(name: string): string`.

- [ ] **Step 1: Write the failing tests**

In `mtgSearch/frontend/src/lib/decks.test.ts`, replace:

```ts
import { formatDeckMatchLine } from "./decks";
```

with:

```ts
import { deckSearchQuery, deckTermValue, formatDeckMatchLine } from "./decks";
```

Append:

```ts
describe("deckTermValue", () => {
  it("leaves ordinary names alone", () => {
    expect(deckTermValue("Urza's Iron Alliance")).toBe("Urza's Iron Alliance");
  });

  it("removes characters the parser would treat as syntax", () => {
    expect(deckTermValue('Foo & Bar | "Baz"')).toBe("Foo Bar Baz");
  });
});

describe("deckSearchQuery", () => {
  it("builds a quoted deck: filter", () => {
    expect(deckSearchQuery("Necron Dynasties")).toBe('deck:"Necron Dynasties"');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd mtgSearch/frontend && npx vitest run src/lib/decks.test.ts`
Expected: FAIL, `deckTermValue` and `deckSearchQuery` aren't functions

- [ ] **Step 3: Write the helpers and panel**

Append to `mtgSearch/frontend/src/lib/decks.ts`:

```ts

/** A deck name that's safe inside quotes: the parser would split on | and &. */
export function deckTermValue(name: string): string {
  return name.replace(/[|&"]/g, " ").replace(/\s+/g, " ").trim();
}

export function deckSearchQuery(name: string): string {
  return `deck:"${deckTermValue(name)}"`;
}
```

Create `mtgSearch/frontend/src/components/PreconPanel.tsx`:

```tsx
import { Link } from "react-router-dom";
import { deckSearchQuery } from "../lib/decks";
import type { DeckSummary } from "../types";

interface Props {
  decks: DeckSummary[];
  accent: string;
}

export default function PreconPanel({ decks, accent }: Props) {
  if (decks.length === 0) return null;

  return (
    <div className="rounded-2xl bg-neutral-50 border border-neutral-200/70 p-5">
      <p className="flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500 mb-3">
        <span className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: accent }} />
        In precons ({decks.length})
      </p>

      <div className="space-y-0.5 max-h-72 overflow-y-auto pr-1">
        {decks.map((deck) => (
          <Link
            key={deck.deck_id}
            to={`/?q=${encodeURIComponent(deckSearchQuery(deck.name))}`}
            className="flex items-center gap-2 py-1.5 px-2 text-sm rounded-lg transition-colors hover:bg-white"
          >
            <span className="min-w-0 flex-1 truncate text-neutral-900">{deck.name}</span>
            <span className="shrink-0 text-neutral-400 text-xs uppercase">
              {deck.set_code}
              {deck.release_date && ` · ${deck.release_date.slice(0, 4)}`}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Show it on the card page**

In `mtgSearch/frontend/src/pages/CardPage.tsx`, replace:

```tsx
import type { CardDetail, FaceSummary, Legalities, PrintingSummary } from "../types";
```

with:

```tsx
import type { CardDetail, DeckSummary, FaceSummary, Legalities, PrintingSummary } from "../types";
```

Replace:

```tsx
import PrintingsPanel from "../components/PrintingsPanel";
```

with:

```tsx
import PrintingsPanel from "../components/PrintingsPanel";
import PreconPanel from "../components/PreconPanel";
```

Replace:

```tsx
  const [printings, setPrintings] = useState<PrintingSummary[]>([]);
  const [loading, setLoading] = useState(true);
```

with:

```tsx
  const [printings, setPrintings] = useState<PrintingSummary[]>([]);
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [loading, setLoading] = useState(true);
```

Replace:

```tsx
    setPrintings([]);
    fetch(`/api/cards/${uuid}`)
```

with:

```tsx
    setPrintings([]);
    setDecks([]);
    fetch(`/api/cards/${uuid}`)
```

Replace:

```tsx
      .catch(() => setPrintings([]));
  }, [uuid]);
```

with:

```tsx
      .catch(() => setPrintings([]));

    fetch(`/api/cards/${uuid}/decks`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: DeckSummary[]) => setDecks(data))
      .catch(() => setDecks([]));
  }, [uuid]);
```

Replace:

```tsx
            </div>

            {card.legalities && (
```

with:

```tsx
            </div>

            {decks.length > 0 && (
              <div className="mt-5">
                <PreconPanel decks={decks} accent={accent} />
              </div>
            )}

            {card.legalities && (
```

- [ ] **Step 5: Update the README**

In `mtgSearch/README.md`, replace:

```
- `GET /api/cards/{uuid}`
```

with:

```
- `GET /api/cards/{uuid}`
- `GET /api/cards/{uuid}/printings`
- `GET /api/cards/{uuid}/decks`
```

- [ ] **Step 6: Run the tests and build**

Run: `cd mtgSearch/frontend && npm test && npm run build`
Expected: all tests pass and the build succeeds

- [ ] **Step 7: Commit**

```bash
cd mtgSearch
git add frontend/src/lib/decks.ts frontend/src/lib/decks.test.ts frontend/src/components/PreconPanel.tsx frontend/src/pages/CardPage.tsx README.md
git commit -m "Add In precons panel to card pages"
```

- [ ] **Step 8: Deploy and check in a browser (confirm with owner first)**

```bash
cd mtgSearch && docker compose up -d --build
```

Find the published port with `docker compose ps`, then check with Playwright or a browser:

- `deck:necron|borg t:artifact t:creature` shows one muted line with Necron Dynasties and the Borg message.
- `t:creature` shows no match line.
- The Sol Ring card page shows "In precons (N)" with a scrolling list. Clicking a row opens a search for that deck.
- The Black Lotus card page shows no panel.
- At 375 px wide, the line wraps and the page doesn't scroll sideways.

---

### Task 8: `GET /decks` (removable)

**Files:**
- Create: `mtgDB/api/routers/decks.py`
- Modify: `mtgDB/api/main.py`
- Test: `mtgDB/api/tests/test_decks_router.py`

**Interfaces:**
- Consumes: `DeckSummary`, `DECK_COLUMNS`, `row_to_deck`, `DECK_MATCH_SQL`, `deck_match_params`, `normalize_deck_text`.
- Produces: `suggest_decks(cur, q: str, limit: int) -> list[DeckSummary]`; route `GET /decks?q=&limit=`.

- [ ] **Step 1: Write the failing tests**

Create `mtgDB/api/tests/test_decks_router.py`:

```python
from routers.decks import suggest_decks


class FakeCursor:
    def __init__(self, rows):
        self.rows = rows
        self.calls = []

    def execute(self, sql, params=None):
        self.calls.append((sql, params))

    def fetchall(self):
        return self.rows


NECRON = ("NecronDynasties_40K", "Necron Dynasties", "40K", "Warhammer 40,000 Commander",
          "2022-10-07", ["Szarekh, the Silent King"], True)


def test_short_query_runs_no_sql():
    cur = FakeCursor([NECRON])
    assert suggest_decks(cur, "n", 8) == []
    assert suggest_decks(cur, "!!!", 8) == []
    assert cur.calls == []


def test_returns_decks_and_ranks_with_normalized_term():
    cur = FakeCursor([NECRON])
    decks = suggest_decks(cur, "Urza's", 5)
    assert [d.name for d in decks] == ["Necron Dynasties"]
    sql, params = cur.calls[0]
    assert "ORDER BY" in sql
    assert params == ("%urzas%", "URZA'S", "urzas%", "% urzas%", 5)
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `mtgDB/scripts/test.sh api tests/test_decks_router.py`
Expected: collection error, `No module named 'routers.decks'`

- [ ] **Step 3: Write the router**

Create `mtgDB/api/routers/decks.py`:

```python
import asyncio

from fastapi import APIRouter, Query

import db
from deck_lookup import DECK_COLUMNS, DeckSummary, row_to_deck
from deck_text import DECK_MATCH_SQL, deck_match_params, normalize_deck_text

router = APIRouter()

MIN_QUERY_LENGTH = 2


def suggest_decks(cur, q: str, limit: int) -> list[DeckSummary]:
    normalized = normalize_deck_text(q)
    if len(normalized) < MIN_QUERY_LENGTH:
        return []
    # search_text starts with the deck name, so a prefix match is a name match.
    cur.execute(
        f"SELECT {DECK_COLUMNS} FROM app.decks d WHERE {DECK_MATCH_SQL} "
        "ORDER BY (d.search_text LIKE %s) DESC, (d.search_text LIKE %s) DESC, "
        "d.release_date DESC NULLS LAST, d.name "
        "LIMIT %s",
        (*deck_match_params(q), f"{normalized}%", f"% {normalized}%", limit),
    )
    return [row_to_deck(r) for r in cur.fetchall()]


@router.get("", response_model=list[DeckSummary])
async def list_deck_suggestions(
    q: str = Query("", max_length=80, description="Part of a deck name, commander or set name, or a set code"),
    limit: int = Query(8, ge=1, le=20),
):
    """Autocomplete for the deck: search filter."""

    def _query():
        with db.get_conn() as conn:
            with conn.cursor() as cur:
                return suggest_decks(cur, q, limit)

    return await asyncio.to_thread(_query)
```

In `mtgDB/api/main.py`, replace:

```python
from routers import cards, ev, sealed, sets, symbols, tags
```

with:

```python
from routers import cards, decks, ev, sealed, sets, symbols, tags
```

Replace:

```python
app.include_router(tags.router, prefix="/tags", tags=["tags"])
```

with:

```python
app.include_router(tags.router, prefix="/tags", tags=["tags"])
app.include_router(decks.router, prefix="/decks", tags=["decks"])
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `mtgDB/scripts/test.sh api`
Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
cd mtgDB
git add api/routers/decks.py api/main.py api/tests/test_decks_router.py
git commit -m "Add GET /decks autocomplete"
```

- [ ] **Step 6: Deploy and verify (confirm with owner first)**

```bash
cd mtgDB && docker compose up -d --build api
curl -s 'http://localhost:8000/decks?q=neco' | jq '[.[].name]'
curl -s 'http://localhost:8000/decks?q=necr' | jq '[.[].name]'
curl -s 'http://localhost:8000/decks?q=szarekh' | jq '[.[].name]'
curl -s 'http://localhost:8000/decks?q=borg' | jq '[.[] | {name, list_available}]'
curl -s 'http://localhost:8000/decks?q=n' | jq 'length'
curl -s -o /dev/null -w '%{time_total}s\n' 'http://localhost:8000/decks?q=war'
```

Expected: `neco` returns nothing, because this isn't fuzzy matching. `necr` and `szarekh` return Necron Dynasties. `borg` returns We Are the Borg, unpublished. `n` returns `0`. `war` responds in well under 100 ms.

---

### Task 9: Autocomplete in the search box (removable)

This must be the last commit in `mtgSearch`.

**Files:**
- Create: `mtgSearch/frontend/src/lib/deckAutocomplete.ts`
- Create: `mtgSearch/frontend/src/hooks/useDeckSuggestions.ts`
- Modify: `mtgSearch/frontend/src/components/SearchHeader.tsx`
- Modify: `mtgSearch/README.md`
- Test: `mtgSearch/frontend/src/lib/deckAutocomplete.test.ts`

**Interfaces:**
- Consumes: `GET /api/decks`, `DeckSummary`, `deckTermValue` from Task 7, and `useDebouncedValue` from `builder/useDebouncedValue.ts` (imported, not changed).
- Produces, in `lib/deckAutocomplete.ts`:
  - `DeckToken`, with `start`, `end`, `key`, `term`
  - `findDeckToken(value: string, cursor: number): DeckToken | null`
  - `applyDeckSuggestion(value: string, token: DeckToken, name: string): { value: string; cursor: number }`

- [ ] **Step 1: Write the failing tests**

Create `mtgSearch/frontend/src/lib/deckAutocomplete.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { applyDeckSuggestion, findDeckToken } from "./deckAutocomplete";

const atEnd = (value: string) => findDeckToken(value, value.length);

describe("findDeckToken", () => {
  it("ignores ordinary searches", () => {
    expect(atEnd("")).toBeNull();
    expect(atEnd("sol ring")).toBeNull();
    expect(atEnd("t:artifact")).toBeNull();
    expect(atEnd('o:"deck:necron')).toBeNull();
  });

  it("needs two characters", () => {
    expect(atEnd("deck:")).toBeNull();
    expect(atEnd("deck:n")).toBeNull();
    expect(atEnd('deck:"n')).toBeNull();
    expect(atEnd("deck:ne")).toMatchObject({ key: "deck:", term: "ne" });
  });

  it("accepts precon, negation and capitals", () => {
    expect(atEnd("precon:ne")).toMatchObject({ key: "precon:", term: "ne" });
    expect(atEnd("-deck:ne")).toMatchObject({ key: "-deck:", term: "ne" });
    expect(atEnd("DECK:ne")).toMatchObject({ key: "DECK:", term: "ne" });
  });

  it("finds a token after other tokens and parens", () => {
    expect(atEnd("t:artifact deck:ne")).toMatchObject({ start: 11, term: "ne" });
    expect(atEnd("(deck:ne")).toMatchObject({ start: 1, term: "ne" });
  });

  it("supports opened quotes with spaces", () => {
    expect(atEnd('deck:"iron all')).toMatchObject({ key: "deck:", term: "iron all" });
  });

  it("stops suggesting once a quote closes", () => {
    expect(atEnd('deck:"iron alliance"')).toBeNull();
  });

  it("doesn't suggest after | or &", () => {
    expect(atEnd("deck:necron|ur")).toBeNull();
    expect(atEnd("deck:necron&ur")).toBeNull();
  });

  it("uses the cursor, not the end of the input", () => {
    const value = "deck:necron t:artifact";
    expect(findDeckToken(value, 8)).toMatchObject({ start: 0, end: 11, term: "nec" });
    expect(findDeckToken(value, value.length)).toBeNull();
  });

  it("includes the rest of a quoted term in the replaced range", () => {
    expect(findDeckToken('deck:"iron alliance" x', 9)).toMatchObject({ start: 0, end: 20 });
  });
});

describe("applyDeckSuggestion", () => {
  it("replaces the term and adds a space at the end of the input", () => {
    const value = "t:artifact deck:ne";
    const result = applyDeckSuggestion(value, atEnd(value)!, "Necron Dynasties");
    expect(result.value).toBe('t:artifact deck:"Necron Dynasties" ');
    expect(result.cursor).toBe(result.value.length);
  });

  it("keeps the key the user typed", () => {
    const value = "-precon:ne";
    expect(applyDeckSuggestion(value, atEnd(value)!, "Necron Dynasties").value).toBe(
      '-precon:"Necron Dynasties" ',
    );
  });

  it("keeps text after the token", () => {
    const value = "deck:nec t:artifact";
    const result = applyDeckSuggestion(value, findDeckToken(value, 8)!, "Necron Dynasties");
    expect(result.value).toBe('deck:"Necron Dynasties" t:artifact');
    expect(result.cursor).toBe('deck:"Necron Dynasties"'.length);
  });

  it("sanitizes names containing parser syntax", () => {
    const value = "deck:fo";
    expect(applyDeckSuggestion(value, atEnd(value)!, "Foo & Bar").value).toBe('deck:"Foo Bar" ');
  });

  it("produces a value that stops suggesting", () => {
    const value = "deck:ne";
    const result = applyDeckSuggestion(value, atEnd(value)!, "Necron Dynasties");
    expect(findDeckToken(result.value, result.cursor)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd mtgSearch/frontend && npx vitest run src/lib/deckAutocomplete.test.ts`
Expected: FAIL, cannot resolve `./deckAutocomplete`

- [ ] **Step 3: Write the token logic**

Create `mtgSearch/frontend/src/lib/deckAutocomplete.ts`:

```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd mtgSearch/frontend && npx vitest run src/lib/deckAutocomplete.test.ts`
Expected: all tests pass

- [ ] **Step 5: Write the suggestions hook**

Create `mtgSearch/frontend/src/hooks/useDeckSuggestions.ts`:

```ts
import { useEffect, useState } from "react";
import { useDebouncedValue } from "../builder/useDebouncedValue";
import type { DeckSummary } from "../types";

const DEBOUNCE_MS = 150;
const EMPTY: DeckSummary[] = [];

/** Deck suggestions for a term. A null term makes no request. */
export function useDeckSuggestions(term: string | null): DeckSummary[] {
  const debounced = useDebouncedValue(term, DEBOUNCE_MS);
  const [items, setItems] = useState<DeckSummary[]>(EMPTY);

  useEffect(() => {
    if (!debounced) {
      setItems(EMPTY);
      return;
    }
    const ctrl = new AbortController();
    fetch(`/api/decks?${new URLSearchParams({ q: debounced, limit: "8" })}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Error ${r.status}`))))
      .then((data: DeckSummary[]) => setItems(data))
      .catch(() => {
        if (!ctrl.signal.aborted) setItems(EMPTY);
      });
    return () => ctrl.abort();
  }, [debounced]);

  return term ? items : EMPTY;
}
```

- [ ] **Step 6: Add it to the search header**

In `mtgSearch/frontend/src/components/SearchHeader.tsx`, replace:

```tsx
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
```

with:

```tsx
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { useDeckSuggestions } from "../hooks/useDeckSuggestions";
import { applyDeckSuggestion, findDeckToken } from "../lib/deckAutocomplete";
import type { DeckSummary } from "../types";
```

Replace:

```tsx
  const [value, setValue] = useState(initialQuery);

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(value);
  };
```

with:

```tsx
  const [value, setValue] = useState(initialQuery);
  const [cursor, setCursor] = useState(0);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCursor = useRef<number | null>(null);

  const token = focused && !dismissed ? findDeckToken(value, cursor) : null;
  const suggestions = useDeckSuggestions(token?.term ?? null);
  const open = token !== null && suggestions.length > 0;

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setActive(-1);
  }, [token?.term]);

  useLayoutEffect(() => {
    if (pendingCursor.current === null) return;
    inputRef.current?.setSelectionRange(pendingCursor.current, pendingCursor.current);
    pendingCursor.current = null;
  }, [value]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setDismissed(true);
    onSearch(value);
  };

  const accept = (deck: DeckSummary) => {
    if (!token) return;
    const next = applyDeckSuggestion(value, token, deck.name);
    pendingCursor.current = next.cursor;
    setValue(next.value);
    setCursor(next.cursor);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      accept(suggestions[active]);
    } else if (e.key === "Tab") {
      e.preventDefault();
      accept(suggestions[Math.max(active, 0)]);
    } else if (e.key === "Escape") {
      setDismissed(true);
    }
  };
```

Replace:

```tsx
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder='Search cards… e.g. t:creature r:mythic f:modern'
            className="flex-1 min-w-0 font-body text-sm bg-white border border-neutral-300 rounded-xl px-3.5 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
          />
```

with:

```tsx
          <div className="relative flex-1 min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setCursor(e.target.selectionStart ?? e.target.value.length);
                setDismissed(false);
              }}
              onSelect={(e) => setCursor(e.currentTarget.selectionStart ?? 0)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={onKeyDown}
              role="combobox"
              aria-expanded={open}
              aria-controls="deck-suggestions"
              aria-autocomplete="list"
              aria-activedescendant={open && active >= 0 ? `deck-suggestion-${active}` : undefined}
              placeholder='Search cards… e.g. t:creature r:mythic f:modern'
              className="w-full font-body text-sm bg-white border border-neutral-300 rounded-xl px-3.5 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
            />
            {open && (
              <ul
                id="deck-suggestions"
                role="listbox"
                className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-neutral-200 rounded-xl shadow-lg py-1 overflow-hidden"
              >
                {suggestions.map((deck, i) => (
                  <li
                    key={deck.deck_id}
                    id={`deck-suggestion-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      accept(deck);
                    }}
                    className={`px-3.5 py-1.5 font-body text-sm cursor-pointer truncate ${
                      i === active ? "bg-neutral-100" : "hover:bg-neutral-50"
                    }`}
                  >
                    <span className="text-neutral-900">{deck.name}</span>
                    <span className="ml-2 text-xs text-neutral-400">
                      {deck.list_available
                        ? [deck.commanders[0], deck.set_name].filter(Boolean).join(" · ")
                        : "list not published"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
```

- [ ] **Step 7: Update the README**

In `mtgSearch/README.md`, replace:

```
- `GET /api/cards/{uuid}/decks`
```

with:

```
- `GET /api/cards/{uuid}/decks`
- `GET /api/decks`
```

- [ ] **Step 8: Run all tests and build**

Run: `cd mtgSearch/frontend && npm test && npm run build`
Expected: all tests pass and the build succeeds

- [ ] **Step 9: Commit**

```bash
cd mtgSearch
git add frontend/src/lib/deckAutocomplete.ts frontend/src/lib/deckAutocomplete.test.ts frontend/src/hooks/useDeckSuggestions.ts frontend/src/components/SearchHeader.tsx README.md
git commit -m "Add deck: autocomplete to the search box"
```

---

### Task 10: Final verification

No new code or commits. Don't merge or push; that's the owner's decision.

- [ ] **Step 1: Run all the tests**

```bash
mtgDB/scripts/test.sh api
mtgDB/scripts/test.sh manager
cd mtgSearch/frontend && npm test && npm run build
```

Expected: everything passes.

- [ ] **Step 2: Prove autocomplete is removable**

The working tree must be clean first, and the autocomplete commit must be `HEAD`.

```bash
cd mtgSearch
git status --short
git log -1 --format=%s
git revert --no-commit HEAD
(cd frontend && npm test && npm run build)
git restore --source=HEAD --staged --worktree .
git status --short
```

Expected: the first status is empty, the subject is `Add deck: autocomplete to the search box`, tests and build pass with the commit reverted, and the last status is empty.

- [ ] **Step 3: Deploy and check in a browser (confirm with owner first)**

```bash
cd mtgSearch && docker compose up -d --build
```

Check each with Playwright or a browser:

| Action | Expected |
|---|---|
| Type `t:creature` | No suggestions; network panel shows no `/api/decks` requests |
| Type `deck:necr` | Necron Dynasties suggested, showing commander and set; layout doesn't shift |
| Press Enter with nothing arrowed to | Runs the search for `deck:necr` and the list closes |
| Type `deck:necr`, press Down, then Enter | Input becomes `deck:"Necron Dynasties" `; search doesn't run |
| Type `deck:necr`, press Tab | Same result as above |
| Type `deck:necr`, press Escape | List closes; text stays |
| Type `deck:necr`, click a row | Same result as Tab; input keeps focus |
| Type `deck:borg` | We Are the Borg, marked `list not published` |
| Type `deck:necron\|ur` | No suggestions |
| Open the Build a card page | Unchanged |
| Search with `deck:necron` at 375 px wide | List fits the input width; page doesn't scroll sideways |

- [ ] **Step 4: Report to the owner**

Report the test results, each check above, and any difference from the expected values. Ask the owner to try autocomplete and decide whether it stays. If it goes:

```bash
cd mtgSearch && git revert HEAD
cd ../mtgDB && git revert HEAD
```
