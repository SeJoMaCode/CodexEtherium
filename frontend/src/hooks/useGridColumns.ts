import { useEffect, useState } from "react";

interface Breakpoint {
  minWidth: number;
  columns: number;
}

// Mirrors CardGrid's grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6
const BREAKPOINTS: Breakpoint[] = [
  { minWidth: 1280, columns: 6 },
  { minWidth: 1024, columns: 5 },
  { minWidth: 768, columns: 4 },
  { minWidth: 640, columns: 3 },
  { minWidth: 0, columns: 2 },
];

function columnsForWidth(width: number): number {
  return BREAKPOINTS.find((bp) => width >= bp.minWidth)!.columns;
}

export function useGridColumns(): number {
  const [columns, setColumns] = useState(() => columnsForWidth(window.innerWidth));

  useEffect(() => {
    const mqls = BREAKPOINTS.map((bp) => window.matchMedia(`(min-width: ${bp.minWidth}px)`));
    const update = () => setColumns(columnsForWidth(window.innerWidth));
    mqls.forEach((mql) => mql.addEventListener("change", update));
    return () => {
      mqls.forEach((mql) => mql.removeEventListener("change", update));
    };
  }, []);

  return columns;
}
