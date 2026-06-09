interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}

export default function Pagination({ page, pageSize, total, onPage }: Props) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between mt-6 py-4 border-t border-gray-800">
      <span className="text-sm text-gray-500">
        {start.toLocaleString()}–{end.toLocaleString()} of {total.toLocaleString()}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-700 text-sm text-gray-300 rounded transition-colors"
        >
          ← Prev
        </button>
        <span className="text-sm text-gray-500 px-2">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-700 text-sm text-gray-300 rounded transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
