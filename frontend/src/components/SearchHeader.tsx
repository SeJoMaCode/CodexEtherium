import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";

interface Props {
  initialQuery?: string;
  onSearch: (query: string) => void;
}

export default function SearchHeader({ initialQuery = "", onSearch }: Props) {
  const [value, setValue] = useState(initialQuery);

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(value);
  };

  return (
    <header className="px-4 sm:px-6 lg:px-10 py-3 border-b border-neutral-200">
      <div className="flex items-center gap-x-4">
        <Link
          to="/"
          className="font-display text-lg font-semibold text-neutral-900 shrink-0 hover:text-neutral-600 transition-colors"
        >
          <span className="sm:hidden">CE</span>
          <span className="hidden sm:inline">Codex Etherium</span>
        </Link>

        <form onSubmit={submit} className="flex-1 flex gap-2 min-w-0">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder='Search cards… e.g. t:creature r:mythic f:modern'
            className="flex-1 min-w-0 font-body text-sm bg-white border border-neutral-300 rounded-xl px-3.5 py-2 text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
          />
          <button
            type="submit"
            className="font-body text-sm font-medium bg-neutral-900 hover:bg-neutral-700 text-white px-4 py-2 rounded-xl transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        <Link
          to="/builder"
          className="hidden sm:inline font-body text-sm text-neutral-500 hover:text-neutral-900 transition-colors shrink-0"
        >
          Card builder
        </Link>
        <Link
          to="/syntax"
          className="hidden sm:inline font-body text-sm text-neutral-500 hover:text-neutral-900 transition-colors shrink-0"
        >
          Syntax help →
        </Link>
      </div>
    </header>
  );
}
