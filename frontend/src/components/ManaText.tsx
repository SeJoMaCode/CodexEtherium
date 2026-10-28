import { SYMBOL_SRC } from "../lib/manaSymbols";

const TOKEN_RE = /(\{[^}]+\}|\[[+−-]?\d+\])/g;

function LoyaltyBadge({ value }: { value: string }) {
  const tone = value.startsWith("+")
    ? "bg-emerald-100 text-emerald-800"
    : value.startsWith("−") || value.startsWith("-")
      ? "bg-red-100 text-red-800"
      : "bg-neutral-200 text-neutral-800";
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[1.8em] h-[1.4em] px-1 rounded-full text-[0.75em] font-bold align-middle mx-0.5 ${tone}`}
    >
      {value}
    </span>
  );
}

interface Props {
  text: string | null | undefined;
}

export default function ManaText({ text }: Props) {
  if (!text) return null;

  const parts = text.split(TOKEN_RE);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("{") && part.endsWith("}")) {
          const src = SYMBOL_SRC[part];
          if (src) {
            return (
              <img
                key={i}
                src={src}
                alt={part}
                className="inline-block h-[1em] w-[1em] align-text-bottom mx-px"
                loading="lazy"
              />
            );
          }
          return part;
        }
        if (part.startsWith("[") && part.endsWith("]")) {
          return <LoyaltyBadge key={i} value={part.slice(1, -1)} />;
        }
        return part;
      })}
    </>
  );
}
