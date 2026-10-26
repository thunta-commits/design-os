// Save/Edit article, Integrations, Link a card, Add source dialogs.
import type { FormEvent } from 'react';
import { DOT } from '../app/Shell';
import { hostLabel, isUrl, parseTags, toggleIn, useApp, val, type ArticleForm } from '../app/store';
import { Button, Checkbox, InfoIcon, Input, NativeSelect, Switch, Tabs, TabsList, TabsTrigger, Textarea, Toggle } from '../components/ds';
import { session } from '../data/api';
import type { Article, IntegrationStatus, Source } from '../data/types';
import { timeAgo } from '../lib/dates';
import { sx } from '../lib/sx';
import { hostOf, SOURCE_CATEGORIES, starterLibrary, TOPICS } from '../rules/pdd';
import { DialogFrame, ERR, FIELD, LABEL } from './frames';

const formErrors = (f: ArticleForm) => ({ url: !f.url.trim() ? 'Add the article’s link.' : !isUrl(f.url) ? 'Use a full link starting with https://' : '', title: !f.title.trim() ? 'Add a title.' : '', topic: !f.topic ? 'Choose a topic.' : '' });
const BODY = 'flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:14px; padding:18px;';

export function SaveArticleDialog() {
  const { state, actions, c } = useApp();
  const f = state.form; const errs = formErrors(f); const t = state.touched;
  const setForm = <K extends keyof ArticleForm>(k: K, v: ArticleForm[K]) => actions.setState((s) => ({ form: { ...s.form, [k]: v } }));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const cur = state.form; const er = formErrors(cur);
    actions.setState({ touched: true });
    if (er.url || er.title || er.topic) return;
    const data = {
      url: cur.url.trim(), title: cur.title.trim(), author: cur.author.trim() || cur.publication.trim() || hostLabel(cur.url), publication: cur.publication.trim() || hostLabel(cur.url),
      topic: cur.topic as Article['topic'], status: cur.status, summary: cur.summary.trim(), notes: cur.notes.trim(), tags: parseTags(cur.tags), relatedProjectIds: cur.projects, collectionIds: cur.collections, favorite: cur.favorite,
    };
    if (cur.id) { actions.updateArticle(cur.id, data); actions.showToast('Article updated'); actions.setState({ dialog: null, article: cur.id, issue: null, notes: data.notes }); }
    else { const created = actions.addArticle(data); actions.setState({ dialog: null }); actions.showToast('Saved to Storybook', { label: 'View', run: () => actions.openArticle(created.id) }); }
  };
  const heading = f.id ? 'Edit article' : 'Save an article';
  const input = (k: 'url' | 'title' | 'author' | 'publication' | 'tags') => (e: unknown) => setForm(k, val(e));
  return (
    <DialogFrame label={heading} title={heading} width={640} onClose={actions.closeDialog} footer={<>
      <Button variant="ghost" onClick={actions.closeDialog}>Cancel</Button>
      <Button type="submit" form="article-form">{f.id ? 'Save changes' : 'Save to Storybook'}</Button>
    </>}>
      <form id="article-form" onSubmit={submit} noValidate style={sx('flex:1; overflow-y:auto; display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap:14px 16px; padding:18px;')}>
        <div style={sx(`grid-column:1 / -1; ${FIELD}`)}>
          <label htmlFor="f-url" style={sx(LABEL)}>Link</label>
          <Input id="f-url" type="url" placeholder="https://" value={f.url} aria-invalid={t && !!errs.url} onChange={input('url')} onBlur={() => { const cur = state.form; if (!cur.publication && isUrl(cur.url)) setForm('publication', hostLabel(cur.url)); }} />
          <span style={sx(ERR)}>{t ? errs.url : ''}</span>
        </div>
        <div style={sx(`grid-column:1 / -1; ${FIELD}`)}>
          <label htmlFor="f-title" style={sx(LABEL)}>Title</label>
          <Input id="f-title" value={f.title} aria-invalid={t && !!errs.title} onChange={input('title')} />
          <span style={sx(ERR)}>{t ? errs.title : ''}</span>
        </div>
        <div style={sx(FIELD)}><label htmlFor="f-author" style={sx(LABEL)}>Author</label><Input id="f-author" value={f.author} onChange={input('author')} /></div>
        <div style={sx(FIELD)}><label htmlFor="f-pub" style={sx(LABEL)}>Publication or site</label><Input id="f-pub" value={f.publication} onChange={input('publication')} /></div>
        <div style={sx(FIELD)}>
          <label htmlFor="f-topic" style={sx(LABEL)}>Topic</label>
          <div style={sx('width:100%; min-width:0;')}>
            <NativeSelect id="f-topic" className="w-full" value={f.topic} aria-invalid={t && !!errs.topic} onChange={(e) => setForm('topic', val(e))}>
              <option value="">Choose a topic</option>
              {TOPICS.map((tp) => <option key={tp.id} value={tp.id}>{tp.name}</option>)}
            </NativeSelect>
          </div>
          <span style={sx(ERR)}>{t ? errs.topic : ''}</span>
        </div>
        <div style={sx(FIELD)}>
          <span style={sx(LABEL)}>Reading status</span>
          <Tabs value={f.status} onValueChange={(s: string) => s && setForm('status', s as Article['status'])}>
            <TabsList><TabsTrigger value="to-read">To read</TabsTrigger><TabsTrigger value="reading">Reading</TabsTrigger><TabsTrigger value="read">Read</TabsTrigger></TabsList>
          </Tabs>
        </div>
        <div style={sx(`grid-column:1 / -1; ${FIELD}`)}><label htmlFor="f-summary" style={sx(LABEL)}>Short summary</label><Textarea id="f-summary" rows={2} placeholder="One or two sentences on what it argues" value={f.summary} onChange={(e) => setForm('summary', val(e))} /></div>
        <div style={sx(`grid-column:1 / -1; ${FIELD}`)}><label htmlFor="f-notes" style={sx(LABEL)}>My notes</label><Textarea id="f-notes" rows={3} placeholder="Why you saved it, where it applies" value={f.notes} onChange={(e) => setForm('notes', val(e))} /></div>
        <div style={sx(`grid-column:1 / -1; ${FIELD}`)}>
          <label htmlFor="f-tags" style={sx(LABEL)}>Tags</label>
          <Input id="f-tags" placeholder="ai, onboarding, accessibility" value={f.tags} onChange={input('tags')} />
          <span style={sx('font-size:12px; color:var(--muted-foreground);')}>Separate with commas. Tags that match Linear labels surface this article beside those issues.</span>
        </div>
        <fieldset style={sx('grid-column:1 / -1; display:flex; flex-direction:column; gap:8px; border:0; padding:0; margin:0;')}>
          <legend style={sx('font-size:13px; font-weight:500; margin-bottom:8px;')}>Related Lumin project</legend>
          <div style={sx('display:flex; flex-wrap:wrap; gap:6px;')}>
            {c.projects.map((p) => <Toggle key={p.id} variant="outline" size="sm" pressed={f.projects.includes(p.id)} onPressedChange={() => setForm('projects', toggleIn(state.form.projects, p.id))}>{p.name}</Toggle>)}
          </div>
        </fieldset>
        <fieldset style={sx('grid-column:1 / -1; display:flex; flex-direction:column; gap:8px; border:0; padding:0; margin:0;')}>
          <legend style={sx('font-size:13px; font-weight:500; margin-bottom:8px;')}>Collections</legend>
          <div style={sx('display:flex; flex-wrap:wrap; gap:6px;')}>
            {state.lib.collections.map((x) => <Toggle key={x.id} variant="outline" size="sm" pressed={f.collections.includes(x.id)} onPressedChange={() => setForm('collections', toggleIn(state.form.collections, x.id))}>{x.name}</Toggle>)}
          </div>
        </fieldset>
        <label style={sx('grid-column:1 / -1; display:flex; align-items:center; gap:8px; font-size:14px;')}>
          <Checkbox id="f-fav" checked={f.favorite} onCheckedChange={(v: boolean | 'indeterminate') => setForm('favorite', v === true)} />
          Add to favorites
        </label>
      </form>
    </DialogFrame>
  );
}

