/* Business rules, selectors and view-models — ported 1:1 from design/pdd-data.js.
   Function names match the design file so a rule change in Claude Design is easy to find here.
   Sample Linear/Figma data does NOT live here; it is in src/data/sample.ts behind a dev flag. */
import { daysAgo, daysUntil, formatDue, formatShort, timeAgo } from '../lib/dates';
import type {
  Article, Collection, Cycle, DesignLinkMatch, FigmaFile, IntegrationStatus, Issue, Library, Project, Source, TopicId, Viewer, WorkspaceLinks,
} from '../data/types';

const DAY = 86400000;

// ─── Storybook taxonomy + seed ───
export const TOPICS: { id: TopicId; name: string }[] = [
  { id: 'ux', name: 'UX' }, { id: 'ui', name: 'UI' }, { id: 'product-design', name: 'Product design' },
  { id: 'design-systems', name: 'Design systems' }, { id: 'ai-in-design', name: 'AI in design' },
  { id: 'research', name: 'Research' }, { id: 'product-thinking', name: 'Product thinking' },
];
export const topicName = (id: string) => TOPICS.find((t) => t.id === id)?.name || id;
export const DEFAULT_COLLECTIONS: Collection[] = [{ id: 'col-ai', name: 'Lumin AI references' }, { id: 'col-ds', name: 'DS v3 prep' }, { id: 'col-research', name: 'Research toolkit' }];
export const STATUS_LABEL = { 'to-read': 'To read', reading: 'Reading', read: 'Read' } as const;
export const SOURCE_CATEGORIES = ['Release notes', 'Blog', 'Newsletter', 'Publication', 'Research', 'Website'] as const;

const isoHoursAgo = (h: number) => new Date(Date.now() - h * 3600000).toISOString();
const SRC = (id: string, name: string, url: string, category: Source['category'], hours: number, enabled: boolean): Source => ({ id, name, url, category, updatedAt: isoHoursAgo(hours), enabled });
export const seedSources = (): Source[] => [
  SRC('src-figma', 'Figma Release Notes', 'https://www.figma.com/release-notes/feed/atom.xml', 'Release notes', 3, true),
  SRC('src-nng', 'Nielsen Norman Group', 'https://www.nngroup.com/feed/rss/', 'Publication', 20, true),
  SRC('src-producttalk', 'Product Talk', 'https://www.producttalk.org/feed/', 'Blog', 50, true),
  SRC('src-msr', 'Microsoft Research', 'https://www.microsoft.com/en-us/research/feed/', 'Research', 30, true),
  SRC('src-pair', 'Google PAIR', 'https://pair.withgoogle.com/', 'Website', 24 * 9, true),
  SRC('src-lawsofux', 'Laws of UX', 'https://lawsofux.com/', 'Website', 24 * 20, false),
];

export const hostOf = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; } };
export function matchSource(a: Pick<Article, 'url'>, s: Pick<Source, 'url'>) { const ah = hostOf(a.url), sh = hostOf(s.url); return !!ah && !!sh && (ah === sh || ah.endsWith('.' + sh) || sh.endsWith('.' + ah)); }
export const sourceOf = (a: Article, sources: Source[]) => sources.find((s) => matchSource(a, s)) || null;

