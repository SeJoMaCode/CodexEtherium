import { describe, expect, it } from "vitest";
import { applyDeckSuggestion, clampActive, findDeckToken, freshItems } from "./deckAutocomplete";

const atEnd = (value: string) => findDeckToken(value, value.length);

describe("findDeckToken", () => {
  it("ignores ordinary searches", () => {
    expect(atEnd("")).toBeNull();
    expect(atEnd("sol ring")).toBeNull();
    expect(atEnd("t:artifact")).toBeNull();
    expect(atEnd('o:"deck:necron')).toBeNull();
  });

  it("needs two characters", () => {
    expect(atEnd("deck:")).toBeNull();
    expect(atEnd("deck:n")).toBeNull();
    expect(atEnd('deck:"n')).toBeNull();
    expect(atEnd("deck:ne")).toMatchObject({ key: "deck:", term: "ne" });
  });

  it("accepts precon, negation and capitals", () => {
    expect(atEnd("precon:ne")).toMatchObject({ key: "precon:", term: "ne" });
    expect(atEnd("-deck:ne")).toMatchObject({ key: "-deck:", term: "ne" });
    expect(atEnd("DECK:ne")).toMatchObject({ key: "DECK:", term: "ne" });
  });

  it("finds a token after other tokens and parens", () => {
    expect(atEnd("t:artifact deck:ne")).toMatchObject({ start: 11, term: "ne" });
    expect(atEnd("(deck:ne")).toMatchObject({ start: 1, term: "ne" });
  });

  it("supports opened quotes with spaces", () => {
    expect(atEnd('deck:"iron all')).toMatchObject({ key: "deck:", term: "iron all" });
  });

  it("stops suggesting once a quote closes", () => {
    expect(atEnd('deck:"iron alliance"')).toBeNull();
  });

  it("doesn't suggest after | or &", () => {
    expect(atEnd("deck:necron|ur")).toBeNull();
    expect(atEnd("deck:necron&ur")).toBeNull();
  });

  it("uses the cursor, not the end of the input", () => {
    const value = "deck:necron t:artifact";
    expect(findDeckToken(value, 8)).toMatchObject({ start: 0, end: 11, term: "nec" });
    expect(findDeckToken(value, value.length)).toBeNull();
  });

  it("includes the rest of a quoted term in the replaced range", () => {
    expect(findDeckToken('deck:"iron alliance" x', 9)).toMatchObject({ start: 0, end: 20 });
  });
});

describe("applyDeckSuggestion", () => {
  it("replaces the term and adds a space at the end of the input", () => {
    const value = "t:artifact deck:ne";
    const result = applyDeckSuggestion(value, atEnd(value)!, "Necron Dynasties");
    expect(result.value).toBe('t:artifact deck:"Necron Dynasties" ');
    expect(result.cursor).toBe(result.value.length);
  });

  it("keeps the key the user typed", () => {
    const value = "-precon:ne";
    expect(applyDeckSuggestion(value, atEnd(value)!, "Necron Dynasties").value).toBe(
      '-precon:"Necron Dynasties" ',
    );
  });

  it("keeps text after the token", () => {
    const value = "deck:nec t:artifact";
    const result = applyDeckSuggestion(value, findDeckToken(value, 8)!, "Necron Dynasties");
    expect(result.value).toBe('deck:"Necron Dynasties" t:artifact');
    expect(result.cursor).toBe('deck:"Necron Dynasties"'.length);
  });

  it("sanitizes names containing parser syntax", () => {
    const value = "deck:fo";
    expect(applyDeckSuggestion(value, atEnd(value)!, "Foo & Bar").value).toBe('deck:"Foo Bar" ');
  });

  it("produces a value that stops suggesting", () => {
    const value = "deck:ne";
    const result = applyDeckSuggestion(value, atEnd(value)!, "Necron Dynasties");
    expect(findDeckToken(result.value, result.cursor)).toBeNull();
  });
});

describe("freshItems", () => {
  const none: string[] = [];
  const stored = { term: "wa", items: ["a", "b"] };

  it("returns rows only for the term they were fetched for", () => {
    expect(freshItems(stored, "wa", none)).toEqual(["a", "b"]);
    expect(freshItems(stored, "war", none)).toBe(none);
  });

  it("returns nothing without a term or a result", () => {
    expect(freshItems(stored, null, none)).toBe(none);
    expect(freshItems(null, "wa", none)).toBe(none);
  });
});

describe("clampActive", () => {
  it("keeps an index that is still in range", () => {
    expect(clampActive(2, 5)).toBe(2);
    expect(clampActive(-1, 5)).toBe(-1);
  });

  it("drops an index that a shorter list left out of range", () => {
    expect(clampActive(5, 3)).toBe(-1);
    expect(clampActive(0, 0)).toBe(-1);
  });
});
