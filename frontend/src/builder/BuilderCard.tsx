import type { CSSProperties, ReactNode } from "react";
import {
  ART_GLOW, FRAME_TINT, MODE_GLYPH, OP_GLYPH, colorKey, indicatorGradient,
} from "./constants";
import { faceTokens } from "./query";
import SetSymbol from "./SetSymbol";
import { LOCKED_ON_BACK, type BuilderState, type Region, type Side } from "./types";

export interface BuilderCardProps {
  state: BuilderState;
  side: Side;
  openRegion: Region | null;
  /** Art of the top matching card, shown in the front art box. */
  artUrl: string | null;
  artCaption: string | null;
  /** True while a custom (text-edited) query is active. */
  dimmed: boolean;
  onRegion: (region: Region, el: HTMLElement) => void;
  onFlip: (side: Side) => void;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface FaceProps extends Omit<BuilderCardProps, "side" | "dimmed" | "onFlip"> {
  faceSide: Side;
  current: Side;
}

function Face({ state, faceSide, current, openRegion, artUrl, artCaption, onRegion }: FaceProps) {
  const f = state[faceSide];
  const c = state.card;
  const isBack = faceSide === "back";
  const hidden = faceSide !== current;
  const key = colorKey(f.colors);
  const [tint, deep] = FRAME_TINT[key];

  const region = (r: Region, label: string, className: string, children: ReactNode, style?: CSSProperties) => {
    const locked = isBack && LOCKED_ON_BACK.includes(r);
    const isOpen = !hidden && openRegion === r;
    return (
      <button
        type="button"
        className={`cb-region ${className}${isOpen ? " is-open" : ""}${locked ? " is-locked" : ""}`}
        aria-label={label}
        aria-expanded={isOpen}
        style={style}
        onClick={(e) => onRegion(r, e.currentTarget)}
      >
        {children}
      </button>
    );
  };

  let mana: ReactNode;
  if (isBack) {
    mana = f.colors.length > 0
      ? <span className="cb-indicator" style={{ background: indicatorGradient(f.colors) }} />
      : <span className="cb-pip cb-pip-empty">◐</span>;
  } else if (f.colors.length > 0 || f.mv.trim()) {
    mana = (
      <>
        {f.colors.length > 0 && (
          <span className="cb-mode-tag">{f.colorTarget === "id" ? "id " : ""}{MODE_GLYPH[f.colorMode]}</span>
        )}
        {f.colors.map((col) => <span key={col} className={`cb-pip cb-pip-${col}`}>{col}</span>)}
        {f.mv.trim() && <span className="cb-pip cb-pip-mv">mv {OP_GLYPH[f.mvOp]}{f.mv.trim()}</span>}
      </>
    );
  } else {
    mana = <span className="cb-pip cb-pip-empty">+</span>;
  }

  const name = f.name.trim()
    ? <span className="cb-ellipsis">{f.nameNeg ? "not " : ""}{f.name}</span>
    : <span className="cb-ph">{isBack ? "Any back-face name" : "Any name"}</span>;

  const type = f.types.length > 0
    ? <span className="cb-ellipsis">{f.typesNeg ? "Not " : ""}{f.types.map(cap).join(f.typesNeg ? ", " : " ")}</span>
    : <span className="cb-ph">Any type</span>;

  const hasText = f.keywords.length > 0 || f.phrases.length > 0 || f.otags.length > 0;
  const text = hasText ? (
    <>
      {f.textNeg && <span className="cb-neg">Without</span>}
      {f.keywords.length > 0 && <span className="cb-kw">{f.keywords.map(cap).join(", ")}</span>}
      {f.phrases.map((p) => <span key={p} className="cb-phrase">“…{p}…”</span>)}
      {f.otags.length > 0 && (
        <span className="cb-chiprow">
          {f.otags.map((t, i) => (
            <span key={t} className="contents">
              {i > 0 && <span className="cb-mini cb-mini-join">{f.otagAny ? "or" : "and"}</span>}
              <span className="cb-mini">{t}</span>
            </span>
          ))}
        </span>
      )}
    </>
  ) : <span className="cb-ph">Rules text, keywords, or what the card does…</span>;

  const pt = f.pow.trim() || f.tou.trim()
    ? `${f.pow.trim() ? OP_GLYPH[f.powOp] + f.pow.trim() : "*"}/${f.tou.trim() ? OP_GLYPH[f.touOp] + f.tou.trim() : "*"}`
    : <span className="cb-ph text-[13px]">P / T</span>;

  const showArt = !isBack && artUrl;
  let art: ReactNode;
  if (isBack) {
    art = (
      <>
        <span className="cb-glyph">↺</span>
        <span className="cb-ph">Art, artist, set and rarity<br />are shared with the front</span>
      </>
    );
  } else if (c.atags.length > 0 || c.artist.trim()) {
    art = (
      <>
        <span className="cb-chiprow justify-center">
          {c.atags.map((t, i) => (
            <span key={t} className="contents">
              {i > 0 && <span className="cb-mini cb-mini-join">{c.atagAny ? "or" : "and"}</span>}
              <span className="cb-mini cb-mini-light">{t}</span>
            </span>
          ))}
        </span>
        {c.artist.trim() && <span className="cb-art-artist">by {c.artist}</span>}
      </>
    );
  } else if (showArt) {
    art = <span className="cb-art-caption">{artCaption}</span>;
  } else {
    art = (
      <>
        <span className="cb-glyph">✦</span>
        <span className="cb-ph">Any art: click to search by<br />what's in the illustration</span>
      </>
    );
  }

  const frameStyle = {
    "--cb-frame": tint,
    "--cb-frame-deep": deep,
    "--cb-art-glow": ART_GLOW[key],
  } as CSSProperties;

  return (
    <div className={`cb-face${isBack ? " is-back" : ""}`} inert={hidden}>
      <div className="cb-card">
        <div className="cb-frame" style={frameStyle}>
          <div className="cb-bar">
            {region("name", "Card name", "cb-name", name)}
            {region("mana", isBack ? "Color indicator" : "Mana cost and colors", "cb-mana", mana)}
          </div>
          {region(
            "art", "Illustration", `cb-art${showArt ? " has-image" : ""}`, art,
            showArt ? { backgroundImage: `linear-gradient(transparent 55%, rgba(0,0,0,.55)), url("${artUrl}")` } : undefined,
          )}
          <div className="cb-bar">
            {region("type", "Type line", "cb-type", type)}
            {region("set", "Set and rarity", "cb-set", <SetSymbol rarities={c.rarities} muted={isBack} />)}
          </div>
          {region("text", "Rules text", "cb-text", text)}
          {region("flavor", "Flavor text", "cb-flavor", f.flavor.trim() ? f.flavor : <span className="cb-ph text-[11.5px]">Flavor text</span>)}
          <div className="cb-foot">
            {region("art", "Artist", "cb-artist", (
              <>
                <span className="cb-setline">
                  {c.set ? c.set.toUpperCase() : "SET"}
                  {c.rarities.length > 0 && ` • ${c.rarities.map((r) => r[0].toUpperCase()).join("/")}`}
                </span>
                <span>✎ Illus. {c.artist.trim() || "any artist"}</span>
              </>
            ))}
            {region("pt", "Power and toughness", "cb-pt", pt)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BuilderCard(props: BuilderCardProps) {
  const { state, side, dimmed, onFlip } = props;
  const backTokens = faceTokens(state.back, true);
  return (
    <div className={`cb-scene${dimmed ? " is-dimmed" : ""}`}>
      <div className={`cb-flipper${side === "back" ? " is-flipped" : ""}`}>
        <Face {...props} faceSide="front" current={side} />
        <Face {...props} faceSide="back" current={side} />
      </div>
      {side === "front" && backTokens.length > 0 && !dimmed && (
        <button type="button" className="cb-back-tab" title="Turn over to edit the back face" onClick={() => onFlip("back")}>
          {state.backNeg ? "Back must not be" : "Back"} ▸ <small>{backTokens.join(" ")}</small>
        </button>
      )}
      {dimmed && (
        <p className="cb-dim-note">Custom query: the card is paused while you edit the text.</p>
      )}
    </div>
  );
}