type Seed = [string, string, string, string, string, TopicId, string, string, string[], number, Article['status'], boolean, string[], string[]];
const A = ([id, title, url, author, publication, topic, summary, notes, tags, d, status, favorite, rel, cols]: Seed): Article => ({ id, title, url, author, publication, topic, summary, notes, tags, savedAt: daysAgo(d), status, favorite, relatedProjectIds: rel, collectionIds: cols });
// Starter library: real references. The project ids are from the old sample Linear data, so they only match in sample mode.
export const seedArticles = (): Article[] => ([
  ['a-human-ai', 'Guidelines for Human-AI Interaction', 'https://www.microsoft.com/en-us/research/project/guidelines-for-human-ai-interaction/', 'Amershi et al.', 'Microsoft Research', 'ai-in-design', '18 research-backed guidelines for how AI features should behave, from setting expectations up front to handling mistakes and learning over time.', 'Use as a checklist for the Summarize panel error states (G9–G11).', ['ai', 'guidelines', 'states', 'trust'], 0, 'to-read', false, ['prj-ai'], ['col-ai']],
  ['a-tokens', 'Design Tokens Format Module', 'https://design-tokens.github.io/community-group/format/', 'Design Tokens Community Group', 'W3C Community Group', 'design-systems', 'A draft spec for a shared, tool-agnostic JSON format for design tokens, so values move cleanly between design tools and code.', '', ['design-system', 'tokens', 'standards'], 1, 'reading', true, ['prj-ds3'], ['col-ds']],
  ['a-heuristics', '10 Usability Heuristics for User Interface Design', 'https://www.nngroup.com/articles/ten-usability-heuristics/', 'Jakob Nielsen', 'Nielsen Norman Group', 'ux', 'Ten broad rules of thumb for interaction design. A fast checklist for heuristic reviews before a usability test.', 'Ran these against the merge flow before the test sessions.', ['heuristics', 'evaluation', 'ux', 'usability-testing'], 3, 'read', true, ['prj-activation'], ['col-research']],
  ['a-cdh', 'Continuous Discovery Habits', 'https://www.producttalk.org/', 'Teresa Torres', 'Product Talk', 'research', 'Weekly customer touchpoints and opportunity solution trees as a way to keep product decisions tied to evidence.', '', ['discovery', 'interviews', 'research'], 5, 'to-read', false, ['prj-activation'], ['col-research']],
  ['a-pair', 'People + AI Guidebook', 'https://pair.withgoogle.com/guidebook/', 'PAIR team', 'Google', 'ai-in-design', 'Patterns and worksheets for human-centred AI products: mental models, explainability, feedback and user control.', 'The "Explainability + Trust" chapter is relevant for citation chips.', ['ai', 'patterns', 'trust'], 7, 'to-read', true, ['prj-ai'], ['col-ai']],
  ['a-atomic', 'Atomic Design', 'https://atomicdesign.bradfrost.com/', 'Brad Frost', 'Self-published', 'design-systems', 'Building interfaces from atoms up to pages. A shared vocabulary for structuring a component library.', '', ['design-system', 'components', 'methodology'], 10, 'read', true, ['prj-ds3'], ['col-ds']],
  ['a-jtbd', 'Know Your Customers’ “Jobs to Be Done”', 'https://hbr.org/2016/09/know-your-customers-jobs-to-be-done', 'Clayton M. Christensen et al.', 'Harvard Business Review', 'product-thinking', 'Customers “hire” products to make progress in a specific circumstance; innovation should start from understanding that job.', '', ['jtbd', 'strategy', 'onboarding'], 12, 'to-read', false, ['prj-activation'], []],
  ['a-shapeup', 'Shape Up', 'https://basecamp.com/shapeup', 'Ryan Singer', 'Basecamp', 'product-thinking', 'Shaping work before building it, with fixed six-week cycles and an appetite for scope instead of estimates.', '', ['process', 'scoping'], 14, 'reading', false, [], []],
  ['a-inclusive', 'Inclusive Components', 'https://inclusive-components.design/', 'Heydon Pickering', 'Inclusive Components', 'ui', 'Deep dives into common components (toggles, menus, tabs, cards) and how to make each accessible by default.', 'Check the form/toggle chapters before the DS v3 forms audit.', ['accessibility', 'components', 'forms'], 16, 'to-read', false, ['prj-ds3'], ['col-ds']],
  ['a-refactoring', 'Refactoring UI', 'https://www.refactoringui.com/', 'Adam Wathan & Steve Schoger', 'Refactoring UI', 'ui', 'Practical tactics for hierarchy, spacing, colour and depth, written for people who build interfaces.', '', ['hierarchy', 'visual-design', 'tables', 'ui'], 20, 'read', false, [], []],
  ['a-doet', 'The Design of Everyday Things', 'https://en.wikipedia.org/wiki/The_Design_of_Everyday_Things', 'Don Norman', 'Basic Books', 'product-design', 'The classic on affordances, signifiers, mapping and feedback, and why good design makes the right action obvious.', '', ['affordances', 'interaction', 'classics'], 22, 'read', true, [], []],
  ['a-momtest', 'The Mom Test', 'https://www.momtestbook.com/', 'Rob Fitzpatrick', 'Self-published', 'research', 'How to ask customer questions that even people trying to be nice can’t mislead you with.', '', ['interviews', 'validation', 'research'], 24, 'to-read', false, [], ['col-research']],
  ['a-lawsofux', 'Laws of UX', 'https://lawsofux.com/', 'Jon Yablonski', 'lawsofux.com', 'ux', 'Psychological principles such as Hick’s, Fitts’s and Jakob’s law, each with examples of how it shapes interfaces.', 'Fitts’s law → mobile field placement targets.', ['psychology', 'principles', 'mobile', 'interaction'], 28, 'to-read', false, ['prj-sign-share'], []],
] as Seed[]).map(A);

