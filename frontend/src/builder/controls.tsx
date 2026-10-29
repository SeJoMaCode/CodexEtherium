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
  const [picked, setPicked] = useState(true);
  const items = useSuggestions("set", picked ? "" : text);
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
          setPicked(false);
          onChange(SET_CODE.test(t.trim()) ? t.trim().toLowerCase() : "");
        }}
      />
      {items.length > 0 && (
        <div className="cb-suggest">
          {items.map((s) => (
            <button key={s.value} type="button" onClick={() => { setText(s.value); setPicked(true); onChange(s.value); }}>
              {s.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
