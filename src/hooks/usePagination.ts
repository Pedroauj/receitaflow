import { useMemo, useState } from "react";

export function usePagination<T>(items: T[], perPage = 25) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / perPage));

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * perPage;
    return items.slice(start, start + perPage);
  }, [items, page, perPage]);

  // Reset to page 1 when items change
  const safeSetPage = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

  return {
    page,
    setPage: safeSetPage,
    totalPages,
    paginatedItems,
    totalItems: items.length,
    from: items.length === 0 ? 0 : (page - 1) * perPage + 1,
    to: Math.min(page * perPage, items.length),
  };
}