const DETAILS = {
  linear: { surfaces: ['Issues assigned to you', 'Projects and the active cycle', 'Status, priority and due dates', 'Figma attachments on issues'], howTo: 'Add LINEAR_API_KEY (a personal API key from Linear → Settings → Security & access) to the Vercel project’s environment variables, then redeploy.' },
  figma: { surfaces: ['Recently edited files', 'Top-level frames for deep links', 'Files matched to Linear issues', 'Which issues have no design yet'], howTo: 'Figma sync isn’t built yet. It will use a Figma personal access token (FIGMA_TOKEN) stored in the Vercel project’s environment variables.' },
};
const introOf = (s: IntegrationStatus) => (s.mode === 'sample' ? `Not connected. Everything marked “Sample ${s.name} data” is illustrative and will be replaced once the integration is live.`
  : s.mode === 'connected' ? `Connected.${s.lastSyncedAt ? ` Last synced ${timeAgo(s.lastSyncedAt)}.` : ''}`
  : s.mode === 'error' ? `Couldn’t load ${s.name}${s.error ? `: ${s.error}` : '.'}`
  : 'Not connected. Sections that need it show an empty state.');

export function IntegrationsDialog() {
  const { state, actions, c, signOut: onSignedOut } = useApp();
  const ints = [c.integrations.linear, c.integrations.figma];
  const signOut = async () => { await session.logout().catch(() => null); onSignedOut(); };
  return (
    <DialogFrame label="Integrations" title="Integrations" width={600} onClose={actions.closeDialog}>
      <div style={sx('flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:12px; padding:18px;')}>
        {ints.map((s) => (
          <div key={s.id} style={sx('display:flex; flex-direction:column; gap:12px; padding:16px; border:1px solid var(--border); border-radius:12px; background:var(--card);')}>
            <div style={sx('display:flex; align-items:center; gap:8px;')}>
              <span aria-hidden="true" style={sx('width:8px; height:8px; border-radius:999px;', { background: DOT[s.mode] })} />
              <h2 style={sx('margin:0; font-size:15px; font-weight:600;')}>{s.name}</h2>
              <span style={sx('font-size:12px; color:var(--muted-foreground);')}>{s.label}</span>
              {s.id === 'linear' && s.mode !== 'sample' && <Button variant="ghost" size="sm" style={{ marginLeft: 'auto' }} onClick={() => { actions.refreshLinear(true); actions.showToast('Refreshing Linear…'); }}>Refresh</Button>}
            </div>
            <p style={sx('margin:0; font-size:13px; color:var(--muted-foreground);')}>{introOf(s)}</p>
            <div style={sx('display:flex; flex-direction:column; gap:4px;')}>
              <h3 style={sx('margin:0; font-size:13px; font-weight:600;')}>Will surface</h3>
              <ul style={sx('margin:0; padding-left:18px; display:grid; gap:4px; font-size:13px; color:var(--muted-foreground); list-style:disc;')}>
                {DETAILS[s.id as 'linear' | 'figma'].surfaces.map((x) => <li key={x}>{x}</li>)}
              </ul>
            </div>
            {s.mode !== 'connected' && (
              <div style={sx('display:flex; flex-direction:column; gap:4px;')}>
                <h3 style={sx('margin:0; font-size:13px; font-weight:600;')}>To connect</h3>
                <p style={sx('margin:0; font-size:13px; color:var(--muted-foreground);')}>{DETAILS[s.id as 'linear' | 'figma'].howTo}</p>
              </div>
            )}
          </div>
        ))}
        <div style={sx('display:flex; flex-direction:column; gap:12px; padding:16px; border:1px solid var(--border); border-radius:12px; background:var(--card);')}>
          <div style={sx('display:flex; align-items:center; gap:8px;')}>
            <span aria-hidden="true" style={sx('width:8px; height:8px; border-radius:999px; background:var(--card-green-foreground);')} />
            <h2 style={sx('margin:0; font-size:15px; font-weight:600;')}>Storybook library</h2>
            <span style={sx('font-size:12px; color:var(--muted-foreground);')}>Saved in this browser</span>
          </div>
          <p style={sx('margin:0; font-size:13px; color:var(--muted-foreground);')}>{`${state.lib.articles.length} articles. Your library is stored in this browser, so it won’t follow you to another device until the database is connected.`}</p>
          {import.meta.env.DEV && (
            <div style={sx('display:flex; flex-wrap:wrap; align-items:center; gap:8px;')}>
              {state.confirmReset ? (
                <>
                  <span style={sx('font-size:13px;')}>Replace your library with the starter set?</span>
                  <Button variant="destructive" size="sm" onClick={() => { actions.setLib(starterLibrary()); actions.setState({ confirmReset: false }); actions.showToast('Library reset to the starter set'); }}>Reset library</Button>
                  <Button variant="ghost" size="sm" onClick={() => actions.setState({ confirmReset: false })}>Cancel</Button>
                </>
              ) : <Button variant="outline" size="sm" onClick={() => actions.setState({ confirmReset: true })}>Reset to starter library…</Button>}
            </div>
          )}
        </div>
        <div style={sx('display:flex; align-items:center; justify-content:space-between; gap:8px; padding:0 2px;')}>
          <span style={sx('font-size:13px; color:var(--muted-foreground);')}>{`Signed in as ${c.viewer.email}`}</span>
          <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
        </div>
      </div>
    </DialogFrame>
  );
}

