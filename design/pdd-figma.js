/* Figma files + Directory — data model and service layer.
   The UI talks only to window.PDDFigma. The active adapter is DISCONNECTED: it can't resolve, sync or scan,
   and it never fabricates metadata. Swap in a connected adapter (server route → Figma REST API) via setAdapter().

   Model
   TrackedFile  { key, url, name, role, addedAt, nameSource: 'manual'|'link'|'figma',
                  lastModified|null, pageCount|null, index: Index|null, indexSyncedAt|null,
                  usage: Usage|null, usageScannedAt|null, usageStatus: 'never'|'running'|'ok'|'error', usageError|null }
   Index        { groups: [{ id, name, kind, skipped, pages: [{ id, nodeId, name }] }] }
   Usage        { instances, pagesWithInstances, libraries: [{ fileKey, name, kind: 'current'|'legacy'|'local'|'other',
                  components: [{ key, name, instances, pages: [{ pageId, name, instances }] }] }] }
   DesignLink   { id, fileKey, pageId, pageName, groupName, nodeId|null, frameName|null, issueId,
                  version, history: [{ at, kind: 'version'|'link'|'changelog'|'unlink', text, url? }] }
*/
(function () {
  const KEY = 'pdd.claude-design.figma.v1';
  const ROLES = [
    { id: 'product', label: 'Product file', tone: 'info' },
    { id: 'library', label: 'Component library', tone: 'design' },
    { id: 'foundation', label: 'Design system / Foundation', tone: 'done' },
    { id: 'reference', label: 'Reference file', tone: 'up-next' },
  ];
  const ROLE_BY_ID = Object.fromEntries(ROLES.map((r) => [r.id, r]));
  const SKIP_GROUPS = ['Archive', 'Drafts & explorations', 'Ready to delete', 'Cover', 'Index'];
  // Conventions recognised only when a real page name matches — never inferred from content.
  const GROUP_CONVENTIONS = ['Cover', 'Index', 'Header', 'Search', 'Exploration', 'Navigation', 'Responsive', 'Specs', 'Archive'];
  // Team design scope for New IA (names + links supplied by the team; nothing here comes from Figma).
  const SCOPE_ID = 'new-ia-v1';
  const SCOPE_FILES = [
    ['krm4WJTS0t9yzB7V7bUWVL', 'LEX-UI-100 - App shell', 'LEX-UI-100---App-shell'],
    ['fcRS7wJCNqGZJxEoHEsACZ', 'LEX-UI-101 - Home', 'LEX-UI-101---Home'],
    ['Pqoff1FKr1eYLjWaiKYIUF', 'LEX-UI-102 - Agreements', 'LEX-UI-102---Agreements'],
    ['MsqRS1mg8EI9aK8YQiqK55', 'LEX-UI-103 - Templates', 'LEX-UI-103---Templates'],
    ['K6m0PpCjhmek2gaayf02LP', 'LEX-UI-104 - Document & Space', 'LEX-UI-104---Document---Space'],
    ['UZEz7x1OK8NojgxSWpmlxG', 'LEX-UI-105 - Ask AI', 'LEX-UI-105---Ask-AI'],
  ].map(([key, name, slug]) => ({ key, name, url: `https://www.figma.com/design/${key}/${slug}`, role: 'product', nameSource: 'user', scope: SCOPE_ID }));
  const CURRENT_LIBRARY = [/^DS-shadcn-/i];
  const LEGACY_LIBRARY = [/^LEX\b.*\b(component|components|library|ui kit)\b/i]; // extend later

  function parseFigmaUrl(raw) {
    const url = (raw || '').trim();
    let u; try { u = new URL(url); } catch (e) { return { kind: null }; }
    if (!/(^|\.)figma\.com$/i.test(u.hostname)) return { kind: null };
    const folder = /\/files\/team\/(\d+)\/folder\/(\d+)/.exec(u.pathname);
    if (folder) return { kind: 'folder', teamId: folder[1], folderId: folder[2] };
    if (/\/files\/(team|project)\//.test(u.pathname)) return { kind: 'folder' };
    const f = /^\/(design|file|proto|board|slides)\/([A-Za-z0-9]{10,})(?:\/([^/?#]+))?/.exec(u.pathname);
    if (!f) return { kind: null };
    let slugName = '';
    if (f[3]) { try { slugName = decodeURIComponent(f[3]).replace(/--+/g, ' – ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim(); } catch (e) {} }
    const node = u.searchParams.get('node-id');
    return { kind: 'file', key: f[2], fileType: f[1], slugName, nodeId: node ? node.replace('-', ':') : null, canonical: `https://www.figma.com/${f[1] === 'proto' ? 'design' : f[1]}/${f[2]}` };
  }

  // Groups pages by real separator conventions in the page list (e.g. "HEADER", "—— SEARCH ——",
  // "↳ Invite members" children). If no separators exist, returns one ungrouped bucket.
  function buildIndex(pages, skip) {
    const isSep = (n) => /^[\s\-–—_=*#]*[A-Z0-9][A-Z0-9 &/+]{1,}[\s\-–—_=*#]*$/.test(n) && n === n.toUpperCase();
    const groups = []; let cur = { id: 'ungrouped', name: 'Pages', kind: 'ungrouped', pages: [] };
    for (const p of pages) {
      const name = (p.name || '').trim();
      if (isSep(name) && !/^↳/.test(name)) { if (cur.pages.length || cur.kind !== 'ungrouped') groups.push(cur); const clean = name.replace(/[\-–—_=*#]/g, '').trim(); cur = { id: p.id, name: clean, kind: conventionOf(clean), pages: [] }; continue; }
      cur.pages.push({ id: p.id, nodeId: p.id, name: name.replace(/^↳\s*/, '') });
    }
    groups.push(cur);
    return { groups: groups.filter((g) => g.pages.length || g.kind !== 'ungrouped').map((g) => { const gs = isSkipped(g.name, skip); return { ...g, skipped: gs, pages: g.pages.map((p) => ({ ...p, skipped: gs || isSkipped(p.name, skip) })) }; }) };
  }
  const conventionOf = (name) => (GROUP_CONVENTIONS.find((c) => name.toLowerCase().startsWith(c.toLowerCase())) || 'custom').toLowerCase();
  const isSkipped = (name, skip) => !!(skip && skip.enabled && skip.groups.some((g) => g.toLowerCase() === name.trim().toLowerCase()));
  const libraryKind = (name) => (CURRENT_LIBRARY.some((r) => r.test(name)) ? 'current' : LEGACY_LIBRARY.some((r) => r.test(name)) ? 'legacy' : 'other');

  const NOT_CONNECTED = 'Connect Figma to sync file structure and component usage.';
  const DisconnectedAdapter = {
    mode: 'disconnected', label: 'Not connected', canResolve: false, canSync: false, canScan: false, canListFolder: false, reason: NOT_CONNECTED,
    async resolveFile() { throw new Error(NOT_CONNECTED); },
    async listFolder() { throw new Error('Folders can’t be listed without the Figma connector. Add each file by its link.'); },
    async syncIndex() { throw new Error(NOT_CONNECTED); },   // → { name, lastModified, pages: [{id, name}] }
    async scanUsage() { throw new Error(NOT_CONNECTED); },   // → Usage
  };
  let adapter = DisconnectedAdapter;

  function load() {
    let st = null;
    try { const raw = localStorage.getItem(KEY); if (raw) { const p = JSON.parse(raw); if (p && Array.isArray(p.files)) st = { links: [], skip: { enabled: true, groups: [...SKIP_GROUPS] }, seeded: [], ...p }; } } catch (e) {}
    if (!st) st = { files: [], links: [], skip: { enabled: true, groups: [...SKIP_GROUPS] }, seeded: [] };
    // Seed the team scope once; later removals by the user are respected.
    if (!(st.seeded || []).includes(SCOPE_ID)) {
      const have = new Set(st.files.map((f) => f.key));
      const add = SCOPE_FILES.filter((f) => !have.has(f.key)).map((f) => ({ ...newFile(f), scope: SCOPE_ID }));
      st = { ...st, files: [...st.files, ...add], seeded: [...(st.seeded || []), SCOPE_ID] };
      save(st);
    }
    return st;
  }
  function save(store) { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} }
  function newFile({ key, url, name, role, nameSource }) {
    return { key, url, name, role, nameSource, addedAt: new Date().toISOString(), lastModified: null, pageCount: null, index: null, indexSyncedAt: null, usage: null, usageScannedAt: null, usageStatus: 'never', usageError: null };
  }
  function validateAdd(form, files) {
    const p = parseFigmaUrl(form.url);
    const url = !form.url.trim() ? 'Paste a Figma file link.'
      : p.kind === 'folder' ? 'That’s a folder link. Folders can’t be listed until Figma is connected. Add each file by its own link.'
      : p.kind !== 'file' ? 'Use a Figma file link, like https://www.figma.com/design/…'
      : files.some((f) => f.key === p.key) ? 'This file is already tracked.' : '';
    return { url, name: !form.name.trim() ? 'Add a name.' : '', parsed: p };
  }
  const frameUrl = (file, nodeId) => (nodeId ? `${file.url.split('?')[0]}?node-id=${encodeURIComponent(nodeId.replace(':', '-'))}` : file.url);

  window.PDDFigma = {
    KEY, SCOPE_ID, SCOPE_FILES, ROLES, ROLE_BY_ID, SKIP_GROUPS, GROUP_CONVENTIONS, NOT_CONNECTED,
    get adapter() { return adapter; }, setAdapter(a) { adapter = a || DisconnectedAdapter; },
    parseFigmaUrl, buildIndex, isSkipped, libraryKind, load, save, newFile, validateAdd, frameUrl,
    get linear() { return window.PDD_LINEAR_SNAPSHOT || { issues: [], fetchedAt: null }; },
  };
})();
