import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { CardDetail, DeckSummary, FaceSummary, Legalities, PrintingSummary } from "../types";
import SearchHeader from "../components/SearchHeader";
import PrintingsPanel from "../components/PrintingsPanel";
import PreconPanel from "../components/PreconPanel";
import ManaText from "../components/ManaText";
import { setCardDragData } from "../lib/cardDrag";

const LEGAL_FORMATS: (keyof Legalities)[] = [
  "standard", "pioneer", "modern", "legacy", "vintage",
  "commander", "oathbreaker", "pauper", "brawl",
  "historic", "alchemy", "explorer", "timeless",
];

const ACCENT_BY_COLOR: Record<string, string> = {
  W: "#B8860B",
  U: "#1D5C9E",
  B: "#4A3164",
  R: "#C1432F",
  G: "#2F7A54",
};

function accentFor(colors: string[]): string {
  if (colors.length === 0) return "#5B6472";
  if (colors.length > 1) return "#B8860B";
  return ACCENT_BY_COLOR[colors[0]] ?? "#5B6472";
}

function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function searchToken(field: string, value: string): string {
  return /\s/.test(value) ? `${field}:"${value}"` : `${field}:${value}`;
}

function PanelTitle({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500 mb-3">
      <span className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: accent }} />
      {children}
    </p>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-neutral-50 border border-neutral-200/70 p-5">
      {children}
    </div>
  );
}

function Pill({ children, onClick, selected }: { children: React.ReactNode; onClick?: () => void; selected?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`font-body text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
        selected
          ? "border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-700 hover:border-neutral-700"
          : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500 hover:text-neutral-900"
      }`}
    >
      {selected && <span aria-hidden className="mr-1">✓</span>}
      {children}
    </button>
  );
}

function Badge({ tone, children }: { tone: "amber" | "purple" | "blue" | "neutral"; children: React.ReactNode }) {
  const tones: Record<string, string> = {
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    neutral: "bg-neutral-100 text-neutral-600 border-neutral-200",
  };
  return (
    <span className={`font-body text-xs px-2 py-1 rounded-md border ${tones[tone]}`}>
      {children}
    </span>
  );
}

function LegalDot({ status }: { status: string | null }) {
  if (status === "Legal") return <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />;
  if (status === "Restricted") return <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />;
  if (status === "Banned") return <span className="w-1.5 h-1.5 rounded-full bg-red-600" />;
  return <span className="w-1.5 h-1.5 rounded-full ring-1 ring-neutral-300 bg-white" />;
}

interface FaceTextProps {
  name: string | null;
  mana_cost: string | null;
  type: string | null;
  text: string | null;
  flavor_text: string | null;
  power: string | null;
  toughness: string | null;
  colors: string[];
  heading?: "h1" | "h2";
  flags?: React.ReactNode;
}

