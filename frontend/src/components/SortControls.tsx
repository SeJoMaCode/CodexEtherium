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
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-500">Sort:</label>
      <select
        value={sort}
        onChange={(e) => onChange(e.target.value as SortField, order)}
        className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-2 py-1 focus:outline-none focus:border-amber-500"
      >
        {FIELDS.map((f) => (
          <option key={f.value} value={f.value}>{f.label}</option>
        ))}
      </select>
      <button
        onClick={() => onChange(sort, order === "asc" ? "desc" : "asc")}
        className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm px-2 py-1 rounded transition-colors"
        title={order === "asc" ? "Ascending" : "Descending"}
      >
        {order === "asc" ? "↑ Asc" : "↓ Desc"}
      </button>
    </div>
  );
}
