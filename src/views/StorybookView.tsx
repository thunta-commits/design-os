// Storybook (HANDOFF §2, redesigned version): header, tabs + Browse/Filter/layout, rail, results, Sources.
import type { FormEvent } from 'react';
import { useApp, val } from '../app/store';
import { ArticleCard } from '../components/ArticleCard';
import { Button, FunnelSimpleIcon, Input, ListIcon, NativeSelect, PlusIcon, SidebarIcon, SquaresFourIcon, Switch, Tabs, TabsList, TabsTrigger, Toggle, ToggleGroup, ToggleGroupItem, TrashIcon, XIcon } from '../components/ds';
import { Pill } from '../components/Pill';
import { PREF_KEYS, writePref } from '../data/storage';
import { timeAgo } from '../lib/dates';
import { sx } from '../lib/sx';
import { articleVM, matchesView, matchSource, queryLibrary, RECENT_DAYS, STATUS_LABEL, TOPICS } from '../rules/pdd';

const SB_VIEWS = [['all', 'All'], ['to-read', 'To read'], ['reading', 'Reading'], ['favorites', 'Favorites'], ['sources', 'Sources']] as const;
const RAIL_HEAD = 'font-size:11px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; color:var(--muted-foreground);';
const FILTER_ROW = 'display:grid; grid-template-columns:84px minmax(0,1fr); align-items:center; gap:10px;';

