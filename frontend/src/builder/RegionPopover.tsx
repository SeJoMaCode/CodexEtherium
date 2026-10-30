import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { bottomInset } from "./keyboardInset";

interface Props {
  anchor: HTMLElement;
  title: string;
  badge: "front face" | "back face" | "whole card";
  description?: string;
  onClose: () => void;
  children: ReactNode;
}

const MOBILE = 960;

type Placement =
  | { kind: "beside"; left: number; top: number }
  /** Bottom sheet, lifted above the on-screen keyboard and capped to the visible height. */
  | { kind: "sheet"; bottom: number; maxHeight: number };

/** Fixed-position popover to the right of the card (bottom sheet on small screens). */
export default function RegionPopover({ anchor, title, badge, description, onClose, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Placement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const place = () => {
      if (window.innerWidth < MOBILE) {
        const vv = window.visualViewport;
        setPos({
          kind: "sheet",
          bottom: vv ? bottomInset(window.innerHeight, vv.height, vv.offsetTop) : 0,
          maxHeight: Math.round((vv?.height ?? window.innerHeight) * 0.75),
        });
        return;
      }
      const card = anchor.closest(".cb-scene")?.getBoundingClientRect() ?? anchor.getBoundingClientRect();
      const r = anchor.getBoundingClientRect();
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      let left = card.right + 24;
      let top = r.top - 10;
      if (left + w > window.innerWidth - 12) {
        left = Math.max(12, Math.min(window.innerWidth - w - 12, r.left + r.width / 2 - w / 2));
        top = r.bottom + 10;
      }
      top = Math.max(12, Math.min(top, window.innerHeight - h - 12));
      setPos({ kind: "beside", left, top });
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, { passive: true });
    // The keyboard opening/closing only changes the visual viewport.
    const vv = window.visualViewport;
    vv?.addEventListener("resize", place);
    vv?.addEventListener("scroll", place);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place);
      vv?.removeEventListener("resize", place);
      vv?.removeEventListener("scroll", place);
    };
  }, [anchor]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        anchor.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element;
      if (ref.current?.contains(t) || t.closest?.(".cb-region")) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [anchor, onClose]);

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>(".cb-pop-body input, .cb-pop-body select, .cb-pop-body button")?.focus({ preventScroll: true });
  }, [anchor]);

  const closeAndRestore = () => { onClose(); anchor.focus(); };

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label={title}
      className="cb-pop"
      style={
        pos?.kind === "beside" ? { left: pos.left, top: pos.top }
        : pos?.kind === "sheet" ? { bottom: pos.bottom, maxHeight: pos.maxHeight }
        : undefined
      }
    >
      <button type="button" className="cb-pop-close" aria-label="Close" onClick={closeAndRestore}>×</button>
      <h3 className="cb-pop-title">
        {title}
        <span className={`cb-badge${badge === "back face" ? " is-back" : ""}`}>{badge}</span>
      </h3>
      {description && <p className="cb-pop-desc">{description}</p>}
      <div className="cb-pop-body">{children}</div>
      <button type="button" className="cb-pop-done" onClick={closeAndRestore}>Done</button>
    </div>,
    document.body,
  );
}
