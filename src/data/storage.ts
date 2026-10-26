/* Browser persistence for the first production slice. Storybook and Figma files stay
   "saved in this browser", exactly as in the prototype, until the database slice (HANDOFF §7.4)
   swaps these repositories for /api-backed ones behind the same functions. */
import { newFile, SCOPE_FILES, SCOPE_ID, SKIP_GROUPS } from '../rules/figma';
import { seedSources, starterLibrary } from '../rules/pdd';
import type { FigmaStore, Library } from './types';

export const LIB_KEY = 'design-os.library.v1';
export const FIGMA_KEY = 'design-os.figma.v1';
export const PREF_KEYS = { theme: 'design-os.theme', sbLayout: 'design-os.sbLayout', sbRail: 'design-os.sbRail' };

export function loadLibrary(): Library {
  try {
    const raw = localStorage.getItem(LIB_KEY);
    if (raw) { const p = JSON.parse(raw); if (p && Array.isArray(p.articles)) { if (!Array.isArray(p.sources)) p.sources = seedSources(); return p; } }
  } catch { /* fall through to the starter set */ }
  return starterLibrary();
}
export function saveLibrary(lib: Library) { try { localStorage.setItem(LIB_KEY, JSON.stringify(lib)); } catch { /* storage full or blocked */ } }

export function loadFigmaStore(): FigmaStore {
  let st: FigmaStore | null = null;
  try {
    const raw = localStorage.getItem(FIGMA_KEY);
    if (raw) { const p = JSON.parse(raw); if (p && Array.isArray(p.files)) st = { links: [], skip: { enabled: true, groups: [...SKIP_GROUPS] }, seeded: [], ...p }; }
  } catch { /* fall through */ }
  if (!st) st = { files: [], links: [], skip: { enabled: true, groups: [...SKIP_GROUPS] }, seeded: [] };
  // Seed the team scope once; later removals by the user are respected.
  if (!st.seeded.includes(SCOPE_ID)) {
    const have = new Set(st.files.map((f) => f.key));
    const add = SCOPE_FILES.filter((f) => !have.has(f.key)).map((f) => ({ ...newFile(f), scope: SCOPE_ID }));
    st = { ...st, files: [...st.files, ...add], seeded: [...st.seeded, SCOPE_ID] };
    saveFigmaStore(st);
  }
  return st;
}
export function saveFigmaStore(st: FigmaStore) { try { localStorage.setItem(FIGMA_KEY, JSON.stringify(st)); } catch { /* storage full or blocked */ } }

export const readPref = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
export const writePref = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };
