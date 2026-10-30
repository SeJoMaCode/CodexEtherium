import { describe, expect, it } from "vitest";
import { bottomInset } from "./keyboardInset";

describe("bottomInset", () => {
  it("is 0 when nothing covers the page", () => {
    expect(bottomInset(800, 800, 0)).toBe(0);
  });

  it("is the keyboard height when the visual viewport shrinks", () => {
    expect(bottomInset(800, 460, 0)).toBe(340);
  });

  it("accounts for the visual viewport being scrolled down (iOS)", () => {
    expect(bottomInset(800, 460, 120)).toBe(220);
  });

  it("never goes negative and rounds to whole pixels", () => {
    expect(bottomInset(800, 820, 0)).toBe(0);
    expect(bottomInset(800, 459.6, 0)).toBe(340);
  });
});
