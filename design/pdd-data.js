/* Product Design Dashboard — data, selectors and view-models.
   Ported 1:1 from the Cowork build (src/data, src/state/selectors.ts, src/lib/dates.ts).
   Linear + Figma are SAMPLE data (dates relative to today). Storybook persists to localStorage. */
(function () {
  const DAY = 86400000;
  // ─── dates ───
  const startOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const isoDateFromToday = (n) => { const d = startOfDay(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const isoHoursAgo = (h) => new Date(Date.now() - h * 3600000).toISOString();
  const daysAgo = (n) => new Date(Date.now() - n * DAY).toISOString();
  const parseDate = (iso) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso));
  const daysUntil = (iso) => Math.round((startOfDay(parseDate(iso)).getTime() - startOfDay().getTime()) / DAY);
  const fShort = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
  const fLong = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const formatShort = (iso) => fShort.format(parseDate(iso));
  const formatLong = (d = new Date()) => fLong.format(d);
  function formatDue(iso) {
    if (!iso) return { text: 'No date', tone: 'none' };
    const n = daysUntil(iso);
    if (n < 0) return { text: n === -1 ? 'Overdue 1d' : `Overdue ${-n}d`, tone: 'overdue' };
    if (n === 0) return { text: 'Today', tone: 'soon' };
    if (n === 1) return { text: 'Tomorrow', tone: 'soon' };
    return { text: formatShort(iso), tone: 'normal' };
  }
  function timeAgo(iso) {
    const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.round(h / 24);
    if (d === 1) return 'yesterday';
    if (d < 7) return `${d}d ago`;
    return formatShort(iso);
  }
  const greeting = (d = new Date()) => { const h = d.getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

  // ─── config ───
  const config = {
    owner: { name: 'Thư', role: 'Product Designer', team: 'Lumin' },
    links: {
      myIssues: 'https://linear.app/your-workspace/my-issues/assigned',
      activeCycle: 'https://linear.app/your-workspace/team/DES/active',
      inbox: 'https://linear.app/your-workspace/inbox',
      figmaRecents: 'https://www.figma.com/files/recents-and-sharing',
    },
  };
  const base = 'https://linear.app/your-workspace';
  const integrations = {
    linear: { id: 'linear', name: 'Linear', mode: 'sample', label: 'Sample data' },
    figma: { id: 'figma', name: 'Figma', mode: 'sample', label: 'Sample data' },
  };

  // ─── Figma sample ───
  const K = { share: 'SAMPLEshare01', esign: 'SAMPLEesign02', ai: 'SAMPLEai03', empty: 'SAMPLEempty04', forms: 'SAMPLEforms05', icons: 'SAMPLEicons06' };
  const furl = (k, s) => `https://www.figma.com/design/${k}/${s}`;
  const figmaFiles = [
    { key: K.share, name: 'Share dialog — permissions v4', projectName: 'Sign & Share', lastModified: isoHoursAgo(2), url: furl(K.share, 'Share-dialog'), frames: [{ nodeId: '12:340', name: 'Dialog / Default' }, { nodeId: '12:512', name: 'Dialog / Link settings' }, { nodeId: '14:88', name: 'Downgrade warning' }] },
    { key: K.esign, name: 'eSign mobile — field placement', projectName: 'Sign & Share', lastModified: isoHoursAgo(20), url: furl(K.esign, 'eSign-mobile'), frames: [{ nodeId: '3:20', name: 'Field tray' }, { nodeId: '3:118', name: 'Zoomed placement' }] },
    { key: K.ai, name: 'DES-230 Lumin AI — Summarize states', projectName: 'Lumin AI', lastModified: isoHoursAgo(28), url: furl(K.ai, 'Summarize-states'), frames: [{ nodeId: '1:4', name: 'Loading' }, { nodeId: '1:90', name: 'Error / Rate limit' }, { nodeId: '1:160', name: 'Scanned PDF' }] },
    { key: K.empty, name: 'DES-198 Documents — empty states', projectName: 'Activation', lastModified: isoHoursAgo(7), url: furl(K.empty, 'Empty-states'), frames: [{ nodeId: '8:2', name: 'New account' }, { nodeId: '8:40', name: 'No results' }] },
    { key: K.forms, name: 'DS v3 — Form fields audit', projectName: 'Design System', lastModified: isoHoursAgo(98), url: furl(K.forms, 'Form-audit'), frames: [{ nodeId: '2:1', name: 'Inventory' }] },
    { key: K.icons, name: 'Annotation icons — 20px grid', projectName: 'Design System', lastModified: isoHoursAgo(50), url: furl(K.icons, 'Annotation-icons'), frames: [{ nodeId: '5:10', name: 'Toolbar set' }] },
  ];
  const frameUrl = (file, nodeId) => `${file.url}?node-id=${encodeURIComponent(nodeId.replace(':', '-'))}`;
  const figmaKeyFromUrl = (u) => { const m = /figma\.com\/(?:design|file|proto)\/([A-Za-z0-9]+)/.exec(u); return m ? m[1] : null; };

  // ─── Linear sample ───
  const cycle = { id: 'cyc-42', number: 42, name: 'Cycle 42', startsAt: isoDateFromToday(-8), endsAt: isoDateFromToday(6), progress: 0.58, url: `${base}/team/DES/active` };
  const projects = [
    { id: 'prj-sign-share', name: 'Sign & Share 2.0', url: `${base}/project/sign-and-share-2`, progress: 0.62, targetDate: isoDateFromToday(23), lead: 'You', role: 'Lead', topics: ['ux', 'ui', 'product-design'] },
    { id: 'prj-ai', name: 'Lumin AI Assistant', url: `${base}/project/lumin-ai-assistant`, progress: 0.38, targetDate: isoDateFromToday(44), lead: 'Product lead', role: 'Contributor', topics: ['ai-in-design', 'ux'] },
    { id: 'prj-ds3', name: 'Design System v3', url: `${base}/project/design-system-v3`, progress: 0.24, targetDate: isoDateFromToday(80), lead: 'Design lead', role: 'Contributor', topics: ['design-systems', 'ui'] },
    { id: 'prj-activation', name: 'Activation & Onboarding', url: `${base}/project/activation`, progress: 0.15, targetDate: isoDateFromToday(37), lead: 'Growth PM', role: 'Contributor', topics: ['research', 'product-thinking', 'ux'] },
  ];
  const att = (key, title) => ({ id: `att-${key}`, title, url: `https://www.figma.com/design/${key}/sample`, sourceType: 'figma' });
  const S = (name, type) => ({ name, type });
  const seeds = [
    ['DES-214', 'Share dialog: permission levels & link settings', 'Redesign the share dialog so viewers, commenters and editors are clear at a glance. Include link expiry and "anyone with the link" states, and the downgrade warning when removing edit access.', S('In Progress', 'started'), 2, 1, 2, 'prj-sign-share', 'cyc-42', ['ux', 'permissions', 'sharing'], [att(K.share, 'Share dialog — permissions v4')], 6],
    ['DES-221', 'eSign: signer field placement on mobile', 'Signers on small screens struggle to place signature and date fields precisely. Explore snap-to-line, zoomed placement mode and a field tray. Hand-off needed before the sprint review.', S('In Progress', 'started'), 1, 1, 20, 'prj-sign-share', 'cyc-42', ['mobile', 'esign', 'interaction'], [att(K.esign, 'eSign mobile — field placement')], 3],
    ['DES-230', 'AI Summarize panel: loading, empty and error states', 'Define every non-happy-path state for the Summarize panel: long documents, scanned PDFs without text, rate limits and partial results. Pair with eng on streaming behaviour.', S('In Progress', 'started'), 2, 6, 30, 'prj-ai', 'cyc-42', ['ai', 'states', 'ux'], [], 2],
    ['DES-226', 'Annotation toolbar: icon set refresh', 'Redraw the annotation toolbar icons on the 20px grid with a consistent 1.5px stroke. Check legibility at 16px and in dark mode.', S('In Progress', 'started'), 3, 8, 54, 'prj-ds3', 'cyc-42', ['icons', 'design-system', 'ui'], [], 0],
    ['DES-205', 'Synthesis: PDF merge usability test', 'Synthesise the five moderated sessions on the merge flow. Pull out top issues, severity and recommended changes for the PM review.', S('In Review', 'started'), 2, 0, 4, 'prj-activation', 'cyc-42', ['research', 'usability-testing'], [], 4],
    ['DES-198', 'Documents list empty states', 'Empty states for a new account, an empty folder, no search results and a filtered view with no matches. Each should point to one clear next action.', S('In Review', 'started'), 3, 3, 6, 'prj-activation', 'cyc-42', ['onboarding', 'empty-states', 'ux'], [], 3],
    ['DES-187', 'Billing page: plan comparison table', 'Make plan differences scannable on the billing page. Group features, highlight the current plan, and handle the annual/monthly toggle.', S('Todo', 'unstarted'), 2, -2, 72, null, 'cyc-42', ['pricing', 'ui', 'tables'], [], 1],
    ['DES-233', 'Audit form-field components for DS v3', 'Inventory text fields, selects, date pickers and checkboxes across the app. Note inconsistencies in states, spacing and error messaging; propose the v3 spec.', S('Todo', 'unstarted'), 3, 12, 96, 'prj-ds3', 'cyc-42', ['design-system', 'forms', 'accessibility'], [], 0],
    ['DES-238', 'AI chat: citation and source chips', 'Show where an AI answer came from in the document. Chips should jump to the cited page and highlight the passage.', S('Todo', 'unstarted'), 3, 19, 120, 'prj-ai', null, ['ai', 'trust', 'ui'], [], 1],
    ['DES-236', 'Onboarding checklist v2 explorations', 'Explore three directions for the first-run checklist: task list, guided tour, and contextual nudges. Bring to design crit.', S('Backlog', 'backlog'), 4, 15, 150, 'prj-activation', null, ['onboarding', 'exploration'], [], 0],
    ['DES-241', 'Share: guest access activity log', 'Let owners see who opened, commented on or downloaded a shared document.', S('Backlog', 'backlog'), 4, null, 200, 'prj-sign-share', null, ['sharing', 'permissions'], [], 0],
    ['DES-209', 'Merge flow: file order and preview', 'Drag to reorder files before merging, with page-count preview. Shipped to beta.', S('Done', 'completed'), 3, -3, 26, 'prj-activation', 'cyc-42', ['ux', 'merge'], [], 5],
  ];
  const issues = seeds.map((s, i) => ({
    id: `iss-${i + 1}`, identifier: s[0], title: s[1], description: s[2], state: s[3], priority: s[4],
    dueDate: s[5] === null ? null : isoDateFromToday(s[5]), updatedAt: isoHoursAgo(s[6]), projectId: s[7], cycleId: s[8],
    labels: s[9], attachments: s[10], commentCount: s[11], url: `${base}/issue/${s[0]}`, createdAt: isoHoursAgo(24 * (20 + i)),
  }));

  // ─── Storybook taxonomy + seed ───
  const TOPICS = [
    { id: 'ux', name: 'UX' }, { id: 'ui', name: 'UI' }, { id: 'product-design', name: 'Product design' },
    { id: 'design-systems', name: 'Design systems' }, { id: 'ai-in-design', name: 'AI in design' },
    { id: 'research', name: 'Research' }, { id: 'product-thinking', name: 'Product thinking' },
  ];
  const topicName = (id) => (TOPICS.find((t) => t.id === id) || {}).name || id;
  const DEFAULT_COLLECTIONS = [{ id: 'col-ai', name: 'Lumin AI references' }, { id: 'col-ds', name: 'DS v3 prep' }, { id: 'col-research', name: 'Research toolkit' }];
  const STATUS_LABEL = { 'to-read': 'To read', reading: 'Reading', read: 'Read' };
  const SOURCE_CATEGORIES = ['Release notes', 'Blog', 'Newsletter', 'Publication', 'Research', 'Website'];
  const SRC = (id, name, url, category, hours, enabled) => ({ id, name, url, category, updatedAt: isoHoursAgo(hours), enabled });
  const seedSources = () => [
    SRC('src-figma', 'Figma Release Notes', 'https://www.figma.com/release-notes/feed/atom.xml', 'Release notes', 3, true),
    SRC('src-nng', 'Nielsen Norman Group', 'https://www.nngroup.com/feed/rss/', 'Publication', 20, true),
    SRC('src-producttalk', 'Product Talk', 'https://www.producttalk.org/feed/', 'Blog', 50, true),
    SRC('src-msr', 'Microsoft Research', 'https://www.microsoft.com/en-us/research/feed/', 'Research', 30, true),
    SRC('src-pair', 'Google PAIR', 'https://pair.withgoogle.com/', 'Website', 24 * 9, true),
    SRC('src-lawsofux', 'Laws of UX', 'https://lawsofux.com/', 'Website', 24 * 20, false),
  ];
  const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, '').toLowerCase(); } catch (e) { return ''; } };
  function matchSource(a, s) { const ah = hostOf(a.url), sh = hostOf(s.url); return !!ah && !!sh && (ah === sh || ah.endsWith('.' + sh) || sh.endsWith('.' + ah)); }
  const sourceOf = (a, sources) => (sources || []).find((s) => matchSource(a, s)) || null;
  const A = (id, title, url, author, publication, topic, summary, notes, tags, d, status, favorite, rel, cols) => ({ id, title, url, author, publication, topic, summary, notes, tags, savedAt: daysAgo(d), status, favorite, relatedProjectIds: rel, collectionIds: cols });
  const seedArticles = () => [
    A('a-human-ai', 'Guidelines for Human-AI Interaction', 'https://www.microsoft.com/en-us/research/project/guidelines-for-human-ai-interaction/', 'Amershi et al.', 'Microsoft Research', 'ai-in-design', '18 research-backed guidelines for how AI features should behave, from setting expectations up front to handling mistakes and learning over time.', 'Use as a checklist for the Summarize panel error states (G9–G11).', ['ai', 'guidelines', 'states', 'trust'], 0, 'to-read', false, ['prj-ai'], ['col-ai']),
    A('a-tokens', 'Design Tokens Format Module', 'https://design-tokens.github.io/community-group/format/', 'Design Tokens Community Group', 'W3C Community Group', 'design-systems', 'A draft spec for a shared, tool-agnostic JSON format for design tokens, so values move cleanly between design tools and code.', '', ['design-system', 'tokens', 'standards'], 1, 'reading', true, ['prj-ds3'], ['col-ds']),
    A('a-heuristics', '10 Usability Heuristics for User Interface Design', 'https://www.nngroup.com/articles/ten-usability-heuristics/', 'Jakob Nielsen', 'Nielsen Norman Group', 'ux', 'Ten broad rules of thumb for interaction design. A fast checklist for heuristic reviews before a usability test.', 'Ran these against the merge flow before the test sessions.', ['heuristics', 'evaluation', 'ux', 'usability-testing'], 3, 'read', true, ['prj-activation'], ['col-research']),
    A('a-cdh', 'Continuous Discovery Habits', 'https://www.producttalk.org/', 'Teresa Torres', 'Product Talk', 'research', 'Weekly customer touchpoints and opportunity solution trees as a way to keep product decisions tied to evidence.', '', ['discovery', 'interviews', 'research'], 5, 'to-read', false, ['prj-activation'], ['col-research']),
    A('a-pair', 'People + AI Guidebook', 'https://pair.withgoogle.com/guidebook/', 'PAIR team', 'Google', 'ai-in-design', 'Patterns and worksheets for human-centred AI products: mental models, explainability, feedback and user control.', 'The "Explainability + Trust" chapter is relevant for citation chips.', ['ai', 'patterns', 'trust'], 7, 'to-read', true, ['prj-ai'], ['col-ai']),
    A('a-atomic', 'Atomic Design', 'https://atomicdesign.bradfrost.com/', 'Brad Frost', 'Self-published', 'design-systems', 'Building interfaces from atoms up to pages. A shared vocabulary for structuring a component library.', '', ['design-system', 'components', 'methodology'], 10, 'read', true, ['prj-ds3'], ['col-ds']),
    A('a-jtbd', 'Know Your Customers’ “Jobs to Be Done”', 'https://hbr.org/2016/09/know-your-customers-jobs-to-be-done', 'Clayton M. Christensen et al.', 'Harvard Business Review', 'product-thinking', 'Customers “hire” products to make progress in a specific circumstance; innovation should start from understanding that job.', '', ['jtbd', 'strategy', 'onboarding'], 12, 'to-read', false, ['prj-activation'], []),
    A('a-shapeup', 'Shape Up', 'https://basecamp.com/shapeup', 'Ryan Singer', 'Basecamp', 'product-thinking', 'Shaping work before building it, with fixed six-week cycles and an appetite for scope instead of estimates.', '', ['process', 'scoping'], 14, 'reading', false, [], []),
    A('a-inclusive', 'Inclusive Components', 'https://inclusive-components.design/', 'Heydon Pickering', 'Inclusive Components', 'ui', 'Deep dives into common components (toggles, menus, tabs, cards) and how to make each accessible by default.', 'Check the form/toggle chapters before the DS v3 forms audit.', ['accessibility', 'components', 'forms'], 16, 'to-read', false, ['prj-ds3'], ['col-ds']),
    A('a-refactoring', 'Refactoring UI', 'https://www.refactoringui.com/', 'Adam Wathan & Steve Schoger', 'Refactoring UI', 'ui', 'Practical tactics for hierarchy, spacing, colour and depth, written for people who build interfaces.', '', ['hierarchy', 'visual-design', 'tables', 'ui'], 20, 'read', false, [], []),
    A('a-doet', 'The Design of Everyday Things', 'https://en.wikipedia.org/wiki/The_Design_of_Everyday_Things', 'Don Norman', 'Basic Books', 'product-design', 'The classic on affordances, signifiers, mapping and feedback, and why good design makes the right action obvious.', '', ['affordances', 'interaction', 'classics'], 22, 'read', true, [], []),
    A('a-momtest', 'The Mom Test', 'https://www.momtestbook.com/', 'Rob Fitzpatrick', 'Self-published', 'research', 'How to ask customer questions that even people trying to be nice can’t mislead you with.', '', ['interviews', 'validation', 'research'], 24, 'to-read', false, [], ['col-research']),
    A('a-lawsofux', 'Laws of UX', 'https://lawsofux.com/', 'Jon Yablonski', 'lawsofux.com', 'ux', 'Psychological principles such as Hick’s, Fitts’s and Jakob’s law, each with examples of how it shapes interfaces.', 'Fitts’s law → mobile field placement targets.', ['psychology', 'principles', 'mobile', 'interaction'], 28, 'to-read', false, ['prj-sign-share'], []),
  ];

  // ─── library persistence (localStorage) ───
  const LIB_KEY = 'pdd.claude-design.library.v1';
  const starterLibrary = () => ({ articles: seedArticles(), collections: DEFAULT_COLLECTIONS.map((c) => ({ ...c })), sources: seedSources() });
  function loadLibrary() {
    try { const raw = localStorage.getItem(LIB_KEY); if (raw) { const p = JSON.parse(raw); if (p && Array.isArray(p.articles)) { if (!Array.isArray(p.sources)) p.sources = seedSources(); return p; } } } catch (e) {}
    return starterLibrary();
  }
  function saveLibrary(lib) { try { localStorage.setItem(LIB_KEY, JSON.stringify(lib)); } catch (e) {} }

  // ─── selectors ───
  function bucketOf(issue) {
    const { type, name } = issue.state;
    if (type === 'completed' || type === 'canceled') return 'done';
    if (type === 'started') return /review/i.test(name) ? 'in-review' : 'in-progress';
    return 'up-next';
  }
  const isOpen = (i) => bucketOf(i) !== 'done';
  const BUCKET_LABEL = { 'in-progress': 'In progress', 'in-review': 'In review', 'up-next': 'Up next', done: 'Done' };
  const PRIORITY_LABEL = ['No priority', 'Urgent', 'High', 'Medium', 'Low'];
  const PRIORITY_ICON = ['LuminDS.DotsThreeIcon', 'LuminDS.WarningIcon', 'LuminDS.ArrowUpIcon', 'LuminDS.MinusIcon', 'LuminDS.ArrowDownIcon'];
  function byUrgency(a, b) {
    const da = a.dueDate ? daysUntil(a.dueDate) : 999, db = b.dueDate ? daysUntil(b.dueDate) : 999;
    const oa = da < 0 ? 0 : 1, ob = db < 0 ? 0 : 1;
    if (oa !== ob) return oa - ob;
    const pa = a.priority === 0 ? 5 : a.priority, pb = b.priority === 0 ? 5 : b.priority;
    if (pa !== pb) return pa - pb;
    return da - db;
  }
  const byUpdated = (a, b) => b.updatedAt.localeCompare(a.updatedAt);
  function attentionItems(list) {
    const out = [];
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
  function linkDesigns(list, files) {
    const byKey = new Map(files.map((f) => [f.key, f]));
    const map = new Map();
    for (const issue of list) {
      const links = [];
      for (const a of issue.attachments) { const k = figmaKeyFromUrl(a.url); const f = k && byKey.get(k); if (f) links.push({ file: f, via: 'attachment' }); }
      const re = new RegExp(`\\b${issue.identifier}\\b`, 'i');
      for (const f of files) if (re.test(f.name) && !links.some((l) => l.file.key === f.key)) links.push({ file: f, via: 'name' });
      map.set(issue.id, links);
    }
    return map;
  }
  function issuesByFile(links, list) {
    const byId = new Map(list.map((i) => [i.id, i]));
    const out = new Map();
    links.forEach((ls, id) => { const is = byId.get(id); if (!is) return; ls.forEach((l) => out.set(l.file.key, [...(out.get(l.file.key) || []), is])); });
    return out;
  }
  const norm = (s) => s.toLowerCase().replace(/[\s_]+/g, '-');
  function relatedArticles(issue, project, articles, limit = 3) {
    const labels = new Set(issue.labels.map(norm));
    return articles.map((article) => {
      let score = 0; const reasons = [];
      if (issue.projectId && article.relatedProjectIds.includes(issue.projectId)) { score += 3; reasons.push(project ? project.name : 'Same project'); }
      const shared = article.tags.map(norm).filter((t) => labels.has(t));
      if (shared.length) { score += shared.length * 2; reasons.push(shared.map((t) => `#${t}`).join(' ')); }
      if (project && project.topics.includes(article.topic)) score += 1;
      return { article, score, because: reasons.join(' · ') };
    }).filter((r) => r.score >= 2 && r.because).sort((a, b) => b.score - a.score || (a.article.status === 'to-read' ? -1 : 1)).slice(0, limit);
  }
  function readingForActiveWork(list, projs, articles, limit = 3) {
    const pById = new Map(projs.map((p) => [p.id, p]));
    const active = list.filter((i) => ['in-progress', 'in-review'].includes(bucketOf(i))).sort(byUrgency);
    const seen = new Set(); const out = [];
    for (const issue of active) for (const r of relatedArticles(issue, pById.get(issue.projectId || ''), articles, 5)) {
      if (seen.has(r.article.id) || r.article.status === 'read') continue;
      seen.add(r.article.id); out.push({ article: r.article, issue, because: r.because, score: r.score });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, limit);
  }
  const RECENT_DAYS = 14;
  function matchesView(a, view) {
    if (view === 'recent') return Date.now() - new Date(a.savedAt).getTime() <= RECENT_DAYS * DAY;
    if (view === 'to-read') return a.status === 'to-read';
    if (view === 'reading') return a.status === 'reading';
    if (view === 'favorites') return a.favorite;
    return true;
  }
  const STATUS_ORDER = { reading: 0, 'to-read': 1, read: 2 };
  function queryLibrary(articles, q) {
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

  // ─── view-models (flat, template-ready) ───
  const DUE_COLOR = { overdue: 'var(--destructive)', soon: 'var(--custom-amber-900-dark-amber-50)', normal: 'var(--muted-foreground)', none: 'var(--muted-foreground)' };
  function ctx(library, opts) {
    const figmaOff = opts && opts.figma === 'disconnected';
    const files = figmaOff ? [] : figmaFiles;
    const ints = { linear: integrations.linear, figma: figmaOff ? { id: 'figma', name: 'Figma', mode: 'disconnected', label: 'Not connected' } : integrations.figma };
    const projectById = new Map(projects.map((p) => [p.id, p]));
    const designLinks = linkDesigns(issues, files);
    return { issues, projects, cycle, figmaFiles: files, library, projectById, designLinks, fileIssues: issuesByFile(designLinks, issues), integrations: ints, links: config.links, viewer: config.owner };
  }
  function issueVM(i, c) {
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
  function articleVM(a, c) {
    const p = a.relatedProjectIds.map((id) => c.projectById.get(id)).find(Boolean);
    return {
      id: a.id, title: a.title, url: a.url, author: a.author, publication: a.publication,
      byline: a.author + (a.publication && a.publication !== a.author ? ` · ${a.publication}` : ''),
      topic: a.topic, topicName: topicName(a.topic), summary: a.summary, hasSummary: !!a.summary, notes: a.notes,
      tags: a.tags.slice(0, 2).map((t) => `#${t}`), hasTags: a.tags.length > 0, allTags: a.tags.map((t) => `#${t}`),
      tagLine: a.tags.slice(0, 2).map((t) => `#${t}`).join('  ') + (a.tags.length > 2 ? `  +${a.tags.length - 2}` : ''),
      sourceName: (sourceOf(a, c.library.sources) || {}).name || '',
      hoverMeta: `Saved ${formatShort(a.savedAt)}` + (p ? ` · ${p.name}` : ''),
      saved: formatShort(a.savedAt), savedAgo: timeAgo(a.savedAt), status: a.status, statusLabel: STATUS_LABEL[a.status],
      favorite: a.favorite, projectName: p ? p.name : '', hasProject: !!p,
    };
  }
  function fileVM(f, c, idx) {
    const is = c.fileIssues.get(f.key) || [];
    return {
      key: f.key, name: f.name, url: f.url, sub: `${f.projectName} · edited ${timeAgo(f.lastModified)}`, edited: timeAgo(f.lastModified),
      issues: is.map((i) => ({ identifier: i.identifier, title: i.title })), linked: is.length > 0,
      wireW: `${[58, 44, 70, 52][idx % 4]}%`, frames: f.frames.map((fr) => ({ name: fr.name, url: frameUrl(f, fr.nodeId) })),
    };
  }
  function projectVM(p, c) {
    const open = c.issues.filter(isOpen).filter((i) => i.projectId === p.id).length;
    return { id: p.id, name: p.name, role: p.role, url: p.url, target: p.targetDate ? `Target ${formatShort(p.targetDate)}` : 'No target', pct: Math.round(p.progress * 100), pctLabel: `${Math.round(p.progress * 100)}% complete`, openLabel: `${open} open ${open === 1 ? 'issue' : 'issues'}`, openCount: open };
  }

  window.PDD = {
    config, integrations, SOURCE_CATEGORIES, hostOf, matchSource, sourceOf, issues, projects, cycle, figmaFiles, TOPICS, DEFAULT_COLLECTIONS, STATUS_LABEL, BUCKET_LABEL, PRIORITY_LABEL, RECENT_DAYS,
    dates: { daysUntil, formatShort, formatLong, formatDue, timeAgo, greeting, isoDateFromToday },
    topicName, bucketOf, isOpen, byUrgency, byUpdated, attentionItems, linkDesigns, issuesByFile, relatedArticles, readingForActiveWork, matchesView, queryLibrary, frameUrl,
    loadLibrary, saveLibrary, starterLibrary, ctx, issueVM, articleVM, fileVM, projectVM,
  };
})();
