import { useCallback, useMemo, useReducer, useState } from "react";
import { useNavigate } from "react-router-dom";
import QueryPreview from "../builder/QueryPreview";
import SidePanel from "../builder/SidePanel";
import SearchHeader from "../components/SearchHeader";
import BuilderCard from "../builder/BuilderCard";
import { ACCENT, colorKey } from "../builder/constants";
import { NegToggle } from "../builder/controls";
import { buildSegments, segmentsToQuery } from "../builder/query";
import { builderReducer, type BuilderAction } from "../builder/reducer";
import { blankState, type Region, type Side } from "../builder/types";
import RegionPopover from "../builder/RegionPopover";
import RegionEditor, { editorMeta } from "../builder/RegionEditor";
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

  const closePopover = useCallback(() => setOpen(null), []);
  const search = () => {
    const q = query.trim();
    if (q) navigate(`/?q=${encodeURIComponent(q)}`);
  };

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
            <h1 className="font-display font-semibold text-4xl leading-[1.1]">Build a card</h1>
            <div className="w-10 h-[3px] rounded-full mt-3 mb-3 transition-colors" style={{ backgroundColor: accent }} />
            <p className="text-neutral-700 leading-relaxed max-w-xl">
              Fill in the parts of the card you care about. Anything you leave blank matches every card. Turn the card
              over to search the back of double-faced cards.
            </p>
          </div>
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
        </section>
      </main>

      {open && (
        <RegionPopover anchor={open.anchor} {...editorMeta(open.region, side)} onClose={closePopover}>
          <RegionEditor region={open.region} side={side} state={state} dispatch={update} onFlip={flip} />
        </RegionPopover>
      )}
      <footer className="border-t border-neutral-200 mt-6">
        <p className="max-w-6xl mx-auto px-6 lg:px-10 py-6 font-body text-xs text-neutral-400">
          Card data: MTGJSON &bull; Images and prices: Scryfall (CC BY 4.0)
        </p>
      </footer>
    </div>
  );
}
