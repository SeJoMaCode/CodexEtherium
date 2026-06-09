import { useEffect } from "react";
import type { CardDetail, FaceSummary, Legalities } from "../types";

interface Props {
  card: CardDetail | null;
  loading: boolean;
  onClose: () => void;
}

const LEGAL_FORMATS: (keyof Legalities)[] = [
  "standard", "pioneer", "modern", "legacy", "vintage",
  "commander", "oathbreaker", "pauper", "brawl",
  "historic", "alchemy", "explorer", "timeless",
];

function LegalBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-gray-700 text-xs">—</span>;
  const colors: Record<string, string> = {
    legal: "text-green-400",
    restricted: "text-yellow-400",
    banned: "text-red-400",
    not_legal: "text-gray-600",
  };
  return (
    <span className={`text-xs capitalize ${colors[status] ?? "text-gray-400"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

interface FacePanelProps {
  name: string | null;
  mana_cost: string | null;
  type: string | null;
  text: string | null;
  flavor_text: string | null;
  power: string | null;
  toughness: string | null;
  image_uris: { normal: string | null } | null;
  label: string;
}

function FacePanel({ name, mana_cost, type, text, flavor_text, power, toughness, image_uris, label }: FacePanelProps) {
  return (
    <div className="flex flex-col gap-3 flex-1 min-w-0">
      <p className="text-xs text-gray-600 uppercase tracking-widest font-medium">{label}</p>
      {image_uris?.normal ? (
        <img
          src={image_uris.normal}
          alt={name ?? ""}
          className="w-full max-w-[220px] rounded-lg mx-auto"
        />
      ) : (
        <div className="w-full max-w-[220px] h-[308px] bg-gray-800 rounded-lg flex items-center justify-center text-gray-600 text-sm mx-auto">
          No image
        </div>
      )}
      <div>
        <p className="text-base font-semibold text-amber-400">{name}</p>
        {mana_cost && <p className="text-gray-400 text-xs mt-0.5">{mana_cost}</p>}
        {type && <p className="text-gray-300 text-sm mt-1">{type}</p>}
        {text && (
          <div className="mt-2 bg-gray-800 rounded p-2.5 text-sm text-gray-200 whitespace-pre-wrap border border-gray-700">
            {text}
          </div>
        )}
        {flavor_text && (
          <p className="mt-1.5 text-xs text-gray-500 italic">{flavor_text}</p>
        )}
        {power != null && toughness != null && (
          <p className="mt-2 text-sm">
            <span className="text-gray-500">P/T: </span>
            <span className="text-gray-200">{power}/{toughness}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default function CardDetailModal({ card, loading, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const isDfc = card ? card.faces.length > 0 : false;
  const frontName = card && isDfc
    ? card.name.split(" // ")[0].trim()
    : card?.name ?? null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`bg-gray-900 border border-gray-700 rounded-xl w-full ${isDfc ? "max-w-5xl" : "max-w-3xl"} my-8 relative`}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-200 text-xl leading-none z-10"
          aria-label="Close"
        >
          ✕
        </button>

        {loading && (
          <div className="flex items-center justify-center py-20 text-gray-500">
            Loading…
          </div>
        )}

        {card && (
          <div className="p-6">
            {/* ── Face(s) section ── */}
            {isDfc ? (
              /* Double-faced card: two face panels side by side */
              <div className="flex flex-col sm:flex-row gap-6">
                <FacePanel
                  name={frontName}
                  mana_cost={card.mana_cost}
                  type={card.type}
                  text={card.text}
                  flavor_text={card.flavor_text}
                  power={card.power}
                  toughness={card.toughness}
                  image_uris={card.image_uris}
                  label="Front"
                />
                {card.faces.map((face: FaceSummary) => (
                  <FacePanel
                    key={face.side}
                    name={face.name}
                    mana_cost={face.mana_cost}
                    type={face.type}
                    text={face.text}
                    flavor_text={face.flavor_text}
                    power={face.power}
                    toughness={face.toughness}
                    image_uris={face.image_uris}
                    label={face.side === "b" ? "Back" : `Face ${face.side.toUpperCase()}`}
                  />
                ))}
              </div>
            ) : (
              /* Single-faced card: original layout */
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="shrink-0">
                  {card.image_uris?.normal ? (
                    <img
                      src={card.image_uris.normal}
                      alt={card.name}
                      className="w-48 rounded-lg mx-auto sm:mx-0"
                    />
                  ) : (
                    <div className="w-48 h-64 bg-gray-800 rounded-lg flex items-center justify-center text-gray-600 text-sm mx-auto sm:mx-0">
                      No image
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-amber-400">{card.name}</h2>
                  {card.mana_cost && (
                    <p className="text-gray-400 text-sm mt-0.5">{card.mana_cost}</p>
                  )}
                  <p className="text-gray-300 text-sm mt-1">{card.type}</p>
                  {card.text && (
                    <div className="mt-3 bg-gray-800 rounded p-3 text-sm text-gray-200 whitespace-pre-wrap border border-gray-700">
                      {card.text}
                    </div>
                  )}
                  {card.flavor_text && (
                    <p className="mt-2 text-xs text-gray-500 italic">{card.flavor_text}</p>
                  )}
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    {card.power != null && card.toughness != null && (
                      <div>
                        <span className="text-gray-500">P/T: </span>
                        <span className="text-gray-200">{card.power}/{card.toughness}</span>
                      </div>
                    )}
                    {card.rarity && (
                      <div>
                        <span className="text-gray-500">Rarity: </span>
                        <span className="text-gray-200 capitalize">{card.rarity}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Shared metadata ── */}
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {card.rarity && isDfc && (
                <div>
                  <span className="text-gray-500">Rarity: </span>
                  <span className="text-gray-200 capitalize">{card.rarity}</span>
                </div>
              )}
              {card.set_code && (
                <div>
                  <span className="text-gray-500">Set: </span>
                  <span className="text-gray-200">{card.set_code.toUpperCase()} #{card.number}</span>
                </div>
              )}
              {card.artist && (
                <div>
                  <span className="text-gray-500">Artist: </span>
                  <span className="text-gray-200">{card.artist}</span>
                </div>
              )}
              {card.edhrec_rank != null && (
                <div>
                  <span className="text-gray-500">EDHREC: </span>
                  <span className="text-gray-200">#{card.edhrec_rank.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Prices */}
            {card.prices && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Prices</p>
                <div className="flex flex-wrap gap-3 text-sm">
                  {card.prices.usd != null && (
                    <span><span className="text-gray-500">USD </span><span className="text-green-400">${card.prices.usd.toFixed(2)}</span></span>
                  )}
                  {card.prices.usd_foil != null && (
                    <span><span className="text-gray-500">Foil </span><span className="text-green-400">${card.prices.usd_foil.toFixed(2)}</span></span>
                  )}
                  {card.prices.eur != null && (
                    <span><span className="text-gray-500">EUR </span><span className="text-green-400">€{card.prices.eur.toFixed(2)}</span></span>
                  )}
                  {card.prices.tix != null && (
                    <span><span className="text-gray-500">Tix </span><span className="text-blue-400">{card.prices.tix.toFixed(2)}</span></span>
                  )}
                </div>
              </div>
            )}

            {/* Legalities */}
            {card.legalities && (
              <div className="mt-5">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Legalities</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1">
                  {LEGAL_FORMATS.map((fmt) => (
                    <div key={fmt} className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 capitalize">{fmt}</span>
                      <LegalBadge status={card.legalities![fmt]} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords */}
            {card.keywords.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Keywords</p>
                <div className="flex flex-wrap gap-2">
                  {card.keywords.map((kw) => (
                    <span key={kw} className="bg-gray-800 border border-gray-700 text-amber-300 text-xs px-2 py-0.5 rounded">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Rulings */}
            {card.rulings && card.rulings.length > 0 && (
              <div className="mt-5">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Rulings</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {card.rulings.map((r, i) => (
                    <div key={i} className="text-sm bg-gray-800 rounded p-3 border border-gray-700">
                      <span className="text-gray-500 text-xs">{r.date} — </span>
                      <span className="text-gray-300">{r.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flags */}
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {card.is_reserved && <span className="bg-red-900/40 border border-red-800 text-red-300 px-2 py-0.5 rounded">Reserved List</span>}
              {card.is_promo && <span className="bg-purple-900/40 border border-purple-800 text-purple-300 px-2 py-0.5 rounded">Promo</span>}
              {card.is_full_art && <span className="bg-blue-900/40 border border-blue-800 text-blue-300 px-2 py-0.5 rounded">Full Art</span>}
              {card.is_reprint && <span className="bg-gray-800 border border-gray-700 text-gray-400 px-2 py-0.5 rounded">Reprint</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