export function LinkDialog() {
  const { state, actions, c } = useApp();
  const fst = state.fstore, lk = state.lk;
  const dKey = fst.files.some((f) => f.key === state.dir.fileKey) ? state.dir.fileKey : fst.files[0]?.key || '';
  const lkFile = fst.files.find((f) => f.key === lk.fileKey) || fst.files.find((f) => f.key === dKey) || null;
  const lkPages = lkFile?.index ? lkFile.index.groups.flatMap((g) => g.pages.filter((p) => !p.skipped).map((p) => ({ id: p.id, name: `${g.name} › ${p.name}`, page: p.name, group: g.name }))) : [];
  const missing = !c.issues.length ? 'No Linear cards are available.' : !lkFile ? 'Track a Figma file first, on Figma files.' : !lkFile.index ? `“${lkFile.name}” has no index yet, so there are no design pages to link to. Sync Index needs Figma to be connected.` : !lk.issueId ? 'Choose a Linear card.' : !lk.pageId ? 'Choose a design page.' : fst.links.some((l) => l.issueId === lk.issueId && l.pageId === lk.pageId && l.fileKey === lkFile.key) ? 'This card is already linked to that page.' : '';
  const submit = (e: FormEvent) => {
    e.preventDefault(); if (missing || !lkFile) return;
    const pg = lkPages.find((p) => p.id === lk.pageId)!; const ver = lk.version.trim() || 'v1.0'; const now = new Date().toISOString();
    actions.addLink({ id: `lnk-${Date.now().toString(36)}`, fileKey: lkFile.key, pageId: pg.id, pageName: pg.page, groupName: pg.group, nodeId: pg.id, frameName: lk.frame.trim() || null, issueId: lk.issueId, version: ver,
      history: [{ at: now, kind: 'version', text: `${ver} Starting version` }, { at: now, kind: 'link', text: `Linked ${lk.issueId} to ${pg.page}` }] });
    actions.setState({ dialog: null, dirCard: lk.issueId }); actions.showToast('Card linked');
  };
  return (
    <DialogFrame label="Link a card" title="Link a card to a design" width={520} onClose={actions.closeDialog} footer={<>
      <Button variant="ghost" onClick={actions.closeDialog}>Cancel</Button>
      <Button type="submit" form="link-form" disabled={!!missing}>Link card</Button>
    </>}>
      <form id="link-form" onSubmit={submit} style={sx(BODY)}>
        <div style={sx(FIELD)}><label htmlFor="lk-issue" style={sx(LABEL)}>Linear card</label><div style={sx('width:100%; min-width:0;')}><NativeSelect id="lk-issue" className="w-full" value={lk.issueId} onChange={(e) => actions.setLk({ issueId: val(e) })}><option value="">Choose a card</option>{c.issues.map((i) => <option key={i.id} value={i.identifier}>{`${i.identifier} · ${i.title}`}</option>)}</NativeSelect></div></div>
        <div style={sx(FIELD)}><label htmlFor="lk-file" style={sx(LABEL)}>Figma file</label><div style={sx('width:100%; min-width:0;')}><NativeSelect id="lk-file" className="w-full" value={lkFile?.key || ''} onChange={(e) => actions.setLk({ fileKey: val(e), pageId: '' })} disabled={!fst.files.length}>{!fst.files.length && <option value="">No tracked files</option>}{fst.files.map((f) => <option key={f.key} value={f.key}>{f.name}</option>)}</NativeSelect></div></div>
        <div style={sx(FIELD)}><label htmlFor="lk-page" style={sx(LABEL)}>Design page</label><div style={sx('width:100%; min-width:0;')}><NativeSelect id="lk-page" className="w-full" value={lk.pageId} onChange={(e) => actions.setLk({ pageId: val(e) })} disabled={!lkPages.length}><option value="">{lkPages.length ? 'Choose a page' : 'No index yet'}</option>{lkPages.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</NativeSelect></div></div>
        <div style={sx('display:grid; grid-template-columns:minmax(0,1fr) 120px; gap:12px;')}>
          <div style={sx(FIELD)}><label htmlFor="lk-frame" style={sx(LABEL)}>Section or frame <span style={sx('font-weight:400; color:var(--muted-foreground);')}>(optional)</span></label><Input id="lk-frame" value={lk.frame} onChange={(e) => actions.setLk({ frame: val(e) })} disabled={!lkPages.length} /></div>
          <div style={sx(FIELD)}><label htmlFor="lk-version" style={sx(LABEL)}>Version</label><Input id="lk-version" value={lk.version} onChange={(e) => actions.setLk({ version: val(e) })} /></div>
        </div>
        {missing && <div role="note" style={sx('display:flex; gap:8px; padding:10px 12px; border-radius:10px; background:var(--muted); font-size:13px; color:var(--foreground);')}><InfoIcon size={16} style={{ flex: 'none' }} /><span style={sx('text-wrap:pretty;')}>{missing}</span></div>}
      </form>
    </DialogFrame>
  );
}

const sourceErrors = (f: { name: string; url: string }) => ({ name: !f.name.trim() ? 'Add a name.' : '', url: !f.url.trim() ? 'Add the website or feed link.' : !isUrl(f.url) ? 'Use a full link starting with https://' : '' });

export function SourceDialog() {
  const { state, actions } = useApp();
  const sf = state.srcForm, st = state.srcTouched, sErr = sourceErrors(sf);
  const setSrc = <K extends keyof typeof sf>(k: K, v: (typeof sf)[K]) => actions.setState((s) => ({ srcForm: { ...s.srcForm, [k]: v } }));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const f2 = state.srcForm; const er = sourceErrors(f2); actions.setState({ srcTouched: true });
    if (er.name || er.url) return;
    const nx: Source = { id: `src-${Date.now().toString(36)}`, name: f2.name.trim(), url: f2.url.trim(), category: f2.category, enabled: f2.enabled, updatedAt: new Date().toISOString() };
    actions.mutateLib((l) => ({ ...l, sources: [...l.sources, nx] })); actions.setState({ dialog: null }); actions.showToast(`Source “${nx.name}” added`);
  };
  return (
    <DialogFrame label="Add a source" title="Add a source" width={480} onClose={actions.closeDialog} footer={<>
      <Button variant="ghost" onClick={actions.closeDialog}>Cancel</Button>
      <Button type="submit" form="source-form">Add source</Button>
    </>}>
      <form id="source-form" onSubmit={submit} noValidate style={sx(BODY)}>
        <div style={sx(FIELD)}><label style={sx(LABEL)}>Website or feed URL</label><Input type="url" placeholder="https://www.figma.com/release-notes/feed/atom.xml" value={sf.url} aria-invalid={st && !!sErr.url} onChange={(e) => setSrc('url', val(e))} onBlur={() => { const f2 = state.srcForm; if (!f2.name.trim() && isUrl(f2.url)) setSrc('name', hostOf(f2.url)); }} /><span style={sx(ERR)}>{st ? sErr.url : ''}</span></div>
        <div style={sx(FIELD)}><label style={sx(LABEL)}>Name</label><Input placeholder="Figma Release Notes" value={sf.name} aria-invalid={st && !!sErr.name} onChange={(e) => setSrc('name', val(e))} /><span style={sx(ERR)}>{st ? sErr.name : ''}</span></div>
        <div style={sx(FIELD)}><label style={sx(LABEL)}>Category</label><div style={sx('width:100%; min-width:0;')}><NativeSelect className="w-full" value={sf.category} onChange={(e) => setSrc('category', val(e) as Source['category'])}>{SOURCE_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}</NativeSelect></div></div>
        <label style={sx('display:flex; align-items:center; gap:8px; font-size:14px;')}><Switch checked={sf.enabled} onCheckedChange={(v: boolean) => setSrc('enabled', !!v)} />Follow this source</label>
        <span style={sx('font-size:12px; color:var(--muted-foreground);')}>Articles you save from this site are grouped under the source automatically.</span>
      </form>
    </DialogFrame>
  );
}
