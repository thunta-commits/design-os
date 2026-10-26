// Figma files (HANDOFF §11.1): add-by-link, skip rules, tracked files list, and the file details state.
import type { FormEvent } from 'react';
import { useApp, val } from '../app/store';
import { ArrowLeftIcon, ArrowsClockwiseIcon, Button, ListIcon, Input, LinkSimpleIcon, NativeSelect, PlusIcon, Switch, Toggle, TrashIcon, ArrowUpRightIcon } from '../components/ds';
import { FileIndex } from '../components/FileIndex';
import { Pill } from '../components/Pill';
import { Banner, H1, KeyValues, OutlineLink } from '../components/ui';
import type { TrackedFile } from '../data/types';
import { exactTime, formatShort, syncedLabel, timeAgo } from '../lib/dates';
import { MONO, sx } from '../lib/sx';
import { frameUrl, newFile, NOT_CONNECTED, parseFigmaUrl, ROLE_BY_ID, ROLES, SKIP_GROUPS, validateAdd } from '../rules/figma';
import { cardOf, indexGroups } from './indexGroups';

const MUTED = 'var(--muted-foreground)', FGC = 'var(--foreground)';
const roleOf = (id: string) => ROLE_BY_ID[id] || { label: id, tone: 'up-next' };
const usageLine = (f: TrackedFile) => (f.usageStatus === 'ok' && f.usage ? `${f.usage.instances.toLocaleString()} instances on ${f.usage.pagesWithInstances} pages · scanned ${formatShort(f.usageScannedAt!)}` : 'Not scanned');
const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export function FigmaFilesView() {
  const { state, actions, c, isMobile, linearLoading, figma: fAd } = useApp();
  const fst = state.fstore, fg = state.fg;
  const fConn = fAd.mode === 'connected', fLoading = state.figmaConfigured === null;
  const fErr = validateAdd(fg, fst.files);
  const fq = fg.search.trim().toLowerCase();
  const fList = fst.files.filter((f) => (!fg.roleFilter || f.role === fg.roleFilter) && (!fq || `${f.name} ${f.key}`.toLowerCase().includes(fq)));
  const unavailable = fConn ? 'Scan usage isn’t available yet. Sync Index reads each file’s pages from Figma.' : `Sync Index and Scan usage are unavailable. ${NOT_CONNECTED}`;
  // Sync Index button: "Sync Index" → "Syncing…" → "Synced" (3 s) ; a failed attempt is reported beside the last successful sync.
  const syncLabel = (f: TrackedFile) => (f.indexSyncStatus === 'syncing' ? 'Syncing…' : state.syncedFlash === f.key ? 'Synced' : 'Sync Index');
  const syncDisabled = (f: TrackedFile) => !fAd.canSync || f.indexSyncStatus === 'syncing';
  const openIndex = (f: TrackedFile) => actions.setState({ fgOpen: f.key, fgPage: null, confirmFile: null });
  const failedLine = (f: TrackedFile) => (f.indexSyncStatus === 'error' ? (
    <span style={sx('font-size:12px; color:var(--destructive);')} title={f.indexSyncError || ''}>
      Sync failed · <button type="button" disabled={!fAd.canSync} onClick={() => actions.syncFile(f.key)} style={sx('border:0; padding:0; background:transparent; font:inherit; color:inherit; text-decoration:underline; cursor:pointer;')}>Retry</button>
    </span>
  ) : null);
  const rowCols = isMobile ? 'minmax(0,1fr)' : 'minmax(0,2.4fr) 64px minmax(0,1fr) minmax(0,1.3fr) auto';
  const cards = c.issues.map((i) => cardOf(i, c));
  const toggleGroup = (ck: string) => actions.setState((s) => ({ idxCollapsed: { ...s.idxCollapsed, [ck]: !s.idxCollapsed[ck] } }));

  const setFgUrl = (v: string) => {
    const p = parseFigmaUrl(v); const patch: Partial<typeof fg> = { url: v };
    const slug = p.kind === 'file' ? p.slugName : '';
    if ((!state.fg.name || state.fg.nameAuto) && slug) { patch.name = slug; patch.nameAuto = true; } else if (state.fg.nameAuto && !slug) { patch.name = ''; patch.nameAuto = false; }
    actions.setFg(patch);
  };
  const addFigmaFile = (e: FormEvent) => {
    e.preventDefault();
    const f2 = state.fg; const er = validateAdd(f2, state.fstore.files);
    if (er.url || er.name || er.parsed.kind !== 'file') { actions.setFg({ touched: true }); return; }
    const nf = newFile({ key: er.parsed.key, url: f2.url.trim(), name: f2.name.trim(), role: f2.role, nameSource: f2.nameAuto ? 'link' : 'manual' });
    actions.mutateFstore((st) => ({ ...st, files: [nf, ...st.files] })); actions.setFg({ url: '', name: '', touched: false, nameAuto: false });
    actions.showToast(`Added “${nf.name}”`);
  };

  // ── details state ──
  const fOpen = state.fgOpen ? fst.files.find((f) => f.key === state.fgOpen) || null : null;
  if (fOpen) {
    let fsel: { id: string; nodeId: string; name: string; skipped?: boolean; group: string } | null = null;
    if (fOpen.index && state.fgPage) for (const g of fOpen.index.groups) { const p = g.pages.find((x) => x.id === state.fgPage); if (p) { fsel = { ...p, group: g.name }; break; } }
    const fLinks = fsel ? fst.links.filter((l) => l.fileKey === fOpen.key && l.pageId === fsel!.id) : [];
    const pageCards = fLinks.map((l) => cards.find((i) => i.id === l.issueId)).filter(Boolean) as typeof cards;
    const kv = (k: string, v: string, m?: boolean) => ({ k, v, color: m ? MUTED : FGC });
    return (
      <>
        <div style={sx('display:flex; flex-direction:column; gap:10px;')}>
          <button type="button" onClick={() => actions.setState({ fgOpen: null, fgPage: null })} className="hv-fg" style={sx('align-self:flex-start; display:inline-flex; align-items:center; gap:6px; padding:0; border:0; background:transparent; font:inherit; font-size:13px; color:var(--muted-foreground); cursor:pointer;')}><ArrowLeftIcon size={14} />All Figma files</button>
          <div style={sx('display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:16px;')}>
            <div style={sx('display:flex; flex-direction:column; gap:6px; min-width:0;')}>
              <div style={sx('display:flex; align-items:center; gap:8px; flex-wrap:wrap;')}><Pill label={roleOf(fOpen.role).label} tone={roleOf(fOpen.role).tone} /><span style={sx('font-size:13px; color:var(--muted-foreground);')}>{fOpen.scope ? 'New IA design scope · tracked by link' : `Tracked by link · added ${timeAgo(fOpen.addedAt)}`}</span></div>
              <h1 style={sx(H1)}>{fOpen.name}</h1>
            </div>
            <div style={sx('display:flex; flex-wrap:wrap; gap:8px; align-items:center;')}>
              <OutlineLink href={fOpen.url} iconSize={14}>Open in Figma</OutlineLink>
              <Button variant="outline" disabled={syncDisabled(fOpen)} title={fAd.canSync ? '' : fAd.reason} onClick={() => actions.syncFile(fOpen.key)}><ArrowsClockwiseIcon size={15} />{syncLabel(fOpen)}</Button>
              <Button variant="outline" disabled={!fAd.canScan} title={fAd.canScan ? '' : fAd.scanReason} onClick={() => actions.scanFile(fOpen.key)}>Scan usage</Button>
            </div>
          </div>
          {fOpen.indexSyncStatus === 'error' && (
            <p role="status" style={sx('margin:0; font-size:12px; color:var(--destructive);')}>{`Latest sync failed: ${fOpen.indexSyncError || 'unknown error'}${fOpen.index ? ` Showing the index from ${syncedLabel(fOpen.indexSyncedAt).replace(/^Last synced /, '')}.` : ''}`}</p>
          )}
          {!fLoading && <p style={sx('margin:0; font-size:12px; color:var(--muted-foreground);')}>{unavailable}</p>}
        </div>
        <div style={sx('display:grid; gap:24px; align-items:start;', { gridTemplateColumns: isMobile || state.width < 1100 ? 'minmax(0,1fr)' : '260px minmax(0,1fr)' })}>
          <FileIndex title="Index" syncText={fOpen.indexSyncStatus === 'syncing' ? 'Syncing…' : syncedLabel(fOpen.indexSyncedAt)} syncTextTitle={exactTime(fOpen.indexSyncedAt)} groups={indexGroups(fOpen, fst.links, state.idxCollapsed, toggleGroup, state.fgPage, (id) => actions.setState({ fgPage: id }), '')}
            emptyTitle={fConn ? 'No index synced yet' : 'Index unavailable'} emptyText={fConn ? 'Use Sync Index to read this file’s pages from Figma.' : 'This file hasn’t been indexed. Connect Figma, then Sync Index to read its real pages and groups. Nothing is shown until then.'} showSync={false} />
          <section style={sx('display:flex; flex-direction:column; gap:16px; min-width:0;')}>
            {fsel ? (
              <>
                <div style={sx('display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:12px;')}>
                  <div style={sx('display:flex; flex-direction:column; gap:4px; min-width:0;')}>
                    <span style={sx('font-size:12px; color:var(--muted-foreground);')}>{`${fOpen.name} › ${fsel.group}`}</span>
                    <h2 style={sx('margin:0; font-size:18px; font-weight:600; letter-spacing:-0.01em;')}>{fsel.name}</h2>
                  </div>
                  <OutlineLink href={frameUrl(fOpen, fsel.nodeId)} iconSize={14}>Open page in Figma</OutlineLink>
                </div>
                <KeyValues boxed cols="140px" rows={[kv('Group', fsel.group), kv('Page ID', fsel.nodeId), kv('Status', fsel.skipped ? 'Skipped. Listed here, left out of usage scans and Directory linking.' : 'Active', fsel.skipped), kv('Component usage', usageLine(fOpen), fOpen.usageStatus !== 'ok')]} />
                <div style={sx('display:flex; align-items:center; justify-content:space-between; gap:8px;')}>
                  <span style={sx('font-size:11px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; color:var(--muted-foreground);')}>Linked Linear cards</span>
                  {!fsel.skipped && <Button variant="ghost" size="sm" onClick={() => actions.openLink({ fileKey: fOpen.key, pageId: fsel!.id })}><LinkSimpleIcon size={14} />Link a card</Button>}
                </div>
                <div style={sx('display:flex; flex-direction:column; border:1px solid var(--border); border-radius:12px; background:var(--card); overflow:hidden;')}>
                  {pageCards.map((cd) => (
                    <button key={cd.id} type="button" onClick={() => actions.setState({ dirCard: cd.id, clNote: '' })} className="hv-muted" style={sx('display:flex; align-items:center; gap:12px; padding:12px 14px; border:0; border-bottom:1px solid var(--border); background:transparent; color:var(--foreground); font:inherit; text-align:left; cursor:pointer;')}>
                      <span style={sx(`flex:none; width:56px; font-family:${MONO}; font-size:12px; color:var(--muted-foreground);`)}>{cd.id}</span>
                      <span style={sx('flex:1; min-width:0; font-weight:500; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;')}>{cd.title}</span>
                      <Pill label={cd.status} tone={cd.tone} />
                    </button>
                  ))}
                  {pageCards.length === 0 && <p style={sx('margin:0; padding:18px 14px; font-size:13px; color:var(--muted-foreground);')}>{fsel.skipped ? 'Skipped pages can’t be linked to Linear cards.' : linearLoading ? 'Loading Linear cards…' : 'No Linear cards are linked to this page yet.'}</p>}
                </div>
              </>
            ) : (
              <>
                <h2 style={sx('margin:0; font-size:15px; font-weight:600;')}>File details</h2>
                <KeyValues boxed cols="140px" rows={[
                  kv('Role', roleOf(fOpen.role).label), kv('Last updated', fOpen.lastModified ? formatShort(fOpen.lastModified) : 'Unknown, needs Figma', !fOpen.lastModified),
                  kv('Pages', fOpen.pageCount == null ? 'Unknown, needs Figma' : String(fOpen.pageCount), fOpen.pageCount == null), kv('Last index sync', fOpen.indexSyncedAt ? `${syncedLabel(fOpen.indexSyncedAt).replace(/^Last synced /, '')} · ${exactTime(fOpen.indexSyncedAt)}` : 'Never synced', !fOpen.indexSyncedAt),
                  kv('Component usage', usageLine(fOpen), fOpen.usageStatus !== 'ok'), kv('Linked cards', String(fst.links.filter((l) => l.fileKey === fOpen.key).length)), kv('File key', fOpen.key)]} />
                <p style={sx('margin:0; font-size:13px; color:var(--muted-foreground); text-wrap:pretty;')}>{fOpen.index ? 'Select a page in the index to see its path, linked Linear cards and a direct link to the page in Figma.' : 'Once indexed, this file’s real pages appear in the index panel and in Directory. Both views read the same index.'}</p>
              </>
            )}
          </section>
        </div>
      </>
    );
  }

  // ── list state ──
  return (
    <>
      <header style={sx('display:flex; flex-direction:column; gap:4px; min-width:0;')}>
        <span style={sx('font-size:13px; color:var(--muted-foreground);')}>{`${fst.files.length} tracked file${fst.files.length === 1 ? '' : 's'} · Figma ${fLoading ? 'checking…' : fConn ? 'connected' : 'not connected'} · saved in this browser`}</span>
        <h1 style={sx(H1)}>Figma files</h1>
        <p style={sx('margin:0; color:var(--muted-foreground); text-wrap:pretty;')}>Files tracked by the design directory. Sync each file’s index and scan where components are used. Nothing here edits the Figma files.</p>
      </header>
      {!fConn && !fLoading && <Banner minWidth={220} onAction={() => actions.setState({ dialog: 'integrations' })}>Figma isn’t connected. You can track files by link with the details you enter. Sync Index and Scan usage stay off until Figma is connected, and folders can’t be listed, so add each file by its own link.</Banner>}
      <form onSubmit={addFigmaFile} noValidate style={sx('display:grid; gap:12px; align-items:start; padding:16px 18px; border:1px solid var(--border); border-radius:12px; background:var(--card);', { gridTemplateColumns: isMobile ? 'minmax(0,1fr)' : 'minmax(0,2.2fr) minmax(0,1.4fr) minmax(0,1fr) auto' })}>
        <div style={sx('display:flex; flex-direction:column; gap:6px; min-width:0;')}>
          <label htmlFor="fg-url" style={sx('font-size:13px; font-weight:500;')}>Figma file link</label>
          <Input id="fg-url" type="url" placeholder="https://www.figma.com/design/…" value={fg.url} aria-invalid={fg.touched && !!fErr.url} onChange={(e) => setFgUrl(val(e))} />
          <span style={sx('font-size:12px; color:var(--destructive);')}>{fg.touched ? fErr.url : ''}</span>
        </div>
        <div style={sx('display:flex; flex-direction:column; gap:6px; min-width:0;')}>
          <label htmlFor="fg-name" style={sx('font-size:13px; font-weight:500;')}>Name</label>
          <Input id="fg-name" placeholder="LEX UI-003 - Settings" value={fg.name} aria-invalid={fg.touched && !!fErr.name} onChange={(e) => actions.setFg({ name: val(e), nameAuto: false })} />
          <span style={sx('font-size:12px;', { color: fg.touched && fErr.name ? 'var(--destructive)' : MUTED })}>{fg.touched && fErr.name ? fErr.name : fg.nameAuto ? 'Taken from the link. Edit if needed.' : fConn ? 'Filled in from Figma when the link resolves.' : 'Enter the file name. Figma isn’t connected.'}</span>
        </div>
        <div style={sx('display:flex; flex-direction:column; gap:6px; min-width:0;')}>
          <label htmlFor="fg-role" style={sx('font-size:13px; font-weight:500;')}>Role</label>
          <div style={sx('width:100%; min-width:0;')}>
            <NativeSelect id="fg-role" className="w-full" value={fg.role} onChange={(e) => actions.setFg({ role: val(e) as TrackedFile['role'] })}>
              {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </NativeSelect>
          </div>
        </div>
        <div style={sx('display:flex; flex-direction:column; gap:6px;')}>
          <span aria-hidden="true" style={sx('font-size:13px; font-weight:500; visibility:hidden;')}>&#8203;</span>
          <Button type="submit"><PlusIcon size={15} />Add file</Button>
        </div>
      </form>
      <div style={sx('display:flex; flex-wrap:wrap; align-items:center; gap:10px 14px; padding:12px 16px; border-radius:12px; background:var(--muted);')}>
        <label style={sx('display:flex; align-items:center; gap:10px; font-size:13px; font-weight:500;')}>
          <Switch checked={fst.skip.enabled} onCheckedChange={(v: boolean) => { actions.mutateFstore((st) => ({ ...st, skip: { ...st.skip, enabled: !!v } })); actions.reapplySkip(); }} aria-label="Skip working pages" />
          Skip working pages when indexing
        </label>
        <div style={sx('display:flex; flex-wrap:wrap; gap:6px;', { opacity: fst.skip.enabled ? 1 : 0.5 })}>
          {SKIP_GROUPS.map((g) => (
            <Toggle key={g} variant="outline" size="sm" pressed={fst.skip.groups.includes(g)} disabled={!fst.skip.enabled} onPressedChange={() => { actions.mutateFstore((st) => ({ ...st, skip: { ...st.skip, groups: toggleIn(st.skip.groups, g) } })); actions.reapplySkip(); }}>{g}</Toggle>
          ))}
        </div>
        <span style={sx('flex-basis:100%; font-size:12px; color:var(--muted-foreground);')}>{fst.skip.enabled ? 'Pressed groups are still listed in Directory, marked Skipped, and left out of usage scans.' : 'Every page group will be indexed and scanned.'}</span>
      </div>
      <section style={sx('display:flex; flex-direction:column; gap:12px; min-width:0;')}>
        <div style={sx('display:flex; flex-wrap:wrap; align-items:center; gap:10px;')}>
          <h2 style={sx('margin:0; font-size:15px; font-weight:600;')}>Tracked files</h2>
          <span style={sx('font-size:12px; color:var(--muted-foreground); font-variant-numeric:tabular-nums;')}>{fList.length === fst.files.length ? String(fst.files.length) : `${fList.length} of ${fst.files.length}`}</span>
          <span style={sx('flex:1;')} />
          <div style={sx('width:220px; max-width:100%;')}><Input type="search" placeholder="Search files" aria-label="Search files" value={fg.search} onChange={(e) => actions.setFg({ search: val(e) })} /></div>
          <NativeSelect aria-label="Filter by role" value={fg.roleFilter} onChange={(e) => actions.setFg({ roleFilter: val(e) })}>
            <option value="">All roles</option>
            {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </NativeSelect>
        </div>
        <div style={sx('display:flex; flex-direction:column; border:1px solid var(--border); border-radius:12px; background:var(--card); overflow:hidden;')}>
          {!isMobile && fList.length > 0 && (
            <div style={sx('display:grid; gap:16px; padding:8px 16px; border-bottom:1px solid var(--border); background:var(--muted); font-size:12px; font-weight:500; color:var(--muted-foreground);', { gridTemplateColumns: rowCols })}>
              <span>File</span><span>Pages</span><span>Index</span><span>Component usage</span><span style={sx('text-align:right;')}>Actions</span>
            </div>
          )}
          {fList.map((f) => {
            const r = roleOf(f.role); const confirm = state.confirmFile === f.key; const nl = fst.links.filter((l) => l.fileKey === f.key).length;
            const usageText = f.usageStatus === 'ok' && f.usage ? usageLine(f) : f.usageStatus === 'running' ? 'Scanning…' : 'Not scanned';
            return (
              <div key={f.key} style={sx('display:grid; gap:10px 16px; align-items:center; padding:12px 16px; border-bottom:1px solid var(--border);', { gridTemplateColumns: rowCols })}>
                <div style={sx('display:flex; flex-direction:column; gap:4px; min-width:0;')}>
                  <div style={sx('display:flex; align-items:center; gap:8px; min-width:0;')}>
                    <button type="button" onClick={() => actions.setState({ fgOpen: f.key, fgPage: null, confirmFile: null })} title="Open file details" className="hv-underline" style={sx('min-width:0; padding:0; border:0; background:transparent; font:inherit; font-size:14px; font-weight:600; color:var(--foreground); text-align:left; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; cursor:pointer;')}>{f.name}</button>
                    <a href={f.url} target="_blank" rel="noreferrer" aria-label={`Open ${f.name} in Figma`} className="hv-fg" style={sx('flex:none; display:inline-flex; align-items:center; gap:3px; font-size:12px; color:var(--muted-foreground); text-decoration:none;')}>Open in Figma<ArrowUpRightIcon size={12} /></a>
                  </div>
                  <div style={sx('display:flex; flex-wrap:wrap; align-items:center; gap:6px 8px; font-size:12px; color:var(--muted-foreground);')}>
                    <Pill label={r.label} tone={r.tone} />
                    <span style={sx(`font-family:${MONO};`)}>{f.key.slice(0, 8)}</span>
                    <span>{f.lastModified ? `updated ${timeAgo(f.lastModified)}` : 'last updated unknown'}</span>
                    {nl > 0 && <button type="button" onClick={() => actions.go('directory', { dir: { ...state.dir, fileKey: f.key, pageId: null } })} style={sx('border:0; padding:0; background:transparent; font:inherit; color:var(--foreground); text-decoration:underline; cursor:pointer;')}>{`${nl} linked card${nl === 1 ? '' : 's'}`}</button>}
                  </div>
                </div>
                <span style={sx('font-size:13px; font-variant-numeric:tabular-nums;', { color: f.pageCount == null ? MUTED : FGC })}>{f.pageCount == null ? (isMobile ? 'Pages —' : '—') : (isMobile ? `${f.pageCount} pages` : String(f.pageCount))}</span>
                <span style={sx('display:flex; flex-direction:column; gap:2px; font-size:13px;')}>
                  <span title={f.indexSyncedAt ? exactTime(f.indexSyncedAt) : 'No index synced yet'} style={{ color: f.indexSyncedAt ? FGC : MUTED }}>{f.indexSyncStatus === 'syncing' && !f.indexSyncedAt ? 'Syncing…' : syncedLabel(f.indexSyncedAt)}</span>
                  {f.index && (
                    <button type="button" onClick={() => openIndex(f)} className="hv-fg" title={`Open the index from ${exactTime(f.indexSyncedAt)}`} style={sx('align-self:flex-start; display:inline-flex; align-items:center; gap:4px; border:0; padding:0; background:transparent; font:inherit; font-size:12px; color:var(--muted-foreground); text-decoration:underline; cursor:pointer;')}><ListIcon size={12} />View index</button>
                  )}
                  {failedLine(f)}
                </span>
                <span style={sx('font-size:13px;', { color: f.usageStatus === 'ok' ? FGC : MUTED })}>{usageText}</span>
                <div style={sx('display:flex; flex-wrap:wrap; align-items:center; gap:6px;', { justifyContent: isMobile ? 'flex-start' : 'flex-end' })}>
                  {!confirm && (
                    <>
                      <Button variant="outline" size="sm" disabled={syncDisabled(f)} title={fAd.canSync ? '' : fAd.reason} onClick={() => actions.syncFile(f.key)}>{syncLabel(f)}</Button>
                      <Button variant="outline" size="sm" disabled={!fAd.canScan} title={fAd.canScan ? '' : fAd.scanReason} onClick={() => actions.scanFile(f.key)}>Scan usage</Button>
                      <NativeSelect size="sm" aria-label={`Role for ${f.name}`} value={f.role} onChange={(e) => { const v = val(e) as TrackedFile['role']; actions.patchFile(f.key, { role: v }); actions.showToast(`Role set to ${roleOf(v).label}`); }}>
                        {ROLES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                      </NativeSelect>
                      <Button variant="ghost" size="icon-sm" aria-label={`Remove ${f.name} from directory`} title="Remove from directory" onClick={() => actions.setState({ confirmFile: f.key })}><TrashIcon size={15} /></Button>
                    </>
                  )}
                  {confirm && (
                    <>
                      <span style={sx('font-size:13px;')}>Remove from directory?</span>
                      <Button variant="ghost" size="sm" onClick={() => actions.setState({ confirmFile: null })}>Cancel</Button>
                      <Button variant="destructive" size="sm" onClick={() => {
                        const snapF = f; const snapL = state.fstore.links.filter((l) => l.fileKey === f.key);
                        actions.mutateFstore((st) => ({ ...st, files: st.files.filter((x) => x.key !== f.key), links: st.links.filter((l) => l.fileKey !== f.key) }));
                        actions.setState({ confirmFile: null });
                        actions.showToast('Removed from directory', { label: 'Undo', run: () => actions.mutateFstore((s2) => ({ ...s2, files: [...s2.files, snapF], links: [...s2.links, ...snapL] })) });
                      }}>Remove</Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {fst.files.length === 0 && (
            <div style={sx('display:flex; flex-direction:column; align-items:center; gap:6px; padding:36px 16px; text-align:center;')}>
              <strong style={sx('font-weight:600;')}>No tracked files yet</strong>
              <span style={sx('font-size:13px; color:var(--muted-foreground); max-width:52ch; text-wrap:pretty;')}>Paste a Figma file link above. Files from the LEX folder can’t be listed automatically until Figma is connected, so add them one link at a time.</span>
            </div>
          )}
          {fst.files.length > 0 && fList.length === 0 && <p style={sx('margin:0; padding:24px 16px; font-size:13px; color:var(--muted-foreground); text-align:center;')}>No files match.</p>}
        </div>
        {!fLoading && fst.files.length > 0 && <p style={sx('margin:0; font-size:12px; color:var(--muted-foreground);')}>{unavailable}</p>}
      </section>
    </>
  );
}
