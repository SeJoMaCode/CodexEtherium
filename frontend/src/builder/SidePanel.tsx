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
