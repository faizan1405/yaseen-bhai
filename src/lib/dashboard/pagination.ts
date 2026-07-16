/**
 * Safe, dependency-free pagination parsing. Every list endpoint runs untrusted
 * query params through this so a caller can never request an unbounded page size
 * or a negative offset (NoSQL "skip" abuse / memory-exhaustion protection).
 */

export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;
export const MAX_PAGE = 100_000;

export interface Pagination {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export function parsePagination(
  pageRaw?: string | number | null,
  pageSizeRaw?: string | number | null,
): Pagination {
  let page = Number.parseInt(String(pageRaw ?? '1'), 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (page > MAX_PAGE) page = MAX_PAGE;

  let pageSize = Number.parseInt(String(pageSizeRaw ?? DEFAULT_PAGE_SIZE), 10);
  if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = DEFAULT_PAGE_SIZE;
  if (pageSize > MAX_PAGE_SIZE) pageSize = MAX_PAGE_SIZE;

  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

/** Build the standard list envelope shared by every dashboard list endpoint. */
export function buildListMeta(page: number, pageSize: number, total: number, returned: number) {
  return {
    page,
    pageSize,
    total,
    hasMore: (page - 1) * pageSize + returned < total,
  };
}
