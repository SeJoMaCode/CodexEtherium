import type { BuilderSort, Color, ColorMode, Op, Rarity } from "./types";

export const COLORS: Color[] = ["W", "U", "B", "R", "G"];
export const COLOR_NAME: Record<Color, string> = { W: "White", U: "Blue", B: "Black", R: "Red", G: "Green" };

export type ColorKey = Color | "none" | "multi";
export function colorKey(colors: Color[]): ColorKey {
  if (colors.length === 0) return "none";
  if (colors.length > 1) return "multi";
  return colors[0];
}

/** Same accents as CardPage.tsx. */
export const ACCENT: Record<ColorKey, string> = {
  none: "#5B6472", multi: "#B8860B",
  W: "#B8860B", U: "#1D5C9E", B: "#4A3164", R: "#C1432F", G: "#2F7A54",
};

/** [light, deep] frame gradient stops. */
export const FRAME_TINT: Record<ColorKey, [string, string]> = {
  none: ["#d3d6da", "#a3a8ae"],
  W: ["#f3ecd7", "#d8cba3"],
  U: ["#cfe1f1", "#8fb5d6"],
  B: ["#cdc6d1", "#8e8396"],
  R: ["#f3d2c6", "#d99a84"],
  G: ["#cfe5d7", "#8fbea0"],
  multi: ["#efdfa3", "#cfb05c"],
};

export const ART_GLOW: Record<ColorKey, string> = {
  none: "rgba(91,100,114,.35)", W: "rgba(184,134,11,.35)", U: "rgba(29,92,158,.35)",
  B: "rgba(74,49,100,.4)", R: "rgba(193,67,47,.35)", G: "rgba(47,122,84,.35)", multi: "rgba(184,134,11,.45)",
};

export function indicatorGradient(colors: Color[]): string {
  const n = colors.length;
  const stops = colors.map((c, i) => `${ACCENT[c]} ${(i / n) * 360}deg ${((i + 1) / n) * 360}deg`);
  return `conic-gradient(${stops.join(", ")})`;
}

export const RARITIES: Rarity[] = ["common", "uncommon", "rare", "mythic"];
export const RARITY_COLOR: Record<Rarity, string> = {
  common: "#1a1a1a", uncommon: "#9aa4ad", rare: "#c9a227", mythic: "#d4572a",
};

export const FORMATS = [
  "standard", "pioneer", "modern", "legacy", "vintage",
  "commander", "oathbreaker", "pauper", "brawl",
  "historic", "alchemy", "explorer", "timeless",
];
export const FLAGS = ["reserved", "promo", "reprint", "fullart", "colorless", "multicolor"];
export const SORT_FIELDS: BuilderSort[] = ["name", "mv", "edhrec", "usd", "usd_foil", "tix", "jank"];

export const TYPE_SUGGESTIONS = [
  "creature", "instant", "sorcery", "artifact", "enchantment", "land", "planeswalker", "battle",
  "legendary", "basic", "snow", "equipment", "aura", "vehicle", "saga",
  "elf", "dragon", "zombie", "goblin", "human", "angel", "wizard",
];
export const KEYWORD_SUGGESTIONS = [
  "flying", "trample", "deathtouch", "lifelink", "haste", "vigilance", "flash",
  "ward", "menace", "hexproof", "first strike", "double strike", "reach", "indestructible",
];

export const OP_GLYPH: Record<Op, string> = { "=": "", "<": "<", "<=": "≤", ">": ">", ">=": "≥" };
export const MODE_GLYPH: Record<ColorMode, string> = { including: "≥", exactly: "=", atmost: "≤" };
