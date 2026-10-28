import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { SyntaxDoc, SyntaxKeyword } from "../types";
import SearchHeader from "../components/SearchHeader";

const ACCENT = "#5B6472";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500 mb-4">
      <span className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: ACCENT }} />
      {children}
    </p>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-neutral-50 border border-neutral-200/70 p-5">
      {children}
    </div>
  );
}

function CodeChip({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-xs bg-white border border-neutral-200 rounded-md px-2 py-1 text-neutral-700">
      {children}
    </code>
  );
}

function KeywordCard({ kw }: { kw: SyntaxKeyword }) {
  return (
    <div className="rounded-2xl bg-neutral-50 border border-neutral-200/70 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-2">
        <code className="font-mono text-[15px] font-semibold text-neutral-900">{kw.keyword}</code>
        {kw.aliases.length > 0 && (
          <span className="text-xs text-neutral-400">
            aka{" "}
            {kw.aliases.map((a, i) => (
              <span key={a}>
                <code className="font-mono text-neutral-500">{a}</code>
                {i < kw.aliases.length - 1 && ", "}
              </span>
            ))}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm mb-2.5">
        <span className="text-neutral-500">{kw.field}</span>
        <div className="flex flex-wrap gap-1">
          {kw.operators.map((op) => (
            <code key={op} className="font-mono text-xs bg-white border border-neutral-200 rounded px-1.5 py-0.5 text-neutral-700">
              {op}
            </code>
          ))}
        </div>
      </div>

      <p className="text-sm text-neutral-600 leading-relaxed mb-3">{kw.notes}</p>

      {kw.flags && (
        <div className="mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 mb-1.5">Flags</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
            {Object.entries(kw.flags).map(([flag, desc]) => (
              <div key={flag} className="text-sm">
                <code className="font-mono text-xs text-neutral-700">{flag}</code>
                <span className="text-neutral-500 ml-1.5">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {kw.examples.map((ex) => (
          <code key={ex} className="font-mono text-xs bg-white border border-neutral-200 rounded-md px-2 py-1 text-neutral-700">
            {ex}
          </code>
        ))}
      </div>
    </div>
  );
}

export default function SyntaxPage() {
  const navigate = useNavigate();
  const [doc, setDoc] = useState<SyntaxDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cards/search/syntax")
      .then((r) => r.json())
      .then(setDoc)
      .catch(() => setError("Failed to load syntax reference"));
  }, []);

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-body flex flex-col">
      <SearchHeader onSearch={(q) => navigate(`/?q=${encodeURIComponent(q)}`)} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 lg:px-10 pt-6 pb-16">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-6">
            {error}
          </p>
        )}

        {!doc && !error && (
          <p className="text-neutral-400 text-center py-20">Loading syntax reference…</p>
        )}

        {doc && (
          <div className="space-y-8">
            <p className="text-neutral-600 leading-relaxed">{doc.overview}</p>

            <section>
              <SectionTitle>Query Keywords</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doc.keywords.map((kw) => (
                  <KeywordCard key={kw.keyword} kw={kw} />
                ))}
              </div>
            </section>

            <section>
              <SectionTitle>Bare Words (Name Search)</SectionTitle>
              <Panel>
                <p className="text-sm text-neutral-600 mb-3">{doc.bare_words.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {doc.bare_words.examples.map((ex) => (
                    <CodeChip key={ex}>{ex}</CodeChip>
                  ))}
                </div>
              </Panel>
            </section>

            <section>
              <SectionTitle>Boolean Logic</SectionTitle>
              <Panel>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(doc.boolean).map(([op, desc]) => (
                    <div key={op} className="rounded-xl border border-neutral-200 bg-white p-3">
                      <code className="font-mono text-sm font-semibold text-neutral-900">{op}</code>
                      <p className="text-sm text-neutral-600 mt-1">{desc}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            </section>

            <section>
              <SectionTitle>Sorting</SectionTitle>
              <Panel>
                <div className="space-y-2.5 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-neutral-400">Sort fields</span>
                    {doc.sort.values.map((v) => (
                      <CodeChip key={v}>{v}</CodeChip>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-neutral-400">Direction</span>
                    {doc.sort.direction_values.map((v) => (
                      <CodeChip key={v}>{v}</CodeChip>
                    ))}
                  </div>
                  <p className="text-neutral-500 pt-1">{doc.sort.notes}</p>
                </div>
              </Panel>
            </section>

            <section>
              <SectionTitle>Example Queries</SectionTitle>
              <Panel>
                <div className="divide-y divide-neutral-200/70">
                  {doc.examples.map((ex) => (
                    <div key={ex.q} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-2.5">
                      <code className="font-mono text-xs bg-white border border-neutral-200 rounded-md px-2 py-1 text-neutral-700 shrink-0">
                        {ex.q}
                      </code>
                      <span className="text-sm text-neutral-500">{ex.description}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            </section>
          </div>
        )}
      </main>

      <footer className="border-t border-neutral-200 mt-6">
        <p className="max-w-5xl mx-auto px-6 lg:px-10 py-6 font-body text-xs text-neutral-400">
          Card data: MTGJSON &bull; Images and prices: Scryfall (CC BY 4.0)
        </p>
      </footer>
    </div>
  );
}
