import { Fragment } from "react";
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
              segments.map((s, i) => (
                <Fragment key={i}>
                  {i > 0 && " "}
                  {s.kind === "back" ? (
                    <button type="button" className="cb-tk is-back" title="Turn the card over" onClick={onBackClick}>{s.text}</button>
                  ) : (
                    <span className={`cb-tk is-${s.kind}`}>{s.text}</span>
                  )}
                </Fragment>
              ))
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
