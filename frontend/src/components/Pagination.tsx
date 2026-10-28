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
    <div className="flex flex-wrap items-center justify-between gap-y-2 mt-6 py-4 border-t border-neutral-200 font-body">
      <span className="text-sm text-neutral-500">
        {start.toLocaleString()}–{end.toLocaleString()} of {total.toLocaleString()}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 bg-white hover:border-neutral-500 disabled:opacity-40 disabled:cursor-not-allowed border border-neutral-300 text-sm text-neutral-600 rounded-lg transition-colors"
        >
          ← Prev
        </button>
        <span className="text-sm text-neutral-500 px-2">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 bg-white hover:border-neutral-500 disabled:opacity-40 disabled:cursor-not-allowed border border-neutral-300 text-sm text-neutral-600 rounded-lg transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
