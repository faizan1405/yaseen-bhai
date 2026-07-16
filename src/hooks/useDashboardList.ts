'use client';

import { useCallback, useEffect, useState } from 'react';

interface ListMeta {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

interface ListResponse<T> {
  items: T[];
  meta: ListMeta;
}

/**
 * Shared "load page 1, then load-more" mechanics for the dashboard list pages
 * (viewed profiles, shortlist, interests, notifications). Each page just
 * supplies its own endpoint + item type; this hook owns paging state.
 */
export function useDashboardList<T>(endpointBase: string, pageSize = 12) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const separator = endpointBase.includes('?') ? '&' : '?';

  const fetchPage = useCallback(
    async (targetPage: number, replace: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${endpointBase}${separator}page=${targetPage}&pageSize=${pageSize}`);
        if (!res.ok) {
          throw new Error('Failed to load.');
        }
        const data: ListResponse<T> = await res.json();
        setItems((prev) => (replace ? data.items : [...prev, ...data.items]));
        setHasMore(data.meta.hasMore);
        setTotal(data.meta.total);
        setPage(targetPage);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load.');
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [endpointBase, pageSize],
  );

  useEffect(() => {
    fetchPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpointBase, reloadTick]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) fetchPage(page + 1, false);
  }, [loading, hasMore, page, fetchPage]);

  const reload = useCallback(() => setReloadTick((t) => t + 1), []);

  const removeItem = useCallback((predicate: (item: T) => boolean) => {
    setItems((prev) => prev.filter((item) => !predicate(item)));
    setTotal((t) => Math.max(0, t - 1));
  }, []);

  return { items, setItems, loading, error, hasMore, total, loadMore, reload, removeItem };
}
