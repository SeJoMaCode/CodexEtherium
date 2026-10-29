import { describe, expect, it } from "vitest";
import { buildQuery, buildSegments, quote } from "./query";
import { blankState, type BuilderState, type CardLevelState, type FaceState } from "./types";

function make(
  front: Partial<FaceState> = {},
  card: Partial<CardLevelState> = {},
  back: Partial<FaceState> = {},
  backNeg = false,
): BuilderState {
  const s = blankState();
  return { front: { ...s.front, ...front }, back: { ...s.back, ...back }, card: { ...s.card, ...card }, backNeg };
}

describe("quote", () => {
  it("leaves simple values bare", () => expect(quote("bolt")).toBe("bolt"));
  it("quotes values with spaces or syntax characters", () => {
    expect(quote("sol ring")).toBe('"sol ring"');
    expect(quote("t:x")).toBe('"t:x"');
  });
  it("strips embedded double quotes", () => expect(quote('say "hi"')).toBe('"say hi"'));
});

describe("buildQuery: front face", () => {
  it("is empty for a blank card", () => expect(buildQuery(blankState())).toBe(""));

  it("quotes multi-word names and negates", () => {
    expect(buildQuery(make({ name: "sol ring" }))).toBe('"sol ring"');
    expect(buildQuery(make({ name: "bolt", nameNeg: true }))).toBe("-bolt");
  });

  it("writes colors with the chosen mode and target", () => {
    expect(buildQuery(make({ colors: ["U", "G"] }))).toBe("c>=ug");
    expect(buildQuery(make({ colors: ["U", "G"], colorMode: "exactly" }))).toBe("c=ug");
    expect(buildQuery(make({ colors: ["U", "G"], colorMode: "atmost", colorTarget: "id" }))).toBe("id<=ug");
  });

  it("adds mana value only when set", () => {
    expect(buildQuery(make({ mv: " " }))).toBe("");
    expect(buildQuery(make({ mv: "3", mvOp: "<=" }))).toBe("mv<=3");
  });

  it("writes types, negated when asked", () => {
    expect(buildQuery(make({ types: ["creature", "elf"] }))).toBe("t:creature t:elf");
    expect(buildQuery(make({ types: ["creature"], typesNeg: true }))).toBe("-t:creature");
  });

  it("writes text box criteria", () => {
    expect(buildQuery(make({ keywords: ["flying"], phrases: ["draw a card"], otags: ["ramp", "draw"] })))
      .toBe('keyword:flying o:"draw a card" otag:ramp otag:draw');
    expect(buildQuery(make({ otags: ["ramp", "draw"], otagAny: true }))).toBe("(otag:ramp OR otag:draw)");
    expect(buildQuery(make({ otags: ["ramp"], otagAny: true }))).toBe("otag:ramp");
    expect(buildQuery(make({ keywords: ["first strike"] }))).toBe('keyword:"first strike"');
  });

  it("negates every text box criterion when textNeg is set", () => {
    expect(buildQuery(make({ keywords: ["flying"], phrases: ["draw"], otags: ["ramp", "draw"], otagAny: true, textNeg: true })))
      .toBe('-keyword:flying -o:"draw" -(otag:ramp OR otag:draw)');
  });

  it("writes flavor and power/toughness", () => {
    expect(buildQuery(make({ flavor: "urza", pow: "4", powOp: ">=", tou: "2", touOp: "<=" })))
      .toBe('ft:"urza" pow>=4 tou<=2');
  });
});

describe("buildQuery: whole card", () => {
  it("writes art, set, rarity, formats, flags and ranks", () => {
    expect(buildQuery(make({}, {
      atags: ["dragon"], artist: "rebecca guay", set: "MH3", rarities: ["rare", "mythic"],
      formats: [{ name: "commander", legal: true }, { name: "modern", legal: false }],
      flags: ["reserved"], edh: "1000", edhOp: "<=", jank: "7", jankOp: ">=",
    }))).toBe('atag:dragon artist:"rebecca guay" s:mh3 (r:rare OR r:mythic) f:commander -f:modern is:reserved edhrank<=1000 jank>=7');
  });

  it("groups illustration tags with OR when atagAny", () => {
    expect(buildQuery(make({}, { atags: ["dragon", "moon"], atagAny: true }))).toBe("(atag:dragon OR atag:moon)");
  });

  it("uses a single rarity without parentheses", () => {
    expect(buildQuery(make({}, { rarities: ["rare"] }))).toBe("r:rare");
  });

  it("adds sort/order only when not the default", () => {
    expect(buildQuery(make({}, { sort: "usd", order: "desc" }))).toBe("sort:usd order:desc");
    expect(buildQuery(make({}, { sort: "name", order: "asc" }))).toBe("");
  });
});

describe("buildQuery: back face", () => {
  it("wraps back criteria in back:()", () => {
    expect(buildQuery(make({ types: ["enchantment"] }, {}, { types: ["creature"], pow: "5", powOp: ">=" })))
      .toBe("t:enchantment back:(t:creature pow>=5)");
  });

  it("negates the whole back group", () => {
    expect(buildQuery(make({}, {}, { types: ["creature"] }, true))).toBe("-back:(t:creature)");
  });

  it("ignores mana value and commander identity on the back", () => {
    expect(buildQuery(make({}, {}, { mv: "3", colors: ["G"], colorTarget: "id" }))).toBe("back:(c>=g)");
  });

  it("omits back:() when the back is blank, even if negated", () => {
    expect(buildQuery(make({}, {}, {}, true))).toBe("");
  });
});

describe("buildSegments", () => {
  it("labels each token with its scope, in order", () => {
    expect(buildSegments(make({ types: ["creature"] }, { rarities: ["rare"], sort: "usd" }, { types: ["land"] }))).toEqual([
      { text: "t:creature", kind: "front" },
      { text: "r:rare", kind: "card" },
      { text: "back:(t:land)", kind: "back" },
      { text: "sort:usd", kind: "meta" },
    ]);
  });
});
