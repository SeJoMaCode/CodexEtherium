import { COLORS, RARITIES } from "./constants";
import {
  blankState,
  type BuilderState, type CardLevelState, type Color, type FaceChipField,
  type FaceState, type FormatRule, type Rarity, type Side,
} from "./types";

export type BuilderAction =
  | { type: "setFace"; side: Side; patch: Partial<FaceState> }
  | { type: "toggleColor"; side: Side; color: Color }
  | { type: "addChip"; side: Side; field: FaceChipField; value: string }
  | { type: "removeChip"; side: Side; field: FaceChipField; index: number }
  | { type: "setCard"; patch: Partial<CardLevelState> }
  | { type: "addArtTag"; value: string }
  | { type: "removeArtTag"; index: number }
  | { type: "toggleRarity"; rarity: Rarity }
  | { type: "toggleFlag"; flag: string }
  | { type: "addFormat" }
  | { type: "updateFormat"; index: number; patch: Partial<FormatRule> }
  | { type: "removeFormat"; index: number }
  | { type: "setBackNeg"; value: boolean }
  | { type: "reset" };

function withFace(state: BuilderState, side: Side, face: FaceState): BuilderState {
  return side === "front" ? { ...state, front: face } : { ...state, back: face };
}

function withCard(state: BuilderState, patch: Partial<CardLevelState>): BuilderState {
  return { ...state, card: { ...state.card, ...patch } };
}

/** Collapse whitespace; lowercase everything except free-text phrases. */
function normalize(value: string, keepCase: boolean): string {
  const v = value.trim().replace(/\s+/g, " ");
  return keepCase ? v : v.toLowerCase();
}

function toggleOrdered<T>(order: T[], current: T[], item: T): T[] {
  const has = current.includes(item);
  return order.filter((x) => (x === item ? !has : current.includes(x)));
}

export function builderReducer(state: BuilderState, action: BuilderAction): BuilderState {
  switch (action.type) {
    case "setFace":
      return withFace(state, action.side, { ...state[action.side], ...action.patch });

    case "toggleColor": {
      const face = state[action.side];
      return withFace(state, action.side, { ...face, colors: toggleOrdered(COLORS, face.colors, action.color) });
    }

    case "addChip": {
      const face = state[action.side];
      const value = normalize(action.value, action.field === "phrases");
      if (!value || face[action.field].includes(value)) return state;
      const next = { ...face };
      next[action.field] = [...face[action.field], value];
      return withFace(state, action.side, next);
    }

    case "removeChip": {
      const face = state[action.side];
      const next = { ...face };
      next[action.field] = face[action.field].filter((_, i) => i !== action.index);
      return withFace(state, action.side, next);
    }

    case "setCard":
      return withCard(state, action.patch);

    case "addArtTag": {
      const value = normalize(action.value, false);
      if (!value || state.card.atags.includes(value)) return state;
      return withCard(state, { atags: [...state.card.atags, value] });
    }

    case "removeArtTag":
      return withCard(state, { atags: state.card.atags.filter((_, i) => i !== action.index) });

    case "toggleRarity":
      return withCard(state, { rarities: toggleOrdered(RARITIES, state.card.rarities, action.rarity) });

    case "toggleFlag": {
      const flags = state.card.flags;
      return withCard(state, {
        flags: flags.includes(action.flag) ? flags.filter((f) => f !== action.flag) : [...flags, action.flag],
      });
    }

    case "addFormat":
      return withCard(state, { formats: [...state.card.formats, { name: "commander", legal: true }] });

    case "updateFormat":
      return withCard(state, {
        formats: state.card.formats.map((f, i) => (i === action.index ? { ...f, ...action.patch } : f)),
      });

    case "removeFormat":
      return withCard(state, { formats: state.card.formats.filter((_, i) => i !== action.index) });

    case "setBackNeg":
      return { ...state, backNeg: action.value };

    case "reset":
      return blankState();
  }
}
