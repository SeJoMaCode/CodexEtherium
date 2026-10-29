import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface Props {
  anchor: HTMLElement;
  title: string;
  badge: "front face" | "back face" | "whole card";
  description?: string;
  onClose: () => void;
  children: ReactNode;
}

const MOBILE = 960;

/** Fixed-position popover to the right of the card (bottom sheet on small screens). */
export default function RegionPopover({ anchor, title, badge, description, onClose, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const place = () => {
      if (window.innerWidth < MOBILE) {
        setPos(null);
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
      setPos({ left, top });
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place);
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

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label={title}
      className="cb-pop"
      style={pos ? { left: pos.left, top: pos.top } : undefined}
    >
      <button type="button" className="cb-pop-close" aria-label="Close" onClick={onClose}>×</button>
      <h3 className="cb-pop-title">
        {title}
        <span className={`cb-badge${badge === "back face" ? " is-back" : ""}`}>{badge}</span>
      </h3>
      {description && <p className="cb-pop-desc">{description}</p>}
      <div className="cb-pop-body">{children}</div>
      <button type="button" className="cb-pop-done" onClick={onClose}>Done</button>
    </div>,
    document.body,
  );
}
