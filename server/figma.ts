/* Figma REST → file structure (HANDOFF §7.2, §11.4). Server-only: FIGMA_TOKEN never reaches the browser.
   GET /v1/files/:key?depth=1 returns the file name, lastModified, thumbnail and its pages (document.children). */
import { env } from './http.js';

export interface FigmaFileStructure {
  key: string;
  name: string;
  lastModified: string;
  thumbnailUrl: string | null;
  version: string | null;
  /** Pages in Figma's order, with their real node IDs. Figma's "---" divider pages are dropped (see isDividerPage). */
  pages: { id: string; name: string }[];
  fetchedAt: string;
}

export class FigmaError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export const figmaConfigured = () => !!env('FIGMA_TOKEN');

/** Figma draws a page whose name is only dashes (e.g. "---") as a divider in the page list; it is not a page. */
export const isDividerPage = (name: string) => /^\s*[-–—]+\s*$/.test(name);

const KEY_RE = /^[A-Za-z0-9]{10,128}$/;

export async function getFileStructure(key: string): Promise<FigmaFileStructure> {
  const token = env('FIGMA_TOKEN');
  if (!token) throw new FigmaError('Figma isn’t configured. Set FIGMA_TOKEN.', 503);
  if (!KEY_RE.test(key)) throw new FigmaError('That isn’t a valid Figma file key.', 400);
  const base = env('FIGMA_API_BASE') || 'https://api.figma.com';
  let res: Response;
  try { res = await fetch(`${base}/v1/files/${encodeURIComponent(key)}?depth=1`, { headers: { 'X-Figma-Token': token } }); }
  catch { throw new FigmaError('Couldn’t reach Figma. Try again in a minute.', 502); }
  if (!res.ok) {
    const body = await res.json().catch(() => null) as { err?: string; message?: string } | null;
    const detail = body?.err || body?.message;
    if (res.status === 403) throw new FigmaError('Figma refused access to this file. Check that the token’s account can open it and has the file_content:read scope.', 403);
    if (res.status === 404) throw new FigmaError('Figma couldn’t find this file. It may have been moved or deleted.', 404);
    if (res.status === 429) throw new FigmaError('Figma is rate-limiting requests. Try again in a few minutes.', 429);
    throw new FigmaError(`Figma returned an error (${res.status})${detail ? `: ${detail.replace(/\.?\s*$/, '.')}` : '.'}`, 502);
  }
  const data = await res.json() as { name?: string; lastModified?: string; thumbnailUrl?: string; version?: string; document?: { children?: { id: string; name: string; type: string }[] } };
  const pages = (data.document?.children || []).filter((n) => n.type === 'CANVAS' && !isDividerPage(n.name)).map((n) => ({ id: n.id, name: n.name }));
  if (!data.name || !data.document) throw new FigmaError('Figma returned an unexpected response for this file.', 502);
  return { key, name: data.name, lastModified: data.lastModified || '', thumbnailUrl: data.thumbnailUrl || null, version: data.version || null, pages, fetchedAt: new Date().toISOString() };
}
