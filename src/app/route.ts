/* Hash routes (HANDOFF §1): #/, #/work, #/directory, #/figma, #/storybook, plus query params
   that open detail panels over any view (?issue=AG-111, ?article=a-tokens, ?card=AG-111) and pin
   tab state (?view=…, ?file=<figma key>). */
export type ViewName = 'overview' | 'work' | 'directory' | 'figma' | 'storybook';
const PATHS: Record<ViewName, string> = { overview: '/', work: '/work', directory: '/directory', figma: '/figma', storybook: '/storybook' };
const BY_PATH = Object.fromEntries(Object.entries(PATHS).map(([k, v]) => [v, k as ViewName]));

export interface Route { view: ViewName; params: URLSearchParams }

export function parseHash(hash = window.location.hash): Route {
  const raw = hash.replace(/^#/, '') || '/';
  const [path, query = ''] = raw.split('?');
  return { view: BY_PATH[path] || 'overview', params: new URLSearchParams(query) };
}

export function formatHash(view: ViewName, params: Record<string, string | null | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const qs = q.toString();
  return `#${PATHS[view]}${qs ? `?${qs}` : ''}`;
}