export const starterLibrary = (): Library => ({ articles: seedArticles(), collections: DEFAULT_COLLECTIONS.map((c) => ({ ...c })), sources: seedSources() });

// ─── selectors ───
export type Bucket = 'in-progress' | 'in-review' | 'up-next' | 'done';
export function bucketOf(issue: Pick<Issue, 'state'>): Bucket {
  const { type, name } = issue.state;
  if (type === 'completed' || type === 'canceled') return 'done';
  if (type === 'started') return /review/i.test(name) ? 'in-review' : 'in-progress';
  return 'up-next';
}
export const isOpen = (i: Pick<Issue, 'state'>) => bucketOf(i) !== 'done';
export const BUCKET_LABEL: Record<Bucket, string> = { 'in-progress': 'In progress', 'in-review': 'In review', 'up-next': 'Up next', done: 'Done' };
export const PRIORITY_LABEL = ['No priority', 'Urgent', 'High', 'Medium', 'Low'];
export const PRIORITY_ICON = ['DotsThree', 'Warning', 'ArrowUp', 'Minus', 'ArrowDown'] as const;
export type PriorityIconName = (typeof PRIORITY_ICON)[number];

export function byUrgency(a: Issue, b: Issue) {
  const da = a.dueDate ? daysUntil(a.dueDate) : 999, db = b.dueDate ? daysUntil(b.dueDate) : 999;
  const oa = da < 0 ? 0 : 1, ob = db < 0 ? 0 : 1;
  if (oa !== ob) return oa - ob;
  const pa = a.priority === 0 ? 5 : a.priority, pb = b.priority === 0 ? 5 : b.priority;
  if (pa !== pb) return pa - pb;
  return da - db;
}
export const byUpdated = (a: Issue, b: Issue) => b.updatedAt.localeCompare(a.updatedAt);

export type AttentionTone = 'critical' | 'warning' | 'info';
export interface AttentionItem { issue: Issue; reason: string; tone: AttentionTone }
export function attentionItems(list: Issue[]): AttentionItem[] {
  const out: AttentionItem[] = [];
  for (const issue of list.filter(isOpen)) {
    const d = issue.dueDate ? daysUntil(issue.dueDate) : null;
    if (d !== null && d < 0) out.push({ issue, reason: `Overdue by ${-d} day${d === -1 ? '' : 's'}`, tone: 'critical' });
    else if (d === 0) out.push({ issue, reason: 'Due today', tone: 'warning' });
    else if (issue.priority === 1) out.push({ issue, reason: d === 1 ? 'Urgent · due tomorrow' : 'Urgent', tone: 'warning' });
    else if (d === 1) out.push({ issue, reason: 'Due tomorrow', tone: 'warning' });
    else if (bucketOf(issue) === 'in-review' && issue.commentCount > 0) out.push({ issue, reason: `${issue.commentCount} comments in review`, tone: 'info' });
  }
  const rank = { critical: 0, warning: 1, info: 2 };
  return out.sort((a, b) => rank[a.tone] - rank[b.tone] || byUrgency(a.issue, b.issue));
}

export const figmaKeyFromUrl = (u: string) => { const m = /figma\.com\/(?:design|file|proto)\/([A-Za-z0-9]+)/.exec(u); return m ? m[1] : null; };
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Issue → Figma: only a Figma attachment on the issue, or the identifier as a whole word in the file name. Never fuzzy. */
export function linkDesigns(list: Issue[], files: FigmaFile[]) {
  const byKey = new Map(files.map((f) => [f.key, f]));
  const map = new Map<string, DesignLinkMatch[]>();
  for (const issue of list) {
    const links: DesignLinkMatch[] = [];
    for (const a of issue.attachments) { const k = figmaKeyFromUrl(a.url); const f = k && byKey.get(k); if (f && !links.some((l) => l.file.key === f.key)) links.push({ file: f, via: 'attachment' }); }
    const re = new RegExp(`\\b${escapeRe(issue.identifier)}\\b`, 'i');
    for (const f of files) if (re.test(f.name) && !links.some((l) => l.file.key === f.key)) links.push({ file: f, via: 'name' });
    map.set(issue.id, links);
  }
  return map;
}
export function issuesByFile(links: Map<string, DesignLinkMatch[]>, list: Issue[]) {
  const byId = new Map(list.map((i) => [i.id, i]));
  const out = new Map<string, Issue[]>();
  links.forEach((ls, id) => { const is = byId.get(id); if (!is) return; ls.forEach((l) => out.set(l.file.key, [...(out.get(l.file.key) || []), is])); });
  return out;
}

