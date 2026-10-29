export type Op = "=" | "<" | "<=" | ">" | ">=";
export const OPS: Op[] = ["=", "<", "<=", ">", ">="];

export type Color = "W" | "U" | "B" | "R" | "G";
export type ColorMode = "including" | "exactly" | "atmost";
export type Rarity = "common" | "uncommon" | "rare" | "mythic";
export type Side = "front" | "back";
export type BuilderSort = "name" | "mv" | "edhrec" | "usd" | "usd_foil" | "tix" | "jank";
export type FaceChipField = "types" | "keywords" | "phrases" | "otags";

export type Region = "name" | "mana" | "art" | "type" | "set" | "text" | "flavor" | "pt";
/** Regions that describe the whole card; read-only on the back face. */
export const LOCKED_ON_BACK: Region[] = ["art", "set"];

export interface FaceState {
  name: string;
  nameNeg: boolean;
  colors: Color[];
  colorMode: ColorMode;
  colorTarget: "c" | "id";
  mvOp: Op;
  mv: string;
  types: string[];
  typesNeg: boolean;
  keywords: string[];
  phrases: string[];
  otags: string[];
  otagAny: boolean;
  textNeg: boolean;
  flavor: string;
  powOp: Op;
  pow: string;
  touOp: Op;
  tou: string;
}

export interface FormatRule {
  name: string;
  legal: boolean;
}

export interface CardLevelState {
  atags: string[];
  atagAny: boolean;
  artist: string;
  set: string;
  rarities: Rarity[];
  formats: FormatRule[];
  flags: string[];
  edhOp: Op;
  edh: string;
  jankOp: Op;
  jank: string;
  sort: BuilderSort;
  order: "asc" | "desc";
}

export interface BuilderState {
  front: FaceState;
  back: FaceState;
  backNeg: boolean;
  card: CardLevelState;
}

export function blankFace(): FaceState {
  return {
    name: "", nameNeg: false,
    colors: [], colorMode: "including", colorTarget: "c",
    mvOp: "=", mv: "",
    types: [], typesNeg: false,
    keywords: [], phrases: [], otags: [], otagAny: false, textNeg: false,
    flavor: "",
    powOp: ">=", pow: "", touOp: ">=", tou: "",
  };
}

export function blankCard(): CardLevelState {
  return {
    atags: [], atagAny: false, artist: "",
    set: "", rarities: [],
    formats: [], flags: [],
    edhOp: "<=", edh: "", jankOp: ">=", jank: "",
    sort: "name", order: "asc",
  };
}

export function blankState(): BuilderState {
  return { front: blankFace(), back: blankFace(), backNeg: false, card: blankCard() };
}
