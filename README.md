# Codex Etherium

Card search UI for the mtgDB database. Subdomain: `codexetherium.sejoma.net`.

React 19 + Vite + Tailwind v4 + TypeScript single-page app (`frontend/`), served
by a minimal FastAPI backend (`backend/main.py`) that proxies `/api/*` to the
mtgDB API (`http://api:8000`) over the shared `mtg_data` network.

## Routes

- `/` — card search page
- `/syntax` — search syntax reference

## API used

- `GET /api/cards/search?q=&sort=&order=&page=&page_size=`
- `GET /api/cards/search/syntax`
- `GET /api/cards/{uuid}`
- `GET /api/cards/{uuid}/printings`
- `GET /api/cards/{uuid}/decks`
- `GET /api/decks`

Card images are fetched directly from the Scryfall CDN (URLs come from mtgDB,
never proxied). Data attribution: "Card data: MTGJSON. Images and prices:
Scryfall (CC BY 4.0)".

## Run

Requires the `mtgDB` stack running first (provides the `mtg_data` network and
`api` service).

```bash
cd mtgSearch && docker compose up -d --build
```

Frontend dev server: `cd frontend && npm run dev`.
