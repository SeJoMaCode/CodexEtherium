import type { BuilderState, CardLevelState, FaceState } from "./types";

export type SegmentKind = "front" | "card" | "back" | "meta";
export interface Segment {
  text: string;
  kind: SegmentKind;
}

const COLOR_OP = { including: ">=", exactly: "=", atmost: "<=" } as const;

/** Quote a value if it contains whitespace or query syntax characters. */
export function quote(value: string): string {
  const v = value.replace(/"/g, "");
  return /[\s:()]/.test(v) ? `"${v}"` : v;
}

const tok = (key: string, value: string) => `${key}:${quote(value)}`;
const neg = (negated: boolean) => (negated ? "-" : "");
const phrase = (key: string, value: string) => `${key}:"${value.replace(/"/g, "")}"`;

function group(tokens: string[], any: boolean, negated: boolean): string[] {
  if (tokens.length === 0) return [];
  if (any && tokens.length > 1) return [`${neg(negated)}(${tokens.join(" OR ")})`];
  return tokens.map((t) => neg(negated) + t);
}

export function faceTokens(f: FaceState, isBack: boolean): string[] {
  const out: string[] = [];
  const name = f.name.trim();
  if (name) out.push(neg(f.nameNeg) + quote(name));
  if (f.colors.length > 0) {
    const key = isBack ? "c" : f.colorTarget;
    out.push(`${key}${COLOR_OP[f.colorMode]}${f.colors.join("").toLowerCase()}`);
  }
  if (!isBack && f.mv.trim() !== "") out.push(`mv${f.mvOp}${f.mv.trim()}`);
  out.push(...f.types.map((t) => neg(f.typesNeg) + tok("t", t)));
  out.push(...f.keywords.map((k) => neg(f.textNeg) + tok("keyword", k)));
  out.push(...f.phrases.map((p) => neg(f.textNeg) + phrase("o", p)));
  out.push(...group(f.otags.map((t) => tok("otag", t)), f.otagAny, f.textNeg));
  const flavor = f.flavor.trim();
  if (flavor) out.push(phrase("ft", flavor));
  if (f.pow.trim() !== "") out.push(`pow${f.powOp}${f.pow.trim()}`);
  if (f.tou.trim() !== "") out.push(`tou${f.touOp}${f.tou.trim()}`);
  return out;
}

export function cardTokens(c: CardLevelState): string[] {
  const out: string[] = [];
  out.push(...group(c.atags.map((t) => tok("atag", t)), c.atagAny, false));
  if (c.artist.trim()) out.push(tok("artist", c.artist.trim()));
  if (c.set.trim()) out.push(tok("s", c.set.trim().toLowerCase()));
  out.push(...group(c.rarities.map((r) => `r:${r}`), true, false));
  c.formats.forEach((f) => out.push(`${neg(!f.legal)}f:${f.name}`));
  c.flags.forEach((f) => out.push(`is:${f}`));
  if (c.edh.trim() !== "") out.push(`edhrank${c.edhOp}${c.edh.trim()}`);
  if (c.jank.trim() !== "") out.push(`jank${c.jankOp}${c.jank.trim()}`);
  return out;
}

export function buildSegments(s: BuilderState): Segment[] {
  const segs: Segment[] = [];
  faceTokens(s.front, false).forEach((text) => segs.push({ text, kind: "front" }));
  cardTokens(s.card).forEach((text) => segs.push({ text, kind: "card" }));
  const back = faceTokens(s.back, true);
  if (back.length > 0) segs.push({ text: `${neg(s.backNeg)}back:(${back.join(" ")})`, kind: "back" });
  if (s.card.sort !== "name") segs.push({ text: `sort:${s.card.sort}`, kind: "meta" });
  if (s.card.order !== "asc") segs.push({ text: `order:${s.card.order}`, kind: "meta" });
  return segs;
}

export function segmentsToQuery(segs: Segment[]): string {
  return segs.map((s) => s.text).join(" ");
}

export function buildQuery(s: BuilderState): string {
  return segmentsToQuery(buildSegments(s));
}
