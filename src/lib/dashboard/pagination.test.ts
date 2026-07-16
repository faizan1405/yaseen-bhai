import { describe, it, expect } from 'vitest';
import { parsePagination, buildListMeta, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE } from './pagination';

describe('parsePagination', () => {
  it('defaults to page 1 with the default page size', () => {
    const p = parsePagination(undefined, undefined);
    expect(p.page).toBe(1);
    expect(p.pageSize).toBe(DEFAULT_PAGE_SIZE);
    expect(p.skip).toBe(0);
    expect(p.take).toBe(DEFAULT_PAGE_SIZE);
  });

  it('computes skip/take for a later page', () => {
    const p = parsePagination('3', '10');
    expect(p.page).toBe(3);
    expect(p.pageSize).toBe(10);
    expect(p.skip).toBe(20);
    expect(p.take).toBe(10);
  });

  it('clamps an oversized pageSize to the maximum allowed', () => {
    const p = parsePagination('1', '5000');
    expect(p.pageSize).toBe(MAX_PAGE_SIZE);
  });

  it('rejects negative and zero page numbers by falling back to 1', () => {
    expect(parsePagination('-5', '10').page).toBe(1);
    expect(parsePagination('0', '10').page).toBe(1);
  });

  it('rejects non-numeric input by falling back to defaults', () => {
    const p = parsePagination('not-a-number', 'also-not-a-number');
    expect(p.page).toBe(1);
    expect(p.pageSize).toBe(DEFAULT_PAGE_SIZE);
  });

  it('rejects a negative pageSize by falling back to the default', () => {
    const p = parsePagination('1', '-20');
    expect(p.pageSize).toBe(DEFAULT_PAGE_SIZE);
  });
});

describe('buildListMeta', () => {
  it('reports hasMore=true when more rows remain beyond this page', () => {
    const meta = buildListMeta(1, 10, 25, 10);
    expect(meta.hasMore).toBe(true);
    expect(meta.total).toBe(25);
  });

  it('reports hasMore=false on the last page', () => {
    const meta = buildListMeta(3, 10, 25, 5);
    expect(meta.hasMore).toBe(false);
  });

  it('reports hasMore=false for an empty result set', () => {
    const meta = buildListMeta(1, 10, 0, 0);
    expect(meta.hasMore).toBe(false);
  });
});
