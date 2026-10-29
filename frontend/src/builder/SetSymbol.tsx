import { useId } from "react";
import { RARITY_COLOR } from "./constants";
import type { Rarity } from "./types";

/** Generic set symbol (not a real set's); fill = selected rarities, split diagonally. */
export default function SetSymbol({ rarities, muted }: { rarities: Rarity[]; muted: boolean }) {
  const id = `cb-set-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const colors = rarities.length > 0 ? rarities.map((r) => RARITY_COLOR[r]) : ["rgba(0,0,0,.28)"];
  const n = colors.length;
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden style={{ opacity: muted ? 0.45 : 1 }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          {colors.flatMap((c, i) => [
            <stop key={`${i}a`} offset={`${(i / n) * 100}%`} stopColor={c} />,
            <stop key={`${i}b`} offset={`${((i + 1) / n) * 100}%`} stopColor={c} />,
          ])}
        </linearGradient>
      </defs>
      <path
        d="M12 1.5 21 6v6.5c0 5-3.9 8.6-9 10-5.1-1.4-9-5-9-10V6z"
        fill={`url(#${id})`}
        stroke="#111"
        strokeWidth={1.3}
        strokeDasharray={rarities.length > 0 ? undefined : "2.5 2"}
      />
      <path d="M12 6.5 16 12l-4 5.5L8 12z" fill="rgba(255,255,255,.55)" />
    </svg>
  );
}
