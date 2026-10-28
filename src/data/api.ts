// Browser → /api client. Views never call this directly; AppProvider does.
import { FIGMA_RECENTS, LINEAR_WORKSPACE, SAMPLE_MODE } from '../config';
import { sampleLinearWorkspace } from './sample';
import type { LinearWorkspace } from './types';

export interface FigmaFileStructure { key: string; name: string; lastModified: string; thumbnailUrl: string | null; version: string | null; pages: { id: string; name: string }[]; fetchedAt: string }

export class UnauthorizedError extends Error {}
/** A failed /api call. `message` is always human-readable text, never a serialized object. */
export class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

/** Pulls a readable message out of any error body: our `{ error: "…" }`, Vercel's `{ error: { message } }`, or plain text. */
function messageOf(body: unknown, status: number): string {
  const e = body && typeof body === 'object' ? (body as { error?: unknown }).error : body;
  if (typeof e === 'string' && e.trim()) return e;
  if (e && typeof e === 'object' && typeof (e as { message?: unknown }).message === 'string') return (e as { message: string }).message;
  return status >= 500 ? 'Design OS can’t reach its server right now. Try again in a minute.' : `Request failed (${status}).`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try { res = await fetch(path, { credentials: 'same-origin', ...init, headers: { accept: 'application/json', ...(init?.headers || {}) } }); }
  catch { throw new ApiError('Design OS can’t reach its server. Check your connection and try again.', 0); }
  const text = await res.text();
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = null; }
  if (!res.ok) {
    // Platform crash pages are not our messages; never show them raw.
    const msg = res.status >= 500 && !(body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string') ? messageOf(null, res.status) : messageOf(body, res.status);
    throw new ApiError(msg, res.status);
  }
  return body as T;
}

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  try { return await request<T>(path, init); }
  catch (err) { if (err instanceof ApiError && err.status === 401) throw new UnauthorizedError('Sign in to continue.'); throw err; }
}

export const emptyLinks = { myIssues: `${LINEAR_WORKSPACE}/my-issues/assigned`, activeCycle: `${LINEAR_WORKSPACE}/my-issues/assigned`, inbox: `${LINEAR_WORKSPACE}/inbox`, figmaRecents: FIGMA_RECENTS };

export async function fetchLinearWorkspace(refresh = false): Promise<LinearWorkspace> {
  if (SAMPLE_MODE) return sampleLinearWorkspace();
  try {
    return await getJson<LinearWorkspace>(`/api/linear/workspace${refresh ? '?refresh=1' : ''}`);
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    return { status: { id: 'linear', name: 'Linear', mode: 'error', label: 'Can’t reach Linear', error: (err as Error).message }, viewer: null, issues: [], projects: [], cycle: null, links: emptyLinks, fetchedAt: null };
  }
}

export const session = {
  get: () => getJson<{ authenticated: boolean; configured: boolean }>('/api/auth/session'),
  // Login calls request() directly so a 401 keeps its own "Incorrect password" message.
  login: (password: string) => request<{ authenticated: boolean }>('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password }) }),
  logout: () => getJson<{ authenticated: boolean }>('/api/auth/logout', { method: 'POST' }),
};

export const figmaApi = {
  status: () => getJson<{ configured: boolean }>('/api/figma/status'),
  file: (key: string) => getJson<FigmaFileStructure>(`/api/figma/file?key=${encodeURIComponent(key)}`),
};
