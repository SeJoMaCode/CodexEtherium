import type { SortField, SortOrder } from "../types";

interface Props {
  sort: SortField;
  order: SortOrder;
  onChange: (sort: SortField, order: SortOrder) => void;
}

const FIELDS: { value: SortField; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "mv", label: "Mana Value" },
  { value: "edhrec", label: "EDHREC" },
  { value: "usd", label: "Price (USD)" },
  { value: "usd_foil", label: "Price (foil)" },
  { value: "tix", label: "MTGO Tix" },
];

export default function SortControls({ sort, order, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 font-body">
      <label className="text-sm text-neutral-500">Sort:</label>
      <select
        value={sort}
        onChange={(e) => onChange(e.target.value as SortField, order)}
        className="bg-white border border-neutral-300 text-neutral-700 text-sm rounded-lg px-2 py-1 focus:outline-none focus:border-neutral-900"
      >
        {FIELDS.map((f) => (
          <option key={f.value} value={f.value}>{f.label}</option>
        ))}
      </select>
      <button
        onClick={() => onChange(sort, order === "asc" ? "desc" : "asc")}
        className="bg-white hover:border-neutral-500 border border-neutral-300 text-neutral-600 text-sm px-2 py-1 rounded-lg transition-colors"
        title={order === "asc" ? "Ascending" : "Descending"}
      >
        {order === "asc" ? "↑ Asc" : "↓ Desc"}
      </button>
    </div>
  );
}
