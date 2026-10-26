/* App state + actions — the production counterpart of the prototype's `class Component` state
   (design/Design OS.dc.html). Views read from useApp(); they never call integrations directly. */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { OWNER, PROJECT_TOPICS, SAMPLE_MODE } from '../config';
import { emptyLinks, fetchLinearWorkspace, UnauthorizedError } from '../data/api';
import { figmaAdapter } from '../data/figmaAdapter';
import { sampleFigmaFiles } from '../data/sample';
import { loadFigmaStore, loadLibrary, PREF_KEYS, readPref, saveFigmaStore, saveLibrary, writePref } from '../data/storage';
import type { Article, DesignLink, FigmaStore, IntegrationStatus, Library, LinearWorkspace, Source, TrackedFile } from '../data/types';
import { buildIndex } from '../rules/figma';
import { ctx as buildCtx, type Ctx } from '../rules/pdd';
import { formatHash, parseHash, type ViewName } from './route';

export const EMPTY_FORM = { id: null as string | null, url: '', title: '', author: '', publication: '', topic: '', status: 'to-read' as Article['status'], summary: '', notes: '', tags: '', projects: [] as string[], collections: [] as string[], favorite: false };
export type ArticleForm = typeof EMPTY_FORM;
export const EMPTY_SOURCE = { name: '', url: '', category: 'Blog' as Source['category'], enabled: true };
export type Dialog = 'save' | 'integrations' | 'link' | 'source' | null;
export type ThemePref = 'system' | 'light' | 'dark';

export interface State {
  view: ViewName; issue: string | null; article: string | null; dialog: Dialog; dirCard: string | null;
  form: ArticleForm; touched: boolean; toast: { msg: string; actionLabel: string; run: (() => void) | null } | null;
  lib: Library; themePref: ThemePref; sysDark: boolean; width: number;
  w: { view: string; project: string; search: string; design: string; sort: string };
  sb: { view: string; topic: string | null; collection: string | null; search: string; status: string; project: string; source: string; saved: string; sort: string; layout: 'grid' | 'list'; newCol: string; railOpen: boolean; filterOpen: boolean };
  srcForm: typeof EMPTY_SOURCE; srcTouched: boolean; confirmSource: string | null;
  notes: string | null; confirmDelete: boolean; confirmReset: boolean;
  fg: { url: string; name: string; role: TrackedFile['role']; touched: boolean; search: string; roleFilter: string; nameAuto: boolean }; confirmFile: string | null; fstore: FigmaStore;
  dir: { fileKey: string; search: string; pageId: string | null }; clNote: string; fgOpen: string | null; fgPage: string | null; idxCollapsed: Record<string, boolean>;
  lk: { issueId: string; fileKey: string; pageId: string; frame: string; version: string };
  linear: LinearWorkspace | null; signedOut: boolean;
}

function initialState(): State {
  const r = parseHash();
  const layout = readPref(PREF_KEYS.sbLayout);
  const rail = readPref(PREF_KEYS.sbRail);
  const theme = readPref(PREF_KEYS.theme);
  return {
    view: r.view, issue: r.params.get('issue'), article: r.params.get('article'), dialog: null, dirCard: r.params.get('card'),
    form: { ...EMPTY_FORM }, touched: false, toast: null, lib: loadLibrary(),
    themePref: theme === 'light' || theme === 'dark' || theme === 'system' ? theme : 'system',
    sysDark: typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches, width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    w: { view: r.view === 'work' && r.params.get('view') || 'assigned', project: r.view === 'work' && r.params.get('project') || '', search: '', design: 'any', sort: r.params.get('view') === 'updated' ? 'updated' : 'urgency' },
    sb: { view: r.view === 'storybook' && r.params.get('view') || 'all', topic: null, collection: null, search: '', status: '', project: '', source: '', saved: '', sort: 'newest', layout: layout === 'list' ? 'list' : 'grid', newCol: '', railOpen: rail ? rail === 'open' : true, filterOpen: false },
    srcForm: { ...EMPTY_SOURCE }, srcTouched: false, confirmSource: null,
    notes: null, confirmDelete: false, confirmReset: false,
    fg: { url: '', name: '', role: 'product', touched: false, search: '', roleFilter: '', nameAuto: false }, confirmFile: null, fstore: loadFigmaStore(),
    dir: { fileKey: '', search: '', pageId: null }, clNote: '', fgOpen: r.view === 'figma' ? r.params.get('file') : null, fgPage: null, idxCollapsed: {},
    lk: { issueId: '', fileKey: '', pageId: '', frame: '', version: 'v1.0' },
    linear: null, signedOut: false,
  };
}

