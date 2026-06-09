import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

interface Props {
  onSearch: (query: string) => void;
  loading: boolean;
  error?: string | null;
}

const EXAMPLES = [
  "t:creature r:mythic f:modern",
  "c:rg mv<=3",
  'o:"draw a card" -t:sorcery',
  "is:reserved r>=rare",
  "edhrank<=100 f:commander",
];

export default function SearchBar({ onSearch, loading, error }: Props) {
  const [value, setValue] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(value);
  };

  return (
    <div>
      <form onSubmit={submit} className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder='Search cards… e.g. t:creature r:mythic f:modern'
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-lg transition-colors"
        >
          {loading ? "…" : "Search"}
        </button>
      </form>

      <div className="flex items-center justify-between mt-2">
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => { setValue(ex); onSearch(ex); }}
              className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-gray-200 px-2 py-1 rounded transition-colors font-mono"
            >
              {ex}
            </button>
          ))}
        </div>
        <Link
          to="/syntax"
          className="text-xs text-amber-500 hover:text-amber-400 ml-4 shrink-0"
        >
          Syntax help →
        </Link>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded px-3 py-2">
          {error}
        </p>
      )}
    </div>
  );
}
