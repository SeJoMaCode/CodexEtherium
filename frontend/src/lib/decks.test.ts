import { describe, expect, it } from "vitest";
import { deckSearchQuery, deckTermValue, formatDeckMatchLine } from "./decks";
import type { DeckSummary } from "../types";

function deck(name: string, list_available = true): DeckSummary {
  return {
    deck_id: name,
    name,
    set_code: "TST",
    set_name: null,
    release_date: null,
    commanders: [],
    list_available,
  };
}

describe("formatDeckMatchLine", () => {
  it("is empty without matches", () => {
    expect(formatDeckMatchLine([])).toEqual([]);
  });

  it("lists matched decks", () => {
    expect(
      formatDeckMatchLine([
        { term: "necron", decks: [deck("Necron Dynasties")] },
        { term: "urza", decks: [deck("Urza's Iron Alliance")] },
      ]),
    ).toEqual(["Necron Dynasties", "Urza's Iron Alliance"]);
  });

  it("shows three names, then a count", () => {
    expect(
      formatDeckMatchLine([{ term: "warhammer", decks: ["A", "B", "C", "D", "E"].map((n) => deck(n)) }]),
    ).toEqual(["A", "B", "C", "+2 more"]);
  });

  it("doesn't repeat a deck matched by two terms", () => {
    expect(
      formatDeckMatchLine([
        { term: "necron", decks: [deck("Necron Dynasties")] },
        { term: "szarekh", decks: [deck("Necron Dynasties")] },
      ]),
    ).toEqual(["Necron Dynasties"]);
  });

  it("explains a term with no match", () => {
    expect(formatDeckMatchLine([{ term: "xyz", decks: [] }])).toEqual(['No precon matches "xyz"']);
  });

  it("explains a single unpublished deck", () => {
    expect(formatDeckMatchLine([{ term: "borg", decks: [deck("We Are the Borg", false)] }])).toEqual([
      "borg: We Are the Borg's card list isn't published yet",
    ]);
  });

  it("explains several unpublished decks", () => {
    expect(
      formatDeckMatchLine([{ term: "trek", decks: ["A", "B", "C", "D"].map((n) => deck(n, false)) }]),
    ).toEqual(["trek: 4 decks aren't published yet"]);
  });

  it("doesn't count problems toward the three names", () => {
    expect(
      formatDeckMatchLine([
        { term: "a", decks: ["A", "B", "C"].map((n) => deck(n)) },
        { term: "borg", decks: [deck("We Are the Borg", false)] },
        { term: "xyz", decks: [] },
      ]),
    ).toEqual([
      "A",
      "B",
      "C",
      "borg: We Are the Borg's card list isn't published yet",
      'No precon matches "xyz"',
    ]);
  });

  it("ignores unpublished decks when a term also has published ones", () => {
    expect(formatDeckMatchLine([{ term: "x", decks: [deck("Out"), deck("Soon", false)] }])).toEqual(["Out"]);
  });
});

describe("deckTermValue", () => {
  it("leaves ordinary names alone", () => {
    expect(deckTermValue("Urza's Iron Alliance")).toBe("Urza's Iron Alliance");
  });

  it("removes characters the parser would treat as syntax", () => {
    expect(deckTermValue('Foo & Bar | "Baz"')).toBe("Foo Bar Baz");
  });
});

describe("deckSearchQuery", () => {
  it("builds a quoted deck: filter", () => {
    expect(deckSearchQuery("Necron Dynasties")).toBe('deck:"Necron Dynasties"');
  });
});
