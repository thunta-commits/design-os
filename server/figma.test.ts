// Server-side Figma file reading: parsing, divider pages, errors. fetch is mocked; the page list is the real
// LEX-UI-100 page list read through the Figma connector on 26 Oct 2026 (test/lex-ui-100.pages.json).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import pages from '../test/lex-ui-100.pages.json';
import { buildIndex, SKIP_GROUPS } from '../src/rules/figma';
import { rebuildPages } from '../src/app/rebuild';
import { getFileStructure, isDividerPage } from './figma';

const doc = { name: 'LEX-UI-100 - App shell', lastModified: '2026-10-24T08:12:00Z', thumbnailUrl: 'https://example.invalid/thumb.png', version: '123', document: { children: (pages as [string, string][]).map(([id, name]) => ({ id, name, type: 'CANVAS' })) } };
const respond = (status: number, body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

beforeEach(() => { process.env.FIGMA_TOKEN = 'test-token'; delete process.env.FIGMA_API_BASE; }); // .env.local may point at a local stand-in
afterEach(() => { vi.unstubAllGlobals(); delete process.env.FIGMA_TOKEN; });

describe('getFileStructure', () => {
  it('reads name, lastModified, thumbnail and pages with real node IDs; drops "---" dividers', async () => {
    const fetchMock = respond(200, doc); vi.stubGlobal('fetch', fetchMock);
    const r = await getFileStructure('krm4WJTS0t9yzB7V7bUWVL');
    expect(fetchMock).toHaveBeenCalledWith('https://api.figma.com/v1/files/krm4WJTS0t9yzB7V7bUWVL?depth=1', { headers: { 'X-Figma-Token': 'test-token' } });
    expect(r.name).toBe('LEX-UI-100 - App shell');
    expect(r.lastModified).toBe('2026-10-24T08:12:00Z');
    expect(r.pages).toHaveLength(26);
    expect(r.pages.some((p) => p.name === '---')).toBe(false);
    expect(r.pages[0]).toEqual({ id: '60:4449', name: 'Cover' });
  });

  it('builds the index from real separators only and applies skip rules', async () => {
    vi.stubGlobal('fetch', respond(200, doc));
    const r = await getFileStructure('krm4WJTS0t9yzB7V7bUWVL');
    const idx = buildIndex(r.pages, { enabled: true, groups: [...SKIP_GROUPS] });
    expect(idx.groups.map((g) => [g.name, g.pages.length, g.skipped])).toEqual([
      ['Pages', 3, false], ['HEADER', 4, false], ['NAVIGATION BAR', 3, false], ['COMPONENTS', 6, false], ['ARCHIVE', 6, true],
    ]);
    expect(idx.groups[0].pages.filter((p) => p.skipped).map((p) => p.name)).toEqual(['Cover', 'Index']);
    // a stored index can be rebuilt and re-skipped without calling Figma
    expect(buildIndex(rebuildPages(idx), { enabled: false, groups: [] }).groups.every((g) => !g.skipped)).toBe(true);
    expect(buildIndex(rebuildPages(idx), { enabled: true, groups: [...SKIP_GROUPS] })).toEqual(idx);
  });

  it('reports a missing token, a bad key and Figma errors without inventing data', async () => {
    delete process.env.FIGMA_TOKEN;
    await expect(getFileStructure('krm4WJTS0t9yzB7V7bUWVL')).rejects.toMatchObject({ status: 503 });
    process.env.FIGMA_TOKEN = 't';
    await expect(getFileStructure('../etc')).rejects.toMatchObject({ status: 400 });
    for (const [status, re] of [[403, /refused access/], [404, /couldn’t find/], [429, /rate-limiting/], [500, /error \(500\)/]] as const) {
      vi.stubGlobal('fetch', respond(status, { err: 'x' }));
      await expect(getFileStructure('krm4WJTS0t9yzB7V7bUWVL')).rejects.toThrow(re);
    }
  });

  it('recognises divider pages', () => {
    expect(['---', ' — ', '–––'].every(isDividerPage)).toBe(true);
    expect(['HEADER', '— SEARCH —', 'Cover'].some(isDividerPage)).toBe(false);
  });
});
