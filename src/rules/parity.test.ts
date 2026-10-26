/* Parity: the TypeScript rules must give the same answers as the Claude Design reference files
   (design/pdd-data.js, design/pdd-figma.js). If Claude Design changes a rule, this test fails until
   the port is updated. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { sampleFigmaFiles, sampleLinearWorkspace } from '../data/sample';
import * as F from './figma';
import * as P from './pdd';

function loadDesign() {
  const store = new Map<string, string>();
  const window: Record<string, any> = { localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v) } };
  const sandbox = { window, localStorage: window.localStorage, Intl, Date, Math, JSON, URL, Map, Set, Array, Object, RegExp, String, Number };
  vm.createContext(sandbox);
  for (const f of ['pdd-data.js', 'pdd-figma.js']) vm.runInContext(readFileSync(resolve(__dirname, '../../design', f), 'utf8'), sandbox);
  return { PDD: window.PDD, FIG: window.PDDFigma };
}
const { PDD, FIG } = loadDesign();
const strip = <T extends { savedAt?: string }>(xs: T[]) => xs.map(({ savedAt: _s, ...rest }) => rest);
const ids = (xs: { identifier: string }[]) => xs.map((i) => i.identifier);

describe('pdd-data.js parity', () => {
  const ws = sampleLinearWorkspace();
  const issues = ws.issues;
  const projects = ws.projects;
  const articles = P.seedArticles();

  it('seed library and taxonomy match', () => {
    expect(JSON.parse(JSON.stringify(strip(articles)))).toEqual(JSON.parse(JSON.stringify(strip(PDD.starterLibrary().articles))));
    expect(P.TOPICS).toEqual(JSON.parse(JSON.stringify(PDD.TOPICS)));
    expect(P.DEFAULT_COLLECTIONS).toEqual(JSON.parse(JSON.stringify(PDD.DEFAULT_COLLECTIONS)));
    expect(P.seedSources().map(({ updatedAt: _u, ...s }) => s)).toEqual(JSON.parse(JSON.stringify(PDD.starterLibrary().sources)).map(({ updatedAt: _u, ...s }: { updatedAt: string }) => s));
  });

  it('sample Linear data matches (dev-only fixture)', () => {
    expect(ids(issues)).toEqual(ids(PDD.issues));
    expect(issues.map((i) => [i.state, i.priority, i.dueDate, i.projectId, i.cycleId, i.labels, i.commentCount])).toEqual(JSON.parse(JSON.stringify(PDD.issues.map((i: any) => [i.state, i.priority, i.dueDate, i.projectId, i.cycleId, i.labels, i.commentCount]))));
  });

  it('buckets, urgency sort and attention', () => {
    expect(issues.map(P.bucketOf)).toEqual(PDD.issues.map(PDD.bucketOf));
    expect(ids([...issues].sort(P.byUrgency))).toEqual(ids([...PDD.issues].sort(PDD.byUrgency)));
    const a = P.attentionItems(issues).map((x) => [x.issue.identifier, x.reason, x.tone]);
    const b = PDD.attentionItems(PDD.issues).map((x: any) => [x.issue.identifier, x.reason, x.tone]);
    expect(a).toEqual(JSON.parse(JSON.stringify(b)));
  });

  it('issue ↔ Figma links (attachment or ID in file name, never fuzzy)', () => {
    const mine = P.linkDesigns(issues, sampleFigmaFiles());
    const ref = PDD.linkDesigns(PDD.issues, PDD.figmaFiles);
    for (const i of issues) {
      const r = PDD.issues.find((x: any) => x.identifier === i.identifier);
      expect(mine.get(i.id)!.map((l) => [l.file.key, l.via])).toEqual(JSON.parse(JSON.stringify(ref.get(r.id).map((l: any) => [l.file.key, l.via]))));
    }
  });

  it('reading matches', () => {
    for (const i of issues) {
      const r = PDD.issues.find((x: any) => x.identifier === i.identifier);
      const p = projects.find((x) => x.id === i.projectId);
      const rp = PDD.projects.find((x: any) => x.id === r.projectId);
      expect(P.relatedArticles(i, p, articles, 4).map((m) => [m.article.id, m.score, m.because])).toEqual(JSON.parse(JSON.stringify(PDD.relatedArticles(r, rp, PDD.starterLibrary().articles, 4).map((m: any) => [m.article.id, m.score, m.because]))));
    }
    expect(P.readingForActiveWork(issues, projects, articles, 3).map((m) => [m.article.id, m.issue.identifier])).toEqual(JSON.parse(JSON.stringify(PDD.readingForActiveWork(PDD.issues, PDD.projects, PDD.starterLibrary().articles, 3).map((m: any) => [m.article.id, m.issue.identifier]))));
  });

  it('library queries', () => {
    const lib = PDD.starterLibrary();
    const queries = [
      { view: 'all', sort: 'newest' }, { view: 'to-read', sort: 'title' }, { view: 'favorites', sort: 'oldest' }, { view: 'reading', sort: 'status' },
      { view: 'all', topic: 'ux' }, { view: 'all', collection: 'col-ds' }, { view: 'all', status: 'read' }, { view: 'all', project: 'prj-ai' },
      { view: 'all', saved: 'recent' }, { view: 'all', source: 'src-nng', sources: lib.sources }, { view: 'all', search: '#ai trust' }, { view: 'all', search: 'design system', sort: 'status' },
    ];
    for (const q of queries) expect(P.queryLibrary(articles, { ...q, sources: P.seedSources() }).map((a) => a.id)).toEqual(Array.from(PDD.queryLibrary(lib.articles, q).map((a: any) => a.id)));
  });
});

describe('pdd-figma.js parity', () => {
  // Real page list of LEX-UI-100 - App shell, read through the Figma connector on 26 Oct 2026.
  const pages = [['60:4449', 'Cover'], ['4414:91123', 'Index'], ['621:2842', 'Showcase'], ['3313:42557', '---'], ['4165:12867', 'HEADER'], ['0:1', '↳ Search'], ['4657:40103', '↳ Search v2'], ['4210:2254', '↳ Invite members'], ['4263:6042', '↳ Notification'], ['4165:12870', '---'], ['4165:12869', 'NAVIGATION BAR'], ['4378:38033', '↳ Responsive'], ['4378:38034', '↳ Workspace switcher (TBD)'], ['1633:32029', '↳ Create button'], ['332:33371', '---'], ['1087:46578', 'COMPONENTS'], ['4245:130346', '↳ App shell'], ['4414:91124', 'ARCHIVE'], ['4142:39715', '↳ Draft']].map(([id, name]) => ({ id, name }));
  const skip = { enabled: true, groups: [...F.SKIP_GROUPS] };

  it('buildIndex groups only by real separator pages', () => {
    expect(F.buildIndex(pages, skip)).toEqual(JSON.parse(JSON.stringify(FIG.buildIndex(pages, skip))));
    expect(F.buildIndex(pages, { enabled: false, groups: [] })).toEqual(JSON.parse(JSON.stringify(FIG.buildIndex(pages, { enabled: false, groups: [] }))));
  });

  it('URL parsing, validation, library kinds', () => {
    const urls = ['https://www.figma.com/design/krm4WJTS0t9yzB7V7bUWVL/LEX-UI-100---App-shell?m=auto&node-id=60-4449', 'https://www.figma.com/files/team/1014494708155772450/folder/673533984?fuid=1', 'https://example.com/x', 'https://www.figma.com/proto/abcdefghijkl/Proto'];
    for (const u of urls) expect(F.parseFigmaUrl(u)).toEqual(JSON.parse(JSON.stringify(FIG.parseFigmaUrl(u))));
    const files = F.SCOPE_FILES.map((f) => F.newFile(f));
    for (const form of [{ url: '', name: '' }, { url: urls[0], name: 'x' }, { url: urls[1], name: 'x' }, { url: urls[3], name: '' }]) {
      const { parsed: _a, ...mine } = F.validateAdd(form, files); const { parsed: _b, ...ref } = FIG.validateAdd(form, files);
      expect(mine).toEqual(ref);
    }
    for (const n of ['DS-shadcn-Core', 'ds-shadcn-icons', 'LEX Components library', 'LEX UI kit', 'Random']) expect(F.libraryKind(n)).toBe(FIG.libraryKind(n));
    expect(F.SCOPE_FILES).toEqual(JSON.parse(JSON.stringify(FIG.SCOPE_FILES)));
  });
});