function FaceText({ name, mana_cost, type, text, flavor_text, power, toughness, colors, heading = "h1", flags }: FaceTextProps) {
  const accent = accentFor(colors);
  const Heading = heading;
  const compact = heading === "h2";
  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Heading className={`font-display font-semibold text-neutral-900 leading-[1.1] ${compact ? "text-xl" : "text-4xl"}`}>
          {name}
        </Heading>
        {flags && <div className="flex flex-wrap gap-1.5 mt-1">{flags}</div>}
      </div>
      <div
        className={`rounded-full ${compact ? "w-6 h-[2px] mt-1.5 mb-2" : "w-10 h-[3px] mt-3 mb-4"}`}
        style={{ backgroundColor: accent }}
      />

      <div className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 font-body ${compact ? "mb-2" : "mb-4"}`}>
        {mana_cost && (
          <span className="text-neutral-500 text-sm font-medium">
            <ManaText text={mana_cost} />
          </span>
        )}
        {type && <span className="text-neutral-800 text-sm">{type}</span>}
        {power != null && toughness != null && (
          <span className="text-neutral-500 text-sm">{power}/{toughness}</span>
        )}
      </div>

      {text && (
        <div
          className="rounded-xl p-4 text-[15px] leading-relaxed text-neutral-800 whitespace-pre-wrap font-body"
          style={{ backgroundColor: hexToRgba(accent, 0.06), border: `1px solid ${hexToRgba(accent, 0.15)}` }}
        >
          <ManaText text={text} />
        </div>
      )}

      {flavor_text && (
        <p className="font-body italic mt-3 text-sm text-neutral-500">
          {flavor_text}
        </p>
      )}
    </div>
  );
}

interface FaceHeroProps {
  name: string | null;
  mana_cost: string | null;
  type: string | null;
  text: string | null;
  flavor_text: string | null;
  power: string | null;
  toughness: string | null;
  image_uris: { normal: string | null } | null;
  colors: string[];
  flags?: React.ReactNode;
  onImageDragStart?: (e: React.DragEvent<HTMLElement>) => void;
}

function FaceHero({ image_uris, name, flags, onImageDragStart, ...textProps }: FaceHeroProps) {
  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="shrink-0 w-full md:w-[280px]">
        {image_uris?.normal ? (
          <div className="w-full max-w-[280px] aspect-[2.5/3.5] bg-neutral-100 rounded-2xl overflow-hidden shadow-[0_20px_45px_-18px_rgba(0,0,0,0.35)] mx-auto md:mx-0">
            <img
              src={image_uris.normal}
              alt={name ?? ""}
              onDragStart={onImageDragStart}
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </div>
        ) : (
          <div className="w-full max-w-[280px] aspect-[2.5/3.5] bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-400 text-sm mx-auto md:mx-0">
            No image
          </div>
        )}
      </div>

      <FaceText name={name} flags={flags} {...textProps} />
    </div>
  );
}

interface MultiFaceCardProps {
  card: CardDetail;
  flags?: React.ReactNode;
}

function MultiFaceCard({ card, flags }: MultiFaceCardProps) {
  const [showBack, setShowBack] = useState(false);
  const [flipped, setFlipped] = useState(false);

  const backFace = card.faces[0] as FaceSummary | undefined;
  const isSwap = card.layout === "transform" || card.layout === "modal_dfc";
  const isRotate = card.layout === "flip";
  const primaryName = card.name.split(" // ")[0]?.trim() ?? card.name;

  const displayedImage = isSwap && showBack ? backFace?.image_uris ?? null : card.image_uris;
  const displayedName = isSwap && showBack ? backFace?.name ?? null : primaryName;

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <div className="shrink-0 w-full md:w-[280px]">
        {displayedImage?.normal ? (
          <div className="w-full max-w-[280px] aspect-[2.5/3.5] bg-neutral-100 rounded-2xl overflow-hidden shadow-[0_20px_45px_-18px_rgba(0,0,0,0.35)] mx-auto md:mx-0">
            <img
              src={displayedImage.normal}
              alt={displayedName ?? ""}
              onDragStart={(e) => setCardDragData(e, card, displayedImage.normal)}
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              style={isRotate ? { transform: flipped ? "rotate(180deg)" : undefined, transition: "transform 0.5s ease" } : undefined}
            />
          </div>
        ) : (
          <div className="w-full max-w-[280px] aspect-[2.5/3.5] bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-400 text-sm mx-auto md:mx-0">
            No image
          </div>
        )}

        {isSwap && (
          <button
            onClick={() => setShowBack((v) => !v)}
            className="flex items-center gap-1.5 mx-auto mt-3 text-xs text-neutral-500 hover:text-neutral-900 border border-neutral-300 hover:border-neutral-400 rounded-full px-3 py-1.5 transition-colors font-body"
          >
            <span aria-hidden>⇄</span> Turn over
          </button>
        )}
        {isRotate && (
          <button
            onClick={() => setFlipped((v) => !v)}
            className="flex items-center gap-1.5 mx-auto mt-3 text-xs text-neutral-500 hover:text-neutral-900 border border-neutral-300 hover:border-neutral-400 rounded-full px-3 py-1.5 transition-colors font-body"
          >
            <span aria-hidden>↻</span> Flip
          </button>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-5">
        <FaceText
          heading="h1"
          name={primaryName}
          mana_cost={card.mana_cost}
          type={card.type}
          text={card.text}
          flavor_text={card.flavor_text}
          power={card.power}
          toughness={card.toughness}
          colors={card.colors}
          flags={flags}
        />
        {card.faces.map((face) => (
          <div key={face.side} className="pt-5 border-t border-neutral-200">
            <FaceText
              heading="h2"
              name={face.name}
              mana_cost={face.mana_cost}
              type={face.type}
              text={face.text}
              flavor_text={face.flavor_text}
              power={face.power}
              toughness={face.toughness}
              colors={face.colors}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CardPage() {
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid: string }>();
  const [card, setCard] = useState<CardDetail | null>(null);
  const [printings, setPrintings] = useState<PrintingSummary[]>([]);
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [matchAny, setMatchAny] = useState(false);

  useEffect(() => {
    if (!uuid) return;
    setSelectedTags([]);
    setLoading(true);
    setError(null);
    setCard(null);
    setPrintings([]);
    setDecks([]);
    fetch(`/api/cards/${uuid}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Error ${r.status}`);
        return r.json();
      })
      .then((data: CardDetail) => setCard(data))
      .catch(() => setError("Failed to load card"))
      .finally(() => setLoading(false));

    fetch(`/api/cards/${uuid}/printings`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: PrintingSummary[]) => setPrintings(data))
      .catch(() => setPrintings([]));

    fetch(`/api/cards/${uuid}/decks`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: DeckSummary[]) => setDecks(data))
      .catch(() => setDecks([]));
  }, [uuid]);

  const goToSearch = (query: string) => navigate(`/?q=${encodeURIComponent(query)}`);

  const toggleTag = (token: string) =>
    setSelectedTags((prev) => (prev.includes(token) ? prev.filter((t) => t !== token) : [...prev, token]));

  const searchSelectedTags = () => {
    if (selectedTags.length === 0) return;
    goToSearch(matchAny && selectedTags.length > 1 ? `(${selectedTags.join(" OR ")})` : selectedTags.join(" "));
  };

  const tagPill = (field: string, value: string) => {
    const token = searchToken(field, value);
    return (
      <Pill key={value} selected={selectedTags.includes(token)} onClick={() => toggleTag(token)}>
        {value}
      </Pill>
    );
  };

  const accent = card ? accentFor(card.colors) : "#5B6472";
  const hasTagsOrKeywords = card
    ? card.keywords.length > 0 || card.art_tags.length > 0 || card.oracle_tags.length > 0
    : false;
  const hasRulings = card ? card.rulings.length > 0 : false;

  const flagBadges = card && (
    <>
      {card.is_reserved && <Badge tone="purple">Reserved List</Badge>}
      {card.is_promo && <Badge tone="amber">Promo</Badge>}
      {card.is_full_art && <Badge tone="blue">Full Art</Badge>}
      {card.is_reprint && <Badge tone="neutral">Reprint</Badge>}
    </>
  );

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-body">
      <SearchHeader
        onSearch={(q) => navigate(`/?q=${encodeURIComponent(q)}`)}
      />

      <main className="max-w-6xl mx-auto px-6 lg:px-10 pt-6 pb-16">
        {loading && (
          <p className="font-body text-neutral-400 text-center py-20">Loading…</p>
        )}

        {error && (
          <p className="font-body text-red-600 text-center py-20">{error}</p>
        )}

        {card && (
          <div>
            {card.faces.length > 0 ? (
              <MultiFaceCard card={card} flags={flagBadges} />
            ) : (
              <FaceHero
                name={card.name}
                mana_cost={card.mana_cost}
                type={card.type}
                text={card.text}
                flavor_text={card.flavor_text}
                power={card.power}
                toughness={card.toughness}
                image_uris={card.image_uris}
                colors={card.colors}
                flags={flagBadges}
                onImageDragStart={(e) => setCardDragData(e, card, card.image_uris?.normal)}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-10 items-start">
              <Panel>
                <PanelTitle accent={accent}>Details</PanelTitle>
                <div className="space-y-1.5">
                  {card.set_code && (
                    <div className="flex justify-between text-sm py-1 border-b border-neutral-200/70">
                      <span className="text-neutral-500">Set &amp; Number</span>
                      <button
                        type="button"
                        onClick={() => goToSearch(searchToken("s", card.set_code!))}
                        className="text-neutral-900 hover:text-neutral-600 hover:underline cursor-pointer"
                      >
                        {card.set_code.toUpperCase()} #{card.number}
                      </button>
                    </div>
                  )}
                  {card.rarity && (
                    <div className="flex justify-between text-sm py-1 border-b border-neutral-200/70">
                      <span className="text-neutral-500">Rarity</span>
                      <button
                        type="button"
                        onClick={() => goToSearch(searchToken("r", card.rarity!))}
                        className="text-neutral-900 capitalize hover:text-neutral-600 hover:underline cursor-pointer"
                      >
                        {card.rarity}
                      </button>
                    </div>
                  )}
                  {card.artist && (
                    <div className="flex justify-between text-sm py-1 border-b border-neutral-200/70">
                      <span className="text-neutral-500">Artist</span>
                      <button
                        type="button"
                        onClick={() => goToSearch(searchToken("artist", card.artist!))}
                        className="text-neutral-900 text-right hover:text-neutral-600 hover:underline cursor-pointer"
                      >
                        {card.artist}
                      </button>
                    </div>
                  )}
                  {card.edhrec_rank != null && (
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-neutral-500">EDHREC Rank</span>
                      <span className="text-neutral-900">#{card.edhrec_rank.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </Panel>

              {printings.length > 1 && uuid ? (
                <PrintingsPanel printings={printings} currentUuid={uuid} accent={accent} />
              ) : card.prices && (
                <Panel>
                  <PanelTitle accent={accent}>Prices</PanelTitle>
                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                    {card.prices.usd != null && (
                      <span><span className="text-neutral-500">USD </span><span className="text-neutral-900 font-medium">${card.prices.usd.toFixed(2)}</span></span>
                    )}
                    {card.prices.usd_foil != null && (
                      <span><span className="text-neutral-500">Foil </span><span className="text-neutral-900 font-medium">${card.prices.usd_foil.toFixed(2)}</span></span>
                    )}
                    {card.prices.eur != null && (
                      <span><span className="text-neutral-500">EUR </span><span className="text-neutral-900 font-medium">€{card.prices.eur.toFixed(2)}</span></span>
                    )}
                    {card.prices.tix != null && (
                      <span><span className="text-neutral-500">Tix </span><span className="text-neutral-900 font-medium">{card.prices.tix.toFixed(2)}</span></span>
                    )}
                  </div>
                </Panel>
              )}
            </div>

            {decks.length > 0 && (
              <div className="mt-5">
                <PreconPanel decks={decks} accent={accent} />
              </div>
            )}

            {card.legalities && (
              <div className="mt-5">
                <Panel>
                  <PanelTitle accent={accent}>Legalities</PanelTitle>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-x-4 gap-y-2">
                    {LEGAL_FORMATS.map((fmt) => (
                      <button
                        type="button"
                        key={fmt}
                        onClick={() => goToSearch(searchToken("f", fmt))}
                        className="flex items-center gap-2 text-sm text-left hover:text-neutral-900 cursor-pointer"
                      >
                        <LegalDot status={card.legalities![fmt]} />
                        <span className="text-neutral-600 capitalize">{fmt}</span>
                      </button>
                    ))}
                  </div>
                </Panel>
              </div>
            )}

            {(hasTagsOrKeywords || hasRulings) && (
              <div className={`grid grid-cols-1 ${hasTagsOrKeywords && hasRulings ? "md:grid-cols-2" : ""} gap-5 mt-5 items-start`}>
                {hasTagsOrKeywords && (
                  <Panel>
                    <div className="space-y-4">
                      {card.keywords.length > 0 && (
                        <div>
                          <PanelTitle accent={accent}>Keywords</PanelTitle>
                          <div className="flex flex-wrap gap-2">
                            {card.keywords.map((kw) => tagPill("keyword", kw))}
                          </div>
                        </div>
                      )}
                      {card.art_tags.length > 0 && (
                        <div>
                          <PanelTitle accent={accent}>Illustration Tags</PanelTitle>
                          <div className="flex flex-wrap gap-2">
                            {card.art_tags.map((tag) => tagPill("atag", tag))}
                          </div>
                        </div>
                      )}
                      {card.oracle_tags.length > 0 && (
                        <div>
                          <PanelTitle accent={accent}>Oracle Tags</PanelTitle>
                          <div className="flex flex-wrap gap-2">
                            {card.oracle_tags.map((tag) => tagPill("otag", tag))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 pt-3 border-t border-neutral-200/70 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
                      {selectedTags.length === 0 ? (
                        <span className="text-neutral-400">Select tags to search for cards that share them</span>
                      ) : (
                        <>
                          <span className="text-neutral-500">{selectedTags.length} selected</span>
                          {selectedTags.length > 1 && (
                            <div className="flex rounded-full border border-neutral-300 overflow-hidden" role="group" aria-label="Match mode">
                              {([false, true] as const).map((any) => (
                                <button
                                  key={String(any)}
                                  type="button"
                                  aria-pressed={matchAny === any}
                                  onClick={() => setMatchAny(any)}
                                  className={`px-2.5 py-1 cursor-pointer transition-colors ${
                                    matchAny === any ? "bg-neutral-900 text-white" : "bg-white text-neutral-600 hover:text-neutral-900"
                                  }`}
                                >
                                  {any ? "Any" : "All"}
                                </button>
                              ))}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedTags([])}
                            className="text-neutral-500 hover:text-neutral-900 hover:underline cursor-pointer"
                          >
                            Clear
                          </button>
                          <button
                            type="button"
                            onClick={searchSelectedTags}
                            className="ml-auto px-3 py-1 rounded-full text-white cursor-pointer hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: accent }}
                          >
                            Search →
                          </button>
                        </>
                      )}
                    </div>
                  </Panel>
                )}

                {hasRulings && (
                  <Panel>
                    <PanelTitle accent={accent}>Rulings</PanelTitle>
                    <div className="divide-y divide-neutral-200/70 max-h-80 overflow-y-auto pr-1">
                      {card.rulings.map((r, i) => (
                        <div key={i} className="py-2.5 text-sm">
                          <span className="text-neutral-500">{r.date} — </span>
                          <span className="text-neutral-800"><ManaText text={r.text} /></span>
                        </div>
                      ))}
                    </div>
                  </Panel>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-neutral-200 mt-6">
        <p className="max-w-6xl mx-auto px-6 lg:px-10 py-6 font-body text-xs text-neutral-400">
          Card data: MTGJSON &bull; Images and prices: Scryfall (CC BY 4.0)
        </p>
      </footer>
    </div>
  );
}