type Patch = Partial<State> | ((s: State) => Partial<State>);

function useActions(stateRef: React.RefObject<State>, setState: (p: Patch, after?: () => void) => void, mainRef: React.RefObject<HTMLElement | null>) {
  return useMemo(() => {
    const S = () => stateRef.current!;
    let toastT: ReturnType<typeof setTimeout> | undefined;
    const a = {
      setState,
      scrollMain(el: HTMLElement | null) { const m = mainRef.current; if (!m) return; m.scrollTo({ top: el ? Math.max(0, el.offsetTop - 16) : 0, behavior: el ? 'smooth' : 'auto' }); },
      go(view: ViewName, patch: Partial<State> = {}, after?: () => void) {
        setState({ view, ...patch }, () => { if (after) setTimeout(after, 60); else a.scrollMain(null); });
      },
      showToast(msg: string, action?: { label: string; run: () => void }) {
        clearTimeout(toastT);
        setState({ toast: { msg, actionLabel: action ? action.label : '', run: action ? () => { action.run(); setState({ toast: null }); } : null } });
        toastT = setTimeout(() => setState({ toast: null }), 4500);
      },
      // ── library ──
      setLib(lib: Library) { saveLibrary(lib); setState({ lib }); },
      /** Change the library from its latest value (for Undo and other deferred updates). */
      mutateLib(fn: (l: Library) => Library) { a.setLib(fn(S().lib)); },
      mutateFstore(fn: (st: FigmaStore) => FigmaStore) { a.setFstore(fn(S().fstore)); },
      updateArticle(id: string, patch: Partial<Article>) { const l = S().lib; a.setLib({ ...l, articles: l.articles.map((x) => (x.id === id ? { ...x, ...patch } : x)) }); },
      addArticle(data: Omit<Article, 'id' | 'savedAt'> & { id?: string; savedAt?: string }) { const l = S().lib; const art = { savedAt: new Date().toISOString(), ...data, id: data.id || `a-${Date.now().toString(36)}` } as Article; a.setLib({ ...l, articles: [art, ...l.articles] }); return art; },
      removeArticle(id: string) { const l = S().lib; a.setLib({ ...l, articles: l.articles.filter((x) => x.id !== id) }); },
      updateSource(id: string, patch: Partial<Source>) { const l = S().lib; a.setLib({ ...l, sources: l.sources.map((x) => (x.id === id ? { ...x, ...patch } : x)) }); },
      removeSource(id: string) { const l = S().lib; a.setLib({ ...l, sources: l.sources.filter((x) => x.id !== id) }); },
      toggleFav(id: string) { const art = S().lib.articles.find((x) => x.id === id); if (art) a.updateArticle(id, { favorite: !art.favorite }); },
      // ── details + dialogs ──
      saveNotes() {
        const s = S(); const id = s.article; if (!id || s.notes === null) return;
        const art = s.lib.articles.find((x) => x.id === id);
        if (art && s.notes !== art.notes) { a.updateArticle(id, { notes: s.notes }); a.showToast('Notes saved'); }
      },
      openIssue(identifier: string) { a.saveNotes(); setState({ issue: identifier, article: null, confirmDelete: false }); },
      openArticle(id: string) { a.saveNotes(); const art = S().lib.articles.find((x) => x.id === id); setState({ article: id, issue: null, notes: art ? art.notes : '', confirmDelete: false }); },
      closeDetail() { a.saveNotes(); setState({ issue: null, article: null, confirmDelete: false, notes: null, dirCard: null, clNote: '' }); },
      openSave(prefill: Partial<ArticleForm> = {}) { setState({ dialog: 'save', form: { ...EMPTY_FORM, ...prefill }, touched: false }); },
      closeDialog() { setState({ dialog: null, confirmReset: false }); },
      setW(patch: Partial<State['w']>) { setState((s) => ({ w: { ...s.w, ...patch } })); },
      setSb(patch: Partial<State['sb']>) { setState((s) => ({ sb: { ...s.sb, ...patch } })); },
      clearSb() { a.setSb({ search: '', status: '', project: '', source: '', saved: '', topic: null, collection: null }); },
      // ── figma files + directory ──
      setFstore(st: FigmaStore) { saveFigmaStore(st); setState({ fstore: st }); },
      patchFile(key: string, patch: Partial<TrackedFile>) { const st = S().fstore; a.setFstore({ ...st, files: st.files.map((f) => (f.key === key ? { ...f, ...patch } : f)) }); },
      setFg(p: Partial<State['fg']>) { setState((s) => ({ fg: { ...s.fg, ...p } })); },
      setDir(p: Partial<State['dir']>) { setState((s) => ({ dir: { ...s.dir, ...p } })); },
      setLk(p: Partial<State['lk']>) { setState((s) => ({ lk: { ...s.lk, ...p } })); },
      async syncFile(key: string) {
        const st = S().fstore; const f = st.files.find((x) => x.key === key); if (!f) return;
        try {
          const r = await figmaAdapter.syncIndex(f, st.skip); const index = buildIndex(r.pages, S().fstore.skip);
          a.patchFile(key, { index, pageCount: r.pages.length, lastModified: r.lastModified || null, indexSyncedAt: new Date().toISOString(), name: r.name || f.name, nameSource: r.name ? 'figma' : f.nameSource });
          a.showToast(`Index synced · ${r.pages.length} pages`);
        } catch (err) { a.showToast((err as Error).message); }
      },
      async scanFile(key: string) {
        const f = S().fstore.files.find((x) => x.key === key); if (!f) return;
        a.patchFile(key, { usageStatus: 'running' });
        try { const usage = await figmaAdapter.scanUsage(f, S().fstore.skip); a.patchFile(key, { usage, usageStatus: 'ok', usageScannedAt: new Date().toISOString(), usageError: null }); a.showToast('Usage scan complete'); }
        catch (err) { a.patchFile(key, { usageStatus: f.usageStatus === 'ok' ? 'ok' : 'never', usageError: (err as Error).message }); a.showToast((err as Error).message); }
      },
      openLink(prefill: Partial<State['lk']>) { const s = S(); const key = s.dir.fileKey || s.fstore.files[0]?.key || ''; setState({ dialog: 'link', dirCard: null, lk: { issueId: '', fileKey: key, pageId: s.dir.pageId || '', frame: '', version: 'v1.0', ...prefill } }); },
      addLink(link: DesignLink) { const st = S().fstore; a.setFstore({ ...st, links: [...st.links, link] }); },
      // ── prefs ──
      setTheme(v: ThemePref) { setState({ themePref: v }); writePref(PREF_KEYS.theme, v); },
      async refreshLinear(refresh = false) {
        try { setState({ linear: await fetchLinearWorkspace(refresh) }); }
        catch (err) { if (err instanceof UnauthorizedError) setState({ signedOut: true }); }
      },
    };
    return a;
  }, [stateRef, setState, mainRef]);
}
export type Actions = ReturnType<typeof useActions>;

