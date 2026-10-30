/**
 * How many pixels of the layout viewport's bottom are hidden behind browser UI —
 * on phones, the on-screen keyboard. Mobile browsers shrink only the *visual*
 * viewport when the keyboard opens, so `position: fixed; bottom: 0` ends up under it.
 */
export function bottomInset(layoutHeight: number, visualHeight: number, visualOffsetTop: number): number {
  return Math.max(0, Math.round(layoutHeight - visualHeight - visualOffsetTop));
}
