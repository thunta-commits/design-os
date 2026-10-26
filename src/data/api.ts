// Browser → /api client. Views never call this directly; AppProvider does.
import { FIGMA_RECENTS, SAMPLE_MODE } from '../config';
import { sampleLinearWorkspace } from './sample';
import type { LinearWorkspace } from './types';

export class UnauthorizedError extends Error {}

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'same-origin', ...init, headers: { accept: 'application/json', ...(init?.headers || {}) } });
  if (res.status === 401) throw new UnauthorizedError('Sign in to continue.');
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error((body && body.error) || `Request failed (${res.status})`);
  return body as T;
}

export const emptyLinks = { myIssues: 'https://linear.app', activeCycle: 'https://linear.app', inbox: 'https://linear.app', figmaRecents: FIGMA_RECENTS };

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
  login: (password: string) => getJson<{ authenticated: boolean }>('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password }) }),
  logout: () => getJson<{ authenticated: boolean }>('/api/auth/logout', { method: 'POST' }),
};