interface AppValue { signOut: () => void; state: State; actions: Actions; c: Ctx; isMobile: boolean; dark: boolean; linearLoading: boolean; rootRef: React.RefObject<HTMLDivElement | null>; mainRef: React.RefObject<HTMLElement | null>; figmaRef: React.RefObject<HTMLElement | null>; attnRef: React.RefObject<HTMLElement | null> }
const AppContext = createContext<AppValue | null>(null);

const figmaStatus = (): IntegrationStatus => (SAMPLE_MODE ? { id: 'figma', name: 'Figma', mode: 'sample', label: 'Sample data' } : figmaAdapter.mode === 'connected' ? { id: 'figma', name: 'Figma', mode: 'connected', label: 'Connected' } : { id: 'figma', name: 'Figma', mode: 'disconnected', label: 'Not connected' });
const LOADING: IntegrationStatus = { id: 'linear', name: 'Linear', mode: 'disconnected', label: 'Loading…' };

export function AppProvider({ children, onSignedOut }: { children: ReactNode; onSignedOut: () => void }) {
  const [state, setRaw] = useState<State>(initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const setState = useCallback((p: Patch, after?: () => void) => {
    const next = { ...stateRef.current, ...(typeof p === 'function' ? p(stateRef.current) : p) };
    stateRef.current = next;
    setRaw(next);
    if (after) requestAnimationFrame(() => after());
  }, []);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);
  const figmaRef = useRef<HTMLElement | null>(null);
  const attnRef = useRef<HTMLElement | null>(null);
  const actions = useActions(stateRef, setState, mainRef);

  // width (container, like the prototype's ResizeObserver), system theme, Esc, Linear refresh
  useEffect(() => {
    const el = rootRef.current;
    const ro = el && window.ResizeObserver ? new ResizeObserver(([e]) => setState({ width: e.contentRect.width })) : null;
    if (el && ro) ro.observe(el);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onMq = (e: MediaQueryListEvent) => setState({ sysDark: e.matches });
    mq.addEventListener('change', onMq);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (stateRef.current.dialog) actions.closeDialog(); else actions.closeDetail(); } };
    window.addEventListener('keydown', onKey);
    actions.refreshLinear();
    const poll = setInterval(() => { if (document.visibilityState === 'visible') actions.refreshLinear(); }, 5 * 60_000);
    return () => { ro?.disconnect(); mq.removeEventListener('change', onMq); window.removeEventListener('keydown', onKey); clearInterval(poll); };
  }, [actions, setState]);

  useEffect(() => { if (state.signedOut) onSignedOut(); }, [state.signedOut, onSignedOut]);

  // URL ⇄ state for routes and detail panels (HANDOFF §1). A new view or panel adds a history entry; tab changes replace it.
  const lastRoute = useRef('');
  useEffect(() => {
    const s = state;
    const routeKey = [s.view, s.issue, s.article, s.dirCard, s.fgOpen].join('|');
    const hash = formatHash(s.view, {
      view: s.view === 'work' && s.w.view !== 'assigned' ? s.w.view : s.view === 'storybook' && s.sb.view !== 'all' ? s.sb.view : null,
      project: s.view === 'work' ? s.w.project : null,
      file: s.view === 'figma' ? s.fgOpen : null,
      issue: s.issue, article: s.article, card: s.dirCard,
    });
    if (hash !== window.location.hash) {
      if (lastRoute.current && routeKey !== lastRoute.current) window.history.pushState(null, '', hash);
      else window.history.replaceState(null, '', hash);
    }
    lastRoute.current = routeKey;
  }, [state]);
  useEffect(() => {
    const onHash = () => {
      const r = parseHash(); const p = r.params;
      setState((s) => ({
        view: r.view, issue: p.get('issue'), article: p.get('article'), dirCard: p.get('card'), fgOpen: r.view === 'figma' ? p.get('file') : s.fgOpen,
        w: r.view === 'work' ? { ...s.w, view: p.get('view') || 'assigned', project: p.get('project') || '' } : s.w,
        sb: r.view === 'storybook' ? { ...s.sb, view: p.get('view') || 'all' } : s.sb,
      }));
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [setState]);

  const linear = state.linear;
  const c = useMemo(() => buildCtx({
    issues: linear?.issues || [],
    projects: (linear?.projects || []).map((p) => ({ ...p, topics: p.topics.length ? p.topics : PROJECT_TOPICS[p.name] || [] })),
    cycle: linear?.cycle || null,
    figmaFiles: SAMPLE_MODE ? sampleFigmaFiles() : [],
    library: state.lib,
    integrations: { linear: linear?.status || LOADING, figma: figmaStatus() },
    links: linear?.links || emptyLinks,
    viewer: { ...OWNER, linearName: linear?.viewer?.name },
  }), [linear, state.lib]);

  const isMobile = state.width < 760;
  const dark = state.themePref === 'dark' || (state.themePref === 'system' && state.sysDark);
  const value: AppValue = { signOut: onSignedOut, state, actions, c, isMobile, dark, linearLoading: !linear, rootRef, mainRef, figmaRef, attnRef };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const v = useContext(AppContext);
  if (!v) throw new Error('useApp must be used inside AppProvider');
  return v;
}

export const val = (e: unknown) => (e && typeof e === 'object' && 'target' in e ? ((e as { target: { value: string } }).target.value) : (e as string));
export const toggleIn = <T,>(list: T[], id: T) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
export const hostLabel = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
export const isUrl = (v: string) => /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(v.trim());
export const parseTags = (v: string) => Array.from(new Set(v.split(/[,\n]/).map((t) => t.trim().replace(/^#/, '').toLowerCase().replace(/\s+/g, '-')).filter(Boolean)));
