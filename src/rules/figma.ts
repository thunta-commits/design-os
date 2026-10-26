/* Figma files + Directory — ported from design/pdd-figma.js (model, URL parsing, index building,
   skip rules, library classification). Persistence and the adapter live in src/data/figmaStore.ts. */
import type { FileIndexData, FileRole, SkipSettings, TrackedFile } from '../data/types';

export const ROLES: { id: FileRole; label: string; tone: string }[] = [
  { id: 'product', label: 'Product file', tone: 'info' },
  { id: 'library', label: 'Component library', tone: 'design' },
  { id: 'foundation', label: 'Design system / Foundation', tone: 'done' },
  { id: 'reference', label: 'Reference file', tone: 'up-next' },
];
export const ROLE_BY_ID = Object.fromEntries(ROLES.map((r) => [r.id, r])) as Record<string, (typeof ROLES)[number]>;
export const SKIP_GROUPS = ['Archive', 'Drafts & explorations', 'Ready to delete', 'Cover', 'Index'];
// Conventions recognised only when a real page name matches — never inferred from content.
export const GROUP_CONVENTIONS = ['Cover', 'Index', 'Header', 'Search', 'Exploration', 'Navigation', 'Responsive', 'Specs', 'Archive'];
// Team design scope for New IA (names + links supplied by the team; nothing here comes from Figma).
export const SCOPE_ID = 'new-ia-v1';
export const SCOPE_FILES = ([
  ['krm4WJTS0t9yzB7V7bUWVL', 'LEX-UI-100 - App shell', 'LEX-UI-100---App-shell'],
  ['fcRS7wJCNqGZJxEoHEsACZ', 'LEX-UI-101 - Home', 'LEX-UI-101---Home'],
  ['Pqoff1FKr1eYLjWaiKYIUF', 'LEX-UI-102 - Agreements', 'LEX-UI-102---Agreements'],
  ['MsqRS1mg8EI9aK8YQiqK55', 'LEX-UI-103 - Templates', 'LEX-UI-103---Templates'],
  ['K6m0PpCjhmek2gaayf02LP', 'LEX-UI-104 - Document & Space', 'LEX-UI-104---Document---Space'],
  ['UZEz7x1OK8NojgxSWpmlxG', 'LEX-UI-105 - Ask AI', 'LEX-UI-105---Ask-AI'],
] as const).map(([key, name, slug]) => ({ key, name, url: `https://www.figma.com/design/${key}/${slug}`, role: 'product' as FileRole, nameSource: 'user' as const, scope: SCOPE_ID }));
export const CURRENT_LIBRARY = [/^DS-shadcn-/i];
export const LEGACY_LIBRARY = [/^LEX\b.*\b(component|components|library|ui kit)\b/i]; // extend later

export type ParsedFigmaUrl =
  | { kind: null }
  | { kind: 'folder'; teamId?: string; folderId?: string }
  | { kind: 'file'; key: string; fileType: string; slugName: string; nodeId: string | null; canonical: string };

export function parseFigmaUrl(raw: string): ParsedFigmaUrl {
  const url = (raw || '').trim();
  let u: URL; try { u = new URL(url); } catch { return { kind: null }; }
  if (!/(^|\.)figma\.com$/i.test(u.hostname)) return { kind: null };
  const folder = /\/files\/team\/(\d+)\/folder\/(\d+)/.exec(u.pathname);
  if (folder) return { kind: 'folder', teamId: folder[1], folderId: folder[2] };
  if (/\/files\/(team|project)\//.test(u.pathname)) return { kind: 'folder' };
  const f = /^\/(design|file|proto|board|slides)\/([A-Za-z0-9]{10,})(?:\/([^/?#]+))?/.exec(u.pathname);
  if (!f) return { kind: null };
  let slugName = '';
  if (f[3]) { try { slugName = decodeURIComponent(f[3]).replace(/--+/g, ' – ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim(); } catch { /* keep empty */ } }
  const node = u.searchParams.get('node-id');
  return { kind: 'file', key: f[2], fileType: f[1], slugName, nodeId: node ? node.replace('-', ':') : null, canonical: `https://www.figma.com/${f[1] === 'proto' ? 'design' : f[1]}/${f[2]}` };
}

export const isSkipped = (name: string, skip: SkipSettings | null | undefined) => !!(skip && skip.enabled && skip.groups.some((g) => g.toLowerCase() === name.trim().toLowerCase()));
const conventionOf = (name: string) => (GROUP_CONVENTIONS.find((c) => name.toLowerCase().startsWith(c.toLowerCase())) || 'custom').toLowerCase();
export const libraryKind = (name: string) => (CURRENT_LIBRARY.some((r) => r.test(name)) ? 'current' : LEGACY_LIBRARY.some((r) => r.test(name)) ? 'legacy' : 'other');

// Groups pages by real separator conventions in the page list (e.g. "HEADER", "—— SEARCH ——",
// "↳ Invite members" children). If no separators exist, returns one ungrouped bucket.
export function buildIndex(pages: { id: string; name: string }[], skip: SkipSettings | null | undefined): FileIndexData {
  const isSep = (n: string) => /^[\s\-–—_=*#]*[A-Z0-9][A-Z0-9 &/+]{1,}[\s\-–—_=*#]*$/.test(n) && n === n.toUpperCase();
  type G = { id: string; name: string; kind: string; pages: { id: string; nodeId: string; name: string }[] };
  const groups: G[] = []; let cur: G = { id: 'ungrouped', name: 'Pages', kind: 'ungrouped', pages: [] };
  for (const p of pages) {
    const name = (p.name || '').trim();
    if (isSep(name) && !/^↳/.test(name)) { if (cur.pages.length || cur.kind !== 'ungrouped') groups.push(cur); const clean = name.replace(/[\-–—_=*#]/g, '').trim(); cur = { id: p.id, name: clean, kind: conventionOf(clean), pages: [] }; continue; }
    cur.pages.push({ id: p.id, nodeId: p.id, name: name.replace(/^↳\s*/, '') });
  }
  groups.push(cur);
  return { groups: groups.filter((g) => g.pages.length || g.kind !== 'ungrouped').map((g) => { const gs = isSkipped(g.name, skip); return { ...g, skipped: gs, pages: g.pages.map((p) => ({ ...p, skipped: gs || isSkipped(p.name, skip) })) }; }) };
}

export const NOT_CONNECTED = 'Connect Figma to sync file structure and component usage.';

export function newFile({ key, url, name, role, nameSource }: Pick<TrackedFile, 'key' | 'url' | 'name' | 'role' | 'nameSource'>): TrackedFile {
  return { key, url, name, role, nameSource, addedAt: new Date().toISOString(), lastModified: null, pageCount: null, index: null, indexSyncedAt: null, usage: null, usageScannedAt: null, usageStatus: 'never', usageError: null };
}
export function validateAdd(form: { url: string; name: string }, files: TrackedFile[]) {
  const p = parseFigmaUrl(form.url);
  const url = !form.url.trim() ? 'Paste a Figma file link.'
    : p.kind === 'folder' ? 'That’s a folder link. Folders can’t be listed until Figma is connected. Add each file by its own link.'
    : p.kind !== 'file' ? 'Use a Figma file link, like https://www.figma.com/design/…'
    : files.some((f) => f.key === p.key) ? 'This file is already tracked.' : '';
  return { url, name: !form.name.trim() ? 'Add a name.' : '', parsed: p };
}
export const frameUrl = (file: { url: string }, nodeId: string | null) => (nodeId ? `${file.url.split('?')[0]}?node-id=${encodeURIComponent(nodeId.replace(':', '-'))}` : file.url);
