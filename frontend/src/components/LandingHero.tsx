import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { CardSummary } from "../types";
import CrownFan from "./CrownFan";

const CHIP =
  "inline-flex items-center gap-1.5 font-body text-sm text-neutral-600 border border-neutral-300 rounded-full px-3.5 py-1.5 hover:border-neutral-500 hover:text-neutral-900 transition-colors";

interface Props {
  onSearch: (query: string) => void;
}

export default function LandingHero({ onSearch }: Props) {
  const [value, setValue] = useState("");
  const [crown, setCrown] = useState<CardSummary[]>([]);

  useEffect(() => {
    fetch("/api/cards/landing/crown")
      .then((r) => (r.ok ? r.json() : []))
      .then(setCrown)
      .catch(() => setCrown([]));
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(value);
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-body flex flex-col">
      <header className="flex items-center px-6 lg:px-10 py-4">
        <Link
          to="/"
          className="font-display text-lg font-semibold text-neutral-900 hover:text-neutral-600 transition-colors"
        >
          <span className="sm:hidden">CE</span>
          <span className="hidden sm:inline">Codex Etherium</span>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
        <CrownFan cards={crown} />

        <h1 className="font-display text-5xl sm:text-6xl font-semibold text-neutral-900 text-center mt-12 mb-3">
          Codex Etherium
        </h1>
        <p className="font-body text-neutral-500 text-center mb-8 max-w-md">
          Search every card, every printing, every price.
        </p>

        <form onSubmit={submit} className="w-full max-w-2xl flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search cards… e.g. t:creature r:mythic f:modern"
            autoFocus
            className="flex-1 min-w-0 font-body text-base bg-white border border-neutral-300 rounded-full px-5 py-3.5 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
          />
          <button
            type="submit"
            className="font-body text-sm font-medium bg-neutral-900 hover:bg-neutral-700 text-white px-6 py-3.5 rounded-full transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        <nav aria-label="Search help" className="flex flex-wrap justify-center gap-2 mt-5">
          <Link to="/builder" className={CHIP}>
            <span aria-hidden>✦</span> Build a card
          </Link>
          <Link to="/syntax" className={CHIP}>
            <span aria-hidden>?</span> Syntax guide
          </Link>
        </nav>
      </main>
    </div>
  );
}
