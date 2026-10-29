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
