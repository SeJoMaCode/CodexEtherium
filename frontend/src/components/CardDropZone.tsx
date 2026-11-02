import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CardSummary } from "../types";

// Lets a card dragged in from another site (Moxfield, Scryfall, ...) open its
// card page. Other sites don't share IDs with us, so we pull out what they do
// expose — card names (img alt, link text, plain text) and Scryfall URLs — and
// resolve those through the regular search API.

interface DropHints {
  names: string[];
  printing: { setCode: string; number: string } | null;
}

const ACCEPTED_TYPES = ["text/html", "text/uri-list", "text/plain"];

function isExternalCardDrag(e: DragEvent, internal: boolean): boolean {
  if (internal || !e.dataTransfer) return false;
  const types = Array.from(e.dataTransfer.types);
  return !types.includes("Files") && types.some((t) => ACCEPTED_TYPES.includes(t));
}

function cleanName(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const name = raw
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\d+x?\s+/i, "")                // "1 Sol Ring" / "2x Opt"
    .replace(/\s+\([A-Z0-9]{2,6}\)(\s+\S+)?.*$/, "") // "Sol Ring (C21) 263 *F*"
    .replace(/"/g, "")
    .trim();
  if (!name || name.length > 141 || /^https?:/i.test(name)) return null;
  return name;
}

function slugToName(slug: string): string {
  return decodeURIComponent(slug).replace(/-/g, " ");
}

function extractHints(dt: DataTransfer): DropHints {
  const names: string[] = [];
  let printing: DropHints["printing"] = null;
  const urls: string[] = [];

  const html = dt.getData("text/html");
  if (html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("img").forEach((img) => {
      names.push(img.getAttribute("alt") ?? "", img.getAttribute("title") ?? "");
      urls.push(img.getAttribute("src") ?? "");
    });
    doc.querySelectorAll("a").forEach((a) => {
      names.push(a.textContent ?? "", a.getAttribute("title") ?? "");
      urls.push(a.getAttribute("href") ?? "");
    });
  }
  urls.push(...dt.getData("text/uri-list").split(/\r?\n/).filter((l) => !l.startsWith("#")));
  const plain = dt.getData("text/plain");
  if (/^https?:\/\//i.test(plain.trim())) urls.push(plain.trim());
  else names.push(plain.split(/\r?\n/)[0] ?? "");

  for (const url of urls) {
    const m = /scryfall\.com\/card\/([^/]+)\/([^/]+)(?:\/([^/?#]+))?/i.exec(url);
    if (m) {
      printing ??= { setCode: m[1], number: decodeURIComponent(m[2]) };
      if (m[3]) names.push(slugToName(m[3]));
    }
  }

  const unique = [...new Set(names.map(cleanName).filter((n): n is string => n !== null))];
  return { names: unique, printing };
}

// Ignore case and punctuation so URL slugs ("70000-light-years-from-home")
// still match real names ("70,000 Light-Years from Home").
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function searchCards(q: string): Promise<CardSummary[]> {
  const params = new URLSearchParams({ q, page_size: "500" });
  const res = await fetch(`/api/cards/search?${params}`);
  if (!res.ok) return [];
  const data: { cards: CardSummary[] } = await res.json();
  return data.cards;
}

async function findPrinting(setCode: string, number: string): Promise<CardSummary | null> {
  const cards = await searchCards(`++ s:${setCode}`);
  return cards.find((c) => c.number?.toLowerCase() === number.toLowerCase()) ?? null;
}

async function findByName(name: string): Promise<CardSummary | null> {
  const target = norm(name);
  const cards = await searchCards(`"${name}"`);
  // Prefer the card actually named this over one that only has it as a face.
  return (
    cards.find((c) => norm(c.name) === target) ??
    cards.find((c) => c.name.split(" // ").some((face) => norm(face) === target)) ??
    null
  );
}

export default function CardDropZone() {
  const navigate = useNavigate();
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const internalDrag = useRef(false);
  const depth = useRef(0);

  useEffect(() => {
    const onDragStart = () => { internalDrag.current = true; };
    const onDragEnd = () => { internalDrag.current = false; };

    const onDragEnter = (e: DragEvent) => {
      if (!isExternalCardDrag(e, internalDrag.current)) return;
      depth.current += 1;
      setActive(true);
    };
    const onDragLeave = (e: DragEvent) => {
      if (!isExternalCardDrag(e, internalDrag.current)) return;
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setActive(false);
    };
    const onDragOver = (e: DragEvent) => {
      if (!isExternalCardDrag(e, internalDrag.current)) return;
      e.preventDefault();
      e.dataTransfer!.dropEffect = "copy";
    };
    const onDrop = (e: DragEvent) => {
      if (!isExternalCardDrag(e, internalDrag.current)) return;
      e.preventDefault();
      depth.current = 0;
      setActive(false);

      const hints = extractHints(e.dataTransfer!);
      if (import.meta.env.DEV) console.debug("card drop", hints, {
        html: e.dataTransfer!.getData("text/html"),
        uri: e.dataTransfer!.getData("text/uri-list"),
        plain: e.dataTransfer!.getData("text/plain"),
      });
      if (hints.names.length === 0 && !hints.printing) {
        setMessage("Couldn't find a card name in that drop");
        return;
      }

      setMessage("Finding card…");
      (async () => {
        const lookups = [
          ...(hints.printing ? [() => findPrinting(hints.printing!.setCode, hints.printing!.number)] : []),
          ...hints.names.map((name) => () => findByName(name)),
        ];
        for (const lookup of lookups) {
          const card = await lookup().catch(() => null);
          if (card) {
            setMessage(null);
            navigate(`/card/${card.uuid}`);
            return;
          }
        }
        setMessage(null);
        if (hints.names[0]) navigate(`/?q=${encodeURIComponent(hints.names[0])}`);
        else setMessage("Couldn't find that card");
      })();
    };

    document.addEventListener("dragstart", onDragStart);
    document.addEventListener("dragend", onDragEnd);
    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    return () => {
      document.removeEventListener("dragstart", onDragStart);
      document.removeEventListener("dragend", onDragEnd);
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [navigate]);

  useEffect(() => {
    if (!message || message === "Finding card…") return;
    const t = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(t);
  }, [message]);

  return (
    <>
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm pointer-events-none p-6">
          <div className="rounded-2xl border-2 border-dashed border-neutral-400 bg-white px-10 py-8 text-center shadow-lg">
            <p className="font-display text-2xl text-neutral-900">Drop to open card</p>
            <p className="font-body text-sm text-neutral-500 mt-1">Works with cards from Moxfield, Scryfall and more</p>
          </div>
        </div>
      )}
      {message && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-neutral-900 text-white font-body text-sm px-4 py-2 shadow-lg">
          {message}
        </div>
      )}
    </>
  );
}