export function StorybookView() {
  const { state, actions, c, isMobile } = useApp();
  const lib = state.lib, arts = lib.articles, sb = state.sb, sources = lib.sources;
  const toRead = arts.filter((a) => a.status === 'to-read');
  const isSourcesView = sb.view === 'sources';
  const listView = isSourcesView ? 'all' : sb.view;
  const results = queryLibrary(arts, { view: listView, topic: sb.topic, collection: sb.collection, status: sb.status || null, project: sb.project || null, source: sb.source || null, saved: sb.saved || null, sources, search: sb.search, sort: sb.sort });
  const inView = arts.filter((a) => matchesView(a, listView));
  const nameIn = (list: { id: string; name: string }[], id: string | null) => list.find((x) => x.id === id)?.name;
  const chips = [
    sb.topic && { label: `Topic: ${nameIn(TOPICS, sb.topic)}`, remove: () => actions.setSb({ topic: null }) },
    sb.collection && { label: `Collection: ${nameIn(lib.collections, sb.collection)}`, remove: () => actions.setSb({ collection: null }) },
    sb.project && { label: `Project: ${nameIn(c.projects, sb.project)}`, remove: () => actions.setSb({ project: '' }) },
    sb.source && { label: `Source: ${nameIn(sources, sb.source) || 'Removed'}`, remove: () => actions.setSb({ source: '' }) },
    sb.status && { label: `Status: ${STATUS_LABEL[sb.status as keyof typeof STATUS_LABEL]}`, remove: () => actions.setSb({ status: '' }) },
    sb.saved && { label: `Saved in the last ${RECENT_DAYS} days`, remove: () => actions.setSb({ saved: '' }) },
  ].filter(Boolean) as { label: string; remove: () => void }[];
  const hasFilters = chips.length > 0 || !!sb.search;
  const facet = (on: boolean) => ({ pressed: on, style: { background: on ? 'var(--accent)' : 'transparent', color: on ? 'var(--foreground)' : 'var(--muted-foreground)', fontWeight: on ? 500 : 400 } });
  const topics = [{ id: '__all', name: 'All topics', n: inView.length, ...facet(!sb.topic && !sb.collection), toggle: () => actions.setSb({ topic: null, collection: null }) }]
    .concat(TOPICS.map((t) => ({ id: t.id, name: t.name, n: inView.filter((a) => a.topic === t.id).length, ...facet(sb.topic === t.id), toggle: () => actions.setSb({ topic: sb.topic === t.id ? null : t.id }) })));
  const collections = lib.collections.map((col) => ({ id: col.id, name: col.name, n: inView.filter((a) => a.collectionIds.includes(col.id)).length, ...facet(sb.collection === col.id), toggle: () => actions.setSb({ collection: sb.collection === col.id ? null : col.id }) }));
  const emptyTitle = hasFilters ? 'No articles match' : sb.view === 'favorites' ? 'No favorites yet' : sb.view === 'reading' ? 'Nothing in progress' : 'Nothing here yet';
  const emptyBody = hasFilters ? 'Try another view, remove a filter or change the search.' : sb.view === 'favorites' ? 'Star an article to keep it here.' : 'Save an article to start your library.';
  const showRail = !isMobile && sb.railOpen;
  const createCollection = (e: FormEvent) => {
    e.preventDefault();
    const name = state.sb.newCol.trim(); if (!name) return;
    const col = { id: `col-${Date.now().toString(36)}`, name };
    actions.mutateLib((l) => ({ ...l, collections: [...l.collections, col] }));
    actions.setSb({ newCol: '', collection: col.id, topic: null }); actions.showToast(`Collection “${name}” created`);
  };
  const select = (label: string, value: string, onChange: (v: string) => void, options: { id: string; name: string }[], anyLabel: string | null) => (
    <label style={sx(FILTER_ROW)}><span style={sx('font-size:12px; color:var(--muted-foreground);')}>{label}</span>
      <div style={sx('width:100%; min-width:0;')}>
        <NativeSelect className="w-full" value={value} onChange={(e) => onChange(val(e))}>
          {anyLabel !== null && <option value="">{anyLabel}</option>}
          {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </NativeSelect>
      </div>
    </label>
  );

  return (
    <>
      <header style={sx('display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:16px 24px;')}>
        <div style={sx('display:flex; flex-direction:column; gap:6px; min-width:0; max-width:600px;')}>
          <h1 style={sx('margin:0; font-size:28px; line-height:1.2; font-weight:600; letter-spacing:-0.02em;')}>Storybook</h1>
          <p style={sx('margin:0; color:var(--muted-foreground); text-wrap:pretty;')}>Articles, books and guides on UX, UI, design systems, AI in design, research and product thinking.</p>
          <span style={sx('font-size:12px; color:var(--muted-foreground);')}>{`${arts.length} references · ${toRead.length} to read · ${sources.length} sources · saved in this browser`}</span>
        </div>
        <div style={sx('flex:1; display:flex; align-items:center; justify-content:flex-end; gap:8px; min-width:260px;')}>
          <div style={sx('flex:1; max-width:320px;')}>
            <Input type="search" placeholder="Search titles, notes, #tags" aria-label="Search library" value={sb.search} onChange={(e) => actions.setSb({ search: val(e) })} />
          </div>
          <Button onClick={() => actions.openSave()}><PlusIcon size={15} />Save article</Button>
        </div>
      </header>

      <div style={sx('display:flex; flex-direction:column; gap:10px;')}>
        <div style={sx('position:relative; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:10px;')}>
          <div style={sx('max-width:100%; overflow-x:auto;')}>
            <Tabs value={sb.view} onValueChange={(v: string) => v && actions.setSb({ view: v, filterOpen: false })}>
              <TabsList>
                {SB_VIEWS.map(([value, label]) => (
                  <TabsTrigger key={value} value={value}>{label}<span style={sx('font-size:11px; color:var(--muted-foreground); font-variant-numeric:tabular-nums;')}>{value === 'sources' ? sources.length : arts.filter((a) => matchesView(a, value)).length}</span></TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          {!isSourcesView && (
            <div style={sx('display:flex; align-items:center; gap:8px;')}>
              {!isMobile && (
                <Toggle variant="outline" size="sm" pressed={sb.railOpen} onPressedChange={(v: boolean) => { actions.setSb({ railOpen: !!v }); writePref(PREF_KEYS.sbRail, v ? 'open' : 'closed'); }} aria-label="Show topics and collections"><SidebarIcon size={15} />Browse</Toggle>
              )}
              <Button variant="outline" size="sm" aria-expanded={sb.filterOpen} onClick={() => actions.setSb({ filterOpen: !state.sb.filterOpen })}><FunnelSimpleIcon size={15} />Filter{chips.length > 0 && <span style={sx('display:inline-flex; align-items:center; justify-content:center; min-width:18px; height:18px; padding:0 5px; border-radius:999px; background:var(--primary); color:var(--primary-foreground); font-size:11px; font-weight:600;')}>{String(chips.length)}</span>}</Button>
              <ToggleGroup type="single" variant="outline" size="sm" value={sb.layout} onValueChange={(v: string) => { if (!v) return; actions.setSb({ layout: v as 'grid' | 'list' }); writePref(PREF_KEYS.sbLayout, v); }} aria-label="Layout">
                <ToggleGroupItem value="grid" aria-label="Card view"><SquaresFourIcon size={15} /></ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List view"><ListIcon size={15} /></ToggleGroupItem>
              </ToggleGroup>
              {sb.filterOpen && (
                <>
                  <button type="button" aria-label="Close filters" onClick={() => actions.setSb({ filterOpen: false })} style={sx('position:fixed; inset:0; z-index:20; border:0; background:transparent; cursor:default;')} />
                  <div role="dialog" aria-label="Filter articles" style={sx('position:absolute; top:calc(100% + 8px); right:0; z-index:21; width:320px; max-width:calc(100vw - 32px); display:flex; flex-direction:column; gap:12px; padding:16px; border:1px solid var(--border); border-radius:12px; background:var(--popover); color:var(--popover-foreground); box-shadow:0 12px 40px rgb(0 0 0 / 0.14);')}>
                    <strong style={sx('font-size:14px; font-weight:600;')}>Filter articles</strong>
                    {select('Topic', sb.topic || '', (v) => actions.setSb({ topic: v || null }), TOPICS, 'Any topic')}
                    {select('Collection', sb.collection || '', (v) => actions.setSb({ collection: v || null }), lib.collections, 'Any collection')}
                    {select('Project', sb.project, (v) => actions.setSb({ project: v }), c.projects, 'Any project')}
                    {select('Source', sb.source, (v) => actions.setSb({ source: v }), sources, 'Any source')}
                    {select('Status', sb.status, (v) => actions.setSb({ status: v }), [{ id: 'to-read', name: 'To read' }, { id: 'reading', name: 'Reading' }, { id: 'read', name: 'Read' }], 'Any status')}
                    {select('Saved', sb.saved, (v) => actions.setSb({ saved: v }), [{ id: 'recent', name: 'Last 14 days' }], 'Any time')}
                    {select('Sort', sb.sort, (v) => actions.setSb({ sort: v }), [{ id: 'newest', name: 'Newest first' }, { id: 'oldest', name: 'Oldest first' }, { id: 'title', name: 'Title A–Z' }, { id: 'status', name: 'Reading status' }], null)}
                    <div style={sx('display:flex; justify-content:space-between; gap:8px; padding-top:4px;')}>
                      <Button variant="ghost" size="sm" onClick={() => actions.clearSb()}>Clear all</Button>
                      <Button size="sm" onClick={() => actions.setSb({ filterOpen: false })}>Done</Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          {isSourcesView && <Button variant="outline" size="sm" onClick={() => actions.setState({ dialog: 'source', srcForm: { name: '', url: '', category: 'Blog', enabled: true }, srcTouched: false })}><PlusIcon size={15} />Add source</Button>}
        </div>
        {chips.length > 0 && !isSourcesView && (
          <div style={sx('display:flex; flex-wrap:wrap; align-items:center; gap:6px;')}>
            {chips.map((ch) => (
              <button key={ch.label} type="button" onClick={ch.remove} aria-label={`Remove filter ${ch.label}`} className="hv-accent" style={sx('display:inline-flex; align-items:center; gap:6px; height:26px; padding:0 8px 0 10px; border:0; border-radius:999px; background:var(--muted); color:var(--foreground); font:inherit; font-size:12px; cursor:pointer;')}>{ch.label}<XIcon size={12} /></button>
            ))}
            <button type="button" onClick={() => actions.clearSb()} style={sx('height:26px; padding:0 6px; border:0; background:transparent; font:inherit; font-size:12px; color:var(--muted-foreground); text-decoration:underline; cursor:pointer;')}>Clear all</button>
          </div>
        )}
      </div>

      {!isSourcesView && (
        <div style={sx('display:grid; gap:32px; align-items:start;', { gridTemplateColumns: showRail ? '176px minmax(0,1fr)' : 'minmax(0,1fr)' })}>
          {showRail && (
            <aside aria-label="Topics and collections" style={sx('display:flex; flex-direction:column; gap:20px; position:sticky; top:0; padding-top:2px;')}>
              <div role="group" aria-label="Topics" style={sx('display:flex; flex-direction:column; gap:1px;')}>
                <span style={sx(`padding:0 8px 6px; ${RAIL_HEAD}`)}>Topics</span>
                {topics.map((t) => (
                  <button key={t.id} type="button" aria-pressed={t.pressed} onClick={t.toggle} className="hv-fg" style={sx('display:flex; align-items:center; gap:8px; height:30px; padding:0 8px; border:0; border-radius:6px; font:inherit; font-size:13px; text-align:left; cursor:pointer;', t.style)}>
                    <span style={sx('flex:1;')}>{t.name}</span><span style={sx('font-size:11px; color:var(--muted-foreground); font-variant-numeric:tabular-nums;')}>{t.n}</span>
                  </button>
                ))}
              </div>
              <div role="group" aria-label="Collections" style={sx('display:flex; flex-direction:column; gap:1px;')}>
                <span style={sx(`padding:0 8px 6px; ${RAIL_HEAD}`)}>Collections</span>
                {collections.map((col) => (
                  <button key={col.id} type="button" aria-pressed={col.pressed} onClick={col.toggle} className="hv-fg" style={sx('display:flex; align-items:center; gap:8px; height:30px; padding:0 8px; border:0; border-radius:6px; font:inherit; font-size:13px; text-align:left; cursor:pointer;', col.style)}>
                    <span style={sx('flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;')}>{col.name}</span><span style={sx('font-size:11px; color:var(--muted-foreground); font-variant-numeric:tabular-nums;')}>{col.n}</span>
                  </button>
                ))}
                <form onSubmit={createCollection} style={sx('display:flex; gap:4px; align-items:center; margin-top:6px;')}>
                  <Input placeholder="New collection" aria-label="New collection name" value={sb.newCol} onChange={(e) => actions.setSb({ newCol: val(e) })} />
                  <Button type="submit" variant="ghost" size="icon-sm" aria-label="Create collection"><PlusIcon size={15} /></Button>
                </form>
              </div>
            </aside>
          )}

          <section aria-label="Articles" style={sx('display:flex; flex-direction:column; gap:14px; min-width:0;')}>
            <span aria-live="polite" style={sx('font-size:13px; color:var(--muted-foreground);')}><strong style={sx('font-weight:600; color:var(--foreground);')}>{results.length}</strong> {results.length === 1 ? 'article' : 'articles'}</span>
            {results.length === 0 && (
              <div style={sx('display:flex; flex-direction:column; align-items:center; gap:8px; padding:48px 12px; border-radius:12px; background:var(--muted); text-align:center;')}>
                <strong style={sx('font-weight:600;')}>{emptyTitle}</strong>
                <span style={sx('font-size:13px; color:var(--muted-foreground);')}>{emptyBody}</span>
                <Button variant="outline" size="sm" onClick={hasFilters ? () => actions.clearSb() : () => actions.openSave()}>{hasFilters ? 'Clear filters' : 'Save an article'}</Button>
              </div>
            )}
            {results.length > 0 && sb.layout === 'grid' && (
              <div style={sx('display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 260px), 1fr)); gap:16px; align-items:stretch;')}>
                {results.map((a) => <ArticleCard key={a.id} article={articleVM(a, c)} layout="grid" onOpen={actions.openArticle} onToggleFav={actions.toggleFav} />)}
              </div>
            )}
            {results.length > 0 && sb.layout === 'list' && (
              <div style={sx('display:flex; flex-direction:column; border:1px solid var(--border); border-radius:12px; background:var(--card); overflow:hidden;')}>
                {results.map((a) => <ArticleCard key={a.id} article={articleVM(a, c)} layout="list" compact={isMobile} onOpen={actions.openArticle} onToggleFav={actions.toggleFav} />)}
              </div>
            )}
          </section>
        </div>
      )}

      {isSourcesView && (
        <section aria-label="Sources" style={sx('display:flex; flex-direction:column; gap:12px;')}>
          <p style={sx('margin:0; font-size:13px; color:var(--muted-foreground); text-wrap:pretty;')}>{`${sources.length} source${sources.length === 1 ? '' : 's'} · ${sources.filter((x) => x.enabled).length} active. Feeds aren’t fetched yet, so “updated” times are sample values until a feed reader is connected.`}</p>
          <div style={sx('display:flex; flex-direction:column; border:1px solid var(--border); border-radius:12px; background:var(--card); overflow:hidden;')}>
            {sources.map((x) => {
              const items = arts.filter((a) => matchSource(a, x)); const unread = items.filter((a) => a.status !== 'read').length;
              const confirm = state.confirmSource === x.id; const opacity = x.enabled ? 1 : 0.6;
              return (
                <div key={x.id} style={sx('display:flex; flex-wrap:wrap; align-items:center; gap:12px 20px; padding:14px 16px; border-bottom:1px solid var(--border);')}>
                  <div style={sx('flex:1; min-width:220px; display:flex; flex-direction:column; gap:3px;', { opacity })}>
                    <span style={sx('display:flex; align-items:center; gap:8px; flex-wrap:wrap;')}><strong style={sx('font-size:14px; font-weight:600;')}>{x.name}</strong><Pill label={x.enabled ? 'Active' : 'Paused'} tone={x.enabled ? 'done' : 'up-next'} /></span>
                    <a href={x.url} target="_blank" rel="noreferrer" className="hv-underline" style={sx('font-size:12px; color:var(--muted-foreground); text-decoration:none; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%;')}>{x.url.replace(/^https?:\/\//, '')}</a>
                    <span style={sx('font-size:12px; color:var(--muted-foreground);')}>{`${x.category} · updated ${timeAgo(x.updatedAt)}`}</span>
                  </div>
                  <span style={sx('font-size:13px; color:var(--muted-foreground); font-variant-numeric:tabular-nums;', { opacity })}>{items.length ? `${items.length} saved · ${unread} unread` : 'No saved items yet'}</span>
                  <div style={sx('display:flex; align-items:center; gap:8px;')}>
                    {!confirm && (
                      <>
                        <Button variant="outline" size="sm" disabled={items.length === 0} onClick={() => actions.setSb({ view: 'all', source: x.id })}>Browse</Button>
                        <label style={sx('display:inline-flex; align-items:center; gap:6px; font-size:12px; color:var(--muted-foreground);')}><Switch checked={x.enabled} onCheckedChange={(v: boolean) => { actions.updateSource(x.id, { enabled: !!v }); actions.showToast(v ? `Following ${x.name}` : `${x.name} paused`); }} aria-label={x.enabled ? `Pause ${x.name}` : `Resume ${x.name}`} />{x.enabled ? 'Following' : 'Paused'}</label>
                        <Button variant="ghost" size="icon-sm" aria-label={`Remove ${x.name}`} onClick={() => actions.setState({ confirmSource: x.id })}><TrashIcon size={15} /></Button>
                      </>
                    )}
                    {confirm && (
                      <>
                        <span style={sx('font-size:13px;')}>Remove this source?</span>
                        <Button variant="ghost" size="sm" onClick={() => actions.setState({ confirmSource: null })}>Cancel</Button>
                        <Button variant="destructive" size="sm" onClick={() => {
                          const snap = x; actions.removeSource(x.id); actions.setState({ confirmSource: null }); if (state.sb.source === x.id) actions.setSb({ source: '' });
                          actions.showToast('Source removed', { label: 'Undo', run: () => actions.mutateLib((l) => ({ ...l, sources: [...l.sources.filter((s) => s.id !== snap.id), snap] })) });
                        }}>Remove</Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {sources.length === 0 && (
              <div style={sx('display:flex; flex-direction:column; align-items:center; gap:8px; padding:40px 12px; text-align:center;')}>
                <strong style={sx('font-weight:600;')}>No sources yet</strong>
                <span style={sx('font-size:13px; color:var(--muted-foreground);')}>Add a website, blog, newsletter or release feed you want to follow.</span>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
