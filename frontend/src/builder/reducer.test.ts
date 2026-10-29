import { describe, expect, it } from "vitest";
import { builderReducer } from "./reducer";
import { blankState } from "./types";

describe("builderReducer", () => {
  it("toggles colors keeping WUBRG order", () => {
    let s = builderReducer(blankState(), { type: "toggleColor", side: "front", color: "G" });
    s = builderReducer(s, { type: "toggleColor", side: "front", color: "W" });
    expect(s.front.colors).toEqual(["W", "G"]);
    s = builderReducer(s, { type: "toggleColor", side: "front", color: "W" });
    expect(s.front.colors).toEqual(["G"]);
  });

  it("only touches the requested face", () => {
    const s = builderReducer(blankState(), { type: "setFace", side: "back", patch: { name: "x" } });
    expect(s.back.name).toBe("x");
    expect(s.front.name).toBe("");
  });

  it("normalizes, dedupes and ignores empty chips", () => {
    let s = builderReducer(blankState(), { type: "addChip", side: "front", field: "types", value: "  Creature " });
    s = builderReducer(s, { type: "addChip", side: "front", field: "types", value: "creature" });
    expect(s.front.types).toEqual(["creature"]);
    s = builderReducer(s, { type: "addChip", side: "front", field: "phrases", value: "Draw  a Card" });
    expect(s.front.phrases).toEqual(["Draw a Card"]);
    expect(builderReducer(s, { type: "addChip", side: "front", field: "otags", value: "   " })).toBe(s);
  });

  it("removes chips by index", () => {
    let s = builderReducer(blankState(), { type: "addChip", side: "back", field: "otags", value: "ramp" });
    s = builderReducer(s, { type: "addChip", side: "back", field: "otags", value: "draw" });
    s = builderReducer(s, { type: "removeChip", side: "back", field: "otags", index: 0 });
    expect(s.back.otags).toEqual(["draw"]);
  });

  it("manages art tags", () => {
    let s = builderReducer(blankState(), { type: "addArtTag", value: " Dragon" });
    s = builderReducer(s, { type: "addArtTag", value: "dragon" });
    expect(s.card.atags).toEqual(["dragon"]);
    s = builderReducer(s, { type: "removeArtTag", index: 0 });
    expect(s.card.atags).toEqual([]);
  });

  it("toggles rarities in rarity order and flags in click order", () => {
    let s = builderReducer(blankState(), { type: "toggleRarity", rarity: "mythic" });
    s = builderReducer(s, { type: "toggleRarity", rarity: "common" });
    expect(s.card.rarities).toEqual(["common", "mythic"]);
    s = builderReducer(s, { type: "toggleFlag", flag: "promo" });
    s = builderReducer(s, { type: "toggleFlag", flag: "reserved" });
    expect(s.card.flags).toEqual(["promo", "reserved"]);
    s = builderReducer(s, { type: "toggleFlag", flag: "promo" });
    expect(s.card.flags).toEqual(["reserved"]);
  });

  it("adds, updates and removes format rules", () => {
    let s = builderReducer(blankState(), { type: "addFormat" });
    expect(s.card.formats).toEqual([{ name: "commander", legal: true }]);
    s = builderReducer(s, { type: "updateFormat", index: 0, patch: { name: "modern", legal: false } });
    expect(s.card.formats).toEqual([{ name: "modern", legal: false }]);
    s = builderReducer(s, { type: "removeFormat", index: 0 });
    expect(s.card.formats).toEqual([]);
  });

  it("sets card fields, backNeg, and resets", () => {
    let s = builderReducer(blankState(), { type: "setCard", patch: { artist: "guay", sort: "usd" } });
    s = builderReducer(s, { type: "setBackNeg", value: true });
    expect(s.card.artist).toBe("guay");
    expect(s.card.sort).toBe("usd");
    expect(s.backNeg).toBe(true);
    expect(builderReducer(s, { type: "reset" })).toEqual(blankState());
  });
});
