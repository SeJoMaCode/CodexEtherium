import { Link } from "react-router-dom";
import type { PrintingSummary } from "../types";

interface Props {
  printings: PrintingSummary[];
  currentUuid: string;
  accent: string;
}

const RARITY_COLOR: Record<string, string> = {
  common: "#9CA3AF",
  uncommon: "#7C93A8",
  rare: "#C9A227",
  mythic: "#C1432F",
};

function rarityColor(rarity: string | null): string {
  return (rarity && RARITY_COLOR[rarity.toLowerCase()]) || "#9CA3AF";
}

function formatPrice(usd: number | null, foil: number | null): string | null {
  if (usd != null) return `$${usd.toFixed(2)}`;
  if (foil != null) return `$${foil.toFixed(2)}f`;
  return null;
}

export default function PrintingsPanel({ printings, currentUuid, accent }: Props) {
  if (printings.length <= 1) return null;

  return (
    <div className="rounded-2xl bg-neutral-50 border border-neutral-200/70 p-5">
      <p className="flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500 mb-3">
        <span className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: accent }} />
        Printings ({printings.length})
      </p>

      <div className="space-y-0.5 max-h-72 overflow-y-auto pr-1">
        {printings.map((p) => {
          const price = formatPrice(p.prices?.usd ?? null, p.prices?.usd_foil ?? null);
          const isCurrent = p.uuid === currentUuid;

          const row = (
            <div
              className={`flex items-center gap-2 py-1.5 px-2 text-sm rounded-lg transition-colors ${
                isCurrent ? "bg-white ring-1 ring-neutral-300" : "hover:bg-white"
              }`}
            >
              <span
                className="shrink-0 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: rarityColor(p.rarity) }}
                title={p.rarity ?? undefined}
              />
              <span className="min-w-0 flex-1 truncate text-neutral-900">
                {p.set_name ?? p.set_code}
                {p.set_code && (
                  <span className="ml-1.5 text-neutral-400 text-xs uppercase">{p.set_code} #{p.number}</span>
                )}
              </span>
              {p.is_canonical && (
                <span className="shrink-0 text-amber-500 text-xs" title="Default printing">★</span>
              )}
              <span className="shrink-0 text-neutral-700 font-medium tabular-nums">{price ?? "—"}</span>
            </div>
          );

          return isCurrent ? (
            <div key={p.uuid}>{row}</div>
          ) : (
            <Link key={p.uuid} to={`/card/${p.uuid}`}>
              {row}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