const norm = (s: string) => s.toLowerCase().replace(/[\s_]+/g, '-');
export interface ReadingMatch { article: Article; score: number; because: string }
export function relatedArticles(issue: Issue, project: Project | null | undefined, articles: Article[], limit = 3): ReadingMatch[] {
  const labels = new Set(issue.labels.map(norm));
  return articles.map((article) => {
    let score = 0; const reasons: string[] = [];
    if (issue.projectId && article.relatedProjectIds.includes(issue.projectId)) { score += 3; reasons.push(project ? project.name : 'Same project'); }
    const shared = article.tags.map(norm).filter((t) => labels.has(t));
    if (shared.length) { score += shared.length * 2; reasons.push(shared.map((t) => `#${t}`).join(' ')); }
    if (project && project.topics.includes(article.topic)) score += 1;
    return { article, score, because: reasons.join(' · ') };
  }).filter((r) => r.score >= 2 && r.because).sort((a, b) => b.score - a.score || (a.article.status === 'to-read' ? -1 : 1)).slice(0, limit);
}
export function readingForActiveWork(list: Issue[], projs: Project[], articles: Article[], limit = 3) {
  const pById = new Map(projs.map((p) => [p.id, p]));
  const active = list.filter((i) => ['in-progress', 'in-review'].includes(bucketOf(i))).sort(byUrgency);
  const seen = new Set<string>(); const out: (ReadingMatch & { issue: Issue })[] = [];
  for (const issue of active) for (const r of relatedArticles(issue, pById.get(issue.projectId || ''), articles, 5)) {
    if (seen.has(r.article.id) || r.article.status === 'read') continue;
    seen.add(r.article.id); out.push({ ...r, issue });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}

export const RECENT_DAYS = 14;
export function matchesView(a: Article, view: string) {
  if (view === 'recent') return Date.now() - new Date(a.savedAt).getTime() <= RECENT_DAYS * DAY;
  if (view === 'to-read') return a.status === 'to-read';
  if (view === 'reading') return a.status === 'reading';
  if (view === 'favorites') return a.favorite;
  return true;
}
const STATUS_ORDER = { reading: 0, 'to-read': 1, read: 2 };
export interface LibraryQuery { view: string; topic?: string | null; collection?: string | null; status?: string | null; project?: string | null; source?: string | null; saved?: string | null; sources?: Source[]; search?: string; sort?: string }
export function queryLibrary(articles: Article[], q: LibraryQuery) {
  const s = (q.search || '').trim().toLowerCase();
  const list = articles.filter((a) => {
    if (!matchesView(a, q.view)) return false;
    if (q.topic && a.topic !== q.topic) return false;
    if (q.collection && !a.collectionIds.includes(q.collection)) return false;
    if (q.status && a.status !== q.status) return false;
    if (q.project && !a.relatedProjectIds.includes(q.project)) return false;
    if (q.saved === 'recent' && !matchesView(a, 'recent')) return false;
    if (q.source) { const src = (q.sources || []).find((x) => x.id === q.source); if (!src || !matchSource(a, src)) return false; }
    if (s) { const hay = [a.title, a.author, a.publication, a.summary, a.notes, a.tags.join(' ')].join(' ').toLowerCase(); if (!s.split(/\s+/).every((w) => hay.includes(w.replace(/^#/, '')))) return false; }
    return true;
  });
  const out = [...list];
  if (q.sort === 'oldest') out.sort((a, b) => a.savedAt.localeCompare(b.savedAt));
  else if (q.sort === 'title') out.sort((a, b) => a.title.localeCompare(b.title));
  else if (q.sort === 'status') out.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.savedAt.localeCompare(a.savedAt));
  else out.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  return out;
}

// ─── context + view-models ───
export interface Ctx {
  issues: Issue[];
  projects: Project[];
  cycle: Cycle | null;
  figmaFiles: FigmaFile[];
  library: Library;
  projectById: Map<string, Project>;
  designLinks: Map<string, DesignLinkMatch[]>;
  fileIssues: Map<string, Issue[]>;
  integrations: { linear: IntegrationStatus; figma: IntegrationStatus };
  links: WorkspaceLinks;
  viewer: Viewer;
}
export function ctx(input: { issues: Issue[]; projects: Project[]; cycle: Cycle | null; figmaFiles: FigmaFile[]; library: Library; integrations: Ctx['integrations']; links: WorkspaceLinks; viewer: Viewer }): Ctx {
  const projectById = new Map(input.projects.map((p) => [p.id, p]));
  const designLinks = linkDesigns(input.issues, input.figmaFiles);
  return { ...input, projectById, designLinks, fileIssues: issuesByFile(designLinks, input.issues) };
}

const DUE_COLOR = { overdue: 'var(--destructive)', soon: 'var(--custom-amber-900-dark-amber-50)', normal: 'var(--muted-foreground)', none: 'var(--muted-foreground)' };
export function issueVM(i: Issue, c: Ctx) {
  const b = bucketOf(i), due = formatDue(i.dueDate), dc = (c.designLinks.get(i.id) || []).length, p = i.projectId ? c.projectById.get(i.projectId) : null;
  return {
    id: i.id, identifier: i.identifier, title: i.title, description: i.description, url: i.url,
    bucket: b, bucketLabel: BUCKET_LABEL[b], stateName: i.state.name,
    priority: i.priority, priorityLabel: PRIORITY_LABEL[i.priority], priorityIcon: PRIORITY_ICON[i.priority],
    priorityColor: i.priority === 1 ? 'var(--destructive)' : i.priority === 2 ? 'var(--foreground)' : 'var(--muted-foreground)',
    dueText: due.text, dueTone: due.tone, dueColor: DUE_COLOR[due.tone], dueWeight: due.tone === 'overdue' || due.tone === 'soon' ? 600 : 400,
    designCount: dc, hasDesign: dc > 0, designLabel: dc === 0 ? 'No design' : dc === 1 ? 'Design' : `${dc} designs`,
    projectName: p ? p.name : '—', hasProject: !!p, updated: timeAgo(i.updatedAt), labels: i.labels, commentCount: i.commentCount,
  };
}
export type IssueVM = ReturnType<typeof issueVM>;

export function articleVM(a: Article, c: Pick<Ctx, 'projectById' | 'library'>) {
  const p = a.relatedProjectIds.map((id) => c.projectById.get(id)).find(Boolean);
  return {
    id: a.id, title: a.title, url: a.url, author: a.author, publication: a.publication,
    byline: a.author + (a.publication && a.publication !== a.author ? ` · ${a.publication}` : ''),
    topic: a.topic, topicName: topicName(a.topic), summary: a.summary, hasSummary: !!a.summary, notes: a.notes,
    tags: a.tags.slice(0, 2).map((t) => `#${t}`), hasTags: a.tags.length > 0, allTags: a.tags.map((t) => `#${t}`),
    tagLine: a.tags.slice(0, 2).map((t) => `#${t}`).join('  ') + (a.tags.length > 2 ? `  +${a.tags.length - 2}` : ''),
    sourceName: sourceOf(a, c.library.sources)?.name || '',
    hoverMeta: `Saved ${formatShort(a.savedAt)}` + (p ? ` · ${p.name}` : ''),
    saved: formatShort(a.savedAt), savedAgo: timeAgo(a.savedAt), status: a.status, statusLabel: STATUS_LABEL[a.status],
    favorite: a.favorite, projectName: p ? p.name : '', hasProject: !!p,
  };
}
export type ArticleVM = ReturnType<typeof articleVM>;

export const frameUrl = (file: { url: string }, nodeId: string) => `${file.url}?node-id=${encodeURIComponent(nodeId.replace(':', '-'))}`;
export function fileVM(f: FigmaFile, c: Ctx, idx: number) {
  const is = c.fileIssues.get(f.key) || [];
  return {
    key: f.key, name: f.name, url: f.url, thumbnailUrl: f.thumbnailUrl, sub: `${f.projectName} · edited ${timeAgo(f.lastModified)}`, edited: timeAgo(f.lastModified),
    issues: is.map((i) => ({ identifier: i.identifier, title: i.title })), linked: is.length > 0,
    wireW: `${[58, 44, 70, 52][idx % 4]}%`, frames: f.frames.map((fr) => ({ name: fr.name, url: frameUrl(f, fr.nodeId) })),
  };
}
export type FileVM = ReturnType<typeof fileVM>;

export function projectVM(p: Project, c: Ctx) {
  const open = c.issues.filter(isOpen).filter((i) => i.projectId === p.id).length;
  return { id: p.id, name: p.name, role: p.role, url: p.url, target: p.targetDate ? `Target ${formatShort(p.targetDate)}` : 'No target', pct: Math.round(p.progress * 100), pctLabel: `${Math.round(p.progress * 100)}% complete`, openLabel: `${open} open ${open === 1 ? 'issue' : 'issues'}`, openCount: open };
}
export type ProjectVM = ReturnType<typeof projectVM>;
