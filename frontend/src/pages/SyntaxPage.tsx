import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { SyntaxDoc, SyntaxKeyword } from "../types";

function KeywordCard({ kw }: { kw: SyntaxKeyword }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-start gap-3 mb-2">
        <code className="text-amber-400 font-bold text-lg">{kw.keyword}</code>
        {kw.aliases.length > 0 && (
          <span className="text-gray-400 text-sm mt-1">
            aliases: {kw.aliases.map((a) => <code key={a} className="text-gray-300 mx-1">{a}</code>)}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-300 mb-1">
        <span className="text-gray-500">Field:</span> {kw.field}
      </p>
      <p className="text-sm text-gray-300 mb-1">
        <span className="text-gray-500">Operators:</span>{" "}
        {kw.operators.map((op) => (
          <code key={op} className="bg-gray-700 px-1 rounded text-amber-300 mr-1">{op}</code>
        ))}
      </p>
      <p className="text-sm text-gray-300 mb-3">{kw.notes}</p>
      {kw.flags && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Flags</p>
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(kw.flags).map(([flag, desc]) => (
              <div key={flag} className="text-sm">
                <code className="text-amber-300">{flag}</code>
                <span className="text-gray-400 ml-2">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Examples</p>
        <div className="flex flex-wrap gap-2">
          {kw.examples.map((ex) => (
            <code key={ex} className="bg-gray-900 border border-gray-700 px-2 py-0.5 rounded text-sm text-green-400">
              {ex}
            </code>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SyntaxPage() {
  const [doc, setDoc] = useState<SyntaxDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cards/search/syntax")
      .then((r) => r.json())
      .then(setDoc)
      .catch(() => setError("Failed to load syntax reference"));
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="bg-gray-900 border-b border-amber-900/40 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link
            to="/"
            className="text-amber-400 hover:text-amber-300 text-sm font-medium"
          >
            ← Back to search
          </Link>
          <h1 className="text-xl font-bold text-amber-400">Search Syntax</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {error && (
          <p className="text-red-400 bg-red-900/20 border border-red-800 rounded p-3">{error}</p>
        )}

        {!doc && !error && (
          <p className="text-gray-500 text-center py-12">Loading syntax reference…</p>
        )}

        {doc && (
          <div className="space-y-8">
            <section>
              <p className="text-gray-300 leading-relaxed">{doc.overview}</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-amber-400 mb-4 border-b border-gray-800 pb-2">
                Query Keywords
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doc.keywords.map((kw) => (
                  <KeywordCard key={kw.keyword} kw={kw} />
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-amber-400 mb-3 border-b border-gray-800 pb-2">
                Bare Words (Name Search)
              </h2>
              <p className="text-gray-300 mb-3">{doc.bare_words.description}</p>
              <div className="flex flex-wrap gap-2">
                {doc.bare_words.examples.map((ex) => (
                  <code key={ex} className="bg-gray-800 border border-gray-700 px-2 py-1 rounded text-sm text-green-400">
                    {ex}
                  </code>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-amber-400 mb-3 border-b border-gray-800 pb-2">
                Boolean Logic
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(doc.boolean).map(([op, desc]) => (
                  <div key={op} className="bg-gray-800 rounded p-3 border border-gray-700">
                    <code className="text-amber-300 font-bold">{op}</code>
                    <p className="text-sm text-gray-300 mt-1">{desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-amber-400 mb-3 border-b border-gray-800 pb-2">
                Sorting
              </h2>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <p className="text-sm text-gray-300 mb-2">
                  <span className="text-gray-500">Sort fields:</span>{" "}
                  {doc.sort.values.map((v) => (
                    <code key={v} className="bg-gray-700 px-1 rounded text-amber-300 mr-1">{v}</code>
                  ))}
                </p>
                <p className="text-sm text-gray-300 mb-2">
                  <span className="text-gray-500">Direction:</span>{" "}
                  {doc.sort.direction_values.map((v) => (
                    <code key={v} className="bg-gray-700 px-1 rounded text-amber-300 mr-1">{v}</code>
                  ))}
                </p>
                <p className="text-sm text-gray-400">{doc.sort.notes}</p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-amber-400 mb-3 border-b border-gray-800 pb-2">
                Example Queries
              </h2>
              <div className="space-y-2">
                {doc.examples.map((ex) => (
                  <div key={ex.q} className="flex items-start gap-4 bg-gray-800/50 rounded p-3">
                    <code className="text-green-400 text-sm shrink-0 min-w-0">{ex.q}</code>
                    <span className="text-gray-400 text-sm">{ex.description}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-800 px-4 py-3 text-center text-xs text-gray-600 mt-8">
        Card data: MTGJSON &bull; Images and prices: Scryfall (CC BY 4.0)
      </footer>
    </div>
  );
}
