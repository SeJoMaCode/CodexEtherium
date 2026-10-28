export interface ImageUris {
  small: string | null;
  normal: string | null;
  large: string | null;
  png: string | null;
  art_crop: string | null;
  border_crop: string | null;
}

export interface Prices {
  usd: number | null;
  usd_foil: number | null;
  usd_etched: number | null;
  eur: number | null;
  eur_foil: number | null;
  tix: number | null;
}

export interface CardSummary {
  uuid: string;
  name: string;
  mana_cost: string | null;
  mana_value: number | null;
  type: string | null;
  text: string | null;
  colors: string[];
  color_identity: string[];
  rarity: string | null;
  set_code: string | null;
  number: string | null;
  power: string | null;
  toughness: string | null;
  keywords: string[];
  scryfall_id: string | null;
  image_uris: ImageUris | null;
  prices: Prices | null;
  edhrec_rank: number | null;
}

export interface Legalities {
  standard: string | null;
  pioneer: string | null;
  modern: string | null;
  legacy: string | null;
  vintage: string | null;
  commander: string | null;
  oathbreaker: string | null;
  pauper: string | null;
  brawl: string | null;
  historic: string | null;
  alchemy: string | null;
  explorer: string | null;
  timeless: string | null;
}

export interface Ruling {
  date: string | null;
  text: string | null;
}

export interface FaceSummary {
  side: string;
  name: string | null;
  mana_cost: string | null;
  mana_value: number | null;
  type: string | null;
  text: string | null;
  flavor_text: string | null;
  colors: string[];
  power: string | null;
  toughness: string | null;
  image_uris: ImageUris | null;
}

export interface CardDetail extends CardSummary {
  flavor_text: string | null;
  artist: string | null;
  border_color: string | null;
  frame_version: string | null;
  is_promo: boolean | null;
  is_reprint: boolean | null;
  is_reserved: boolean | null;
  is_full_art: boolean | null;
  legalities: Legalities | null;
  rulings: Ruling[];
  faces: FaceSummary[];
  oracle_tags: string[];
  art_tags: string[];
  layout: string | null;
}

export interface CardSearchResponse {
  total: number;
  page: number;
  page_size: number;
  cards: CardSummary[];
}

export interface PrintingSummary {
  uuid: string;
  set_code: string | null;
  set_name: string | null;
  number: string | null;
  rarity: string | null;
  release_date: string | null;
  is_reprint: boolean;
  is_canonical: boolean;
  image_uris: ImageUris | null;
  prices: Prices | null;
}

export type SortField = "name" | "mv" | "edhrec" | "usd" | "usd_foil" | "tix";
export type SortOrder = "asc" | "desc";

export interface SyntaxKeyword {
  keyword: string;
  aliases: string[];
  field: string;
  operators: string[];
  notes: string;
  examples: string[];
  flags?: Record<string, string>;
}

export interface SyntaxDoc {
  overview: string;
  keywords: SyntaxKeyword[];
  bare_words: { description: string; examples: string[] };
  boolean: Record<string, string>;
  sort: {
    param: string;
    values: string[];
    default: string;
    direction_param: string;
    direction_values: string[];
    notes: string;
  };
  examples: { q: string; description: string }[];
}
