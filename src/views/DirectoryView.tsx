// Directory (HANDOFF §11.2): Figma file → design page → Linear card. Linear cards are the live assigned issues.
import { useApp, val } from '../app/store';
import { Button, Input, LinkSimpleIcon, NativeSelect } from '../components/ds';
import { FileIndex } from '../components/FileIndex';
import { Pill } from '../components/Pill';
import { H1, Loading } from '../components/ui';
import { formatShort } from '../lib/dates';
import { MONO, sx } from '../lib/sx';
import { figmaAdapter } from '../data/figmaAdapter';
import { cardOf, indexGroups } from './indexGroups';

export function DirectoryView() {
  const { state, actions, c, isMobile, linearLoading } = useApp();
  const fst = state.fstore, dS = state.dir;
  const fConn = figmaAdapter.mode === 'connected';
  const dKey = fst.files.some((f) => f.key === dS.fileKey) ? dS.fileKey : fst.files[0]?.key || '';
  const dFile = fst.files.find((f) => f.key === dKey) || null;
  const dq = dS.search.trim().toLowerCase();
  const dLinks = fst.links.filter((l) => l.fileKey === dKey);
  const lin = c.integrations.linear;
  const cards = c.issues.map((i) => cardOf(i, c));
  const groups = indexGroups(dFile, fst.links, state.idxCollapsed, (ck) => actions.setState((s) => ({ idxCollapsed: { ...s.idxCollapsed, [ck]: !s.idxCollapsed[ck] } })), dS.pageId, (id) => actions.setDir({ pageId: id }), dq);
  let selPage: { id: string; name: string; group: string } | null = null;
  if (dFile?.index && dS.pageId) for (const g of dFile.index.groups) { const p = g.pages.find((x) => x.id === dS.pageId); if (p) { selPage = { ...p, group: g.name }; break; } }
  const linkedIds = new Set(fst.links.map((l) => l.issueId));
  const cardsAll = cards.filter((i) => !dq || `${i.id} ${i.title} ${i.project || ''}`.toLowerCase().includes(dq));
  const pageCards = selPage ? dLinks.filter((l) => l.pageId === selPage!.id).map((l) => cards.find((i) => i.id === l.issueId)).filter(Boolean) as typeof cards : [];
  const openCard = (id: string) => actions.setState({ dirCard: id, clNote: '' });
  const noIndexText = fConn ? 'Sync this file’s index to browse its pages here.' : 'Add a Figma file and sync its index once Figma is connected. Pages appear here after the first sync.';
  const linearBadge = lin.mode === 'connected' && lin.lastSyncedAt ? `From Linear · ${formatShort(lin.lastSyncedAt)}` : lin.mode === 'sample' ? 'Sample Linear data' : 'Linear unavailable';
  const assignee = c.viewer.linearName || c.viewer.name;
  const fetched = lin.lastSyncedAt ? formatShort(lin.lastSyncedAt) : '—';

  return (
    <>
      <header style={sx('display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:16px;')}>
        <div style={sx('display:flex; flex-direction:column; gap:4px; min-width:0;')}>
          <span style={sx('font-size:13px; color:var(--muted-foreground);')}>{`${fst.files.length} tracked file${fst.files.length === 1 ? '' : 's'} · ${fst.files.filter((f) => f.index).length} indexed · ${fst.links.length} linked card${fst.links.length === 1 ? '' : 's'}`}</span>
          <h1 style={sx(H1)}>Directory</h1>
          <p style={sx('margin:0; color:var(--muted-foreground); text-wrap:pretty;')}>Each Figma file’s index, the Linear cards designed in it, and their versions and changelog.</p>
        </div>
      </header>
      <div style={sx('display:flex; flex-wrap:wrap; align-items:center; gap:8px;')}>
        <NativeSelect aria-label="Figma file" value={dKey} onChange={(e) => actions.setDir({ fileKey: val(e), pageId: null })} disabled={!fst.files.length}>
          {!fst.files.length && <option value="">No tracked files</option>}
          {fst.files.map((f) => <option key={f.key} value={f.key}>{f.name}</option>)}
        </NativeSelect>
        <div style={sx('width:260px; max-width:100%;')}>
          <Input type="search" placeholder="Filter pages and cards" aria-label="Filter pages and cards" value={dS.search} onChange={(e) => actions.setDir({ search: val(e) })} />
        </div>
        <Button onClick={() => actions.openLink({})}><LinkSimpleIcon size={15} />Link a card</Button>
      </div>
      <div style={sx('display:grid; gap:24px; align-items:start;', { gridTemplateColumns: isMobile || state.width < 1100 ? 'minmax(0,1fr)' : '260px minmax(0,1fr)' })}>
        <FileIndex
          title={dFile ? dFile.name : 'File index'} syncText={dFile ? (dFile.indexSyncedAt ? `Synced ${formatShort(dFile.indexSyncedAt)}` : 'Not synced') : ''} groups={groups}
          emptyTitle={dFile ? 'No Figma index yet' : 'No tracked files'}
          emptyText={!dFile ? 'Add a Figma file by link to start building the directory.' : groups.length || !dFile.index ? noIndexText : 'No pages match.'}
          showSync={!!dFile} syncDisabled={!figmaAdapter.canSync} syncTitle={figmaAdapter.canSync ? '' : figmaAdapter.reason} onSync={() => dFile && actions.syncFile(dFile.key)}
          actionLabel={dFile ? '' : 'Go to Figma files'} onAction={() => actions.go('figma')}
        />
        <section style={sx('display:flex; flex-direction:column; gap:14px; min-width:0;')}>
          {selPage && (
            <>
              <div style={sx('display:flex; flex-direction:column; gap:4px;')}>
                <span style={sx('font-size:12px; color:var(--muted-foreground);')}>{`${dFile!.name} › ${selPage.group}`}</span>
                <h2 style={sx('margin:0; font-size:18px; font-weight:600; letter-spacing:-0.01em;')}>{selPage.name}</h2>
              </div>
              <span style={sx('font-size:11px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; color:var(--muted-foreground);')}>Cards designed on this page</span>
              <div style={sx('display:flex; flex-direction:column; border:1px solid var(--border); border-radius:12px; background:var(--card); overflow:hidden;')}>
                {pageCards.map((cd) => (
                  <button key={cd.id} type="button" onClick={() => openCard(cd.id)} className="hv-muted" style={sx('display:flex; align-items:center; gap:12px; padding:12px 14px; border:0; border-bottom:1px solid var(--border); background:transparent; color:var(--foreground); font:inherit; text-align:left; cursor:pointer;')}>
                    <span style={sx(`flex:none; width:64px; font-family:${MONO}; font-size:12px; color:var(--muted-foreground);`)}>{cd.id}</span>
                    <span style={sx('flex:1; min-width:0; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;')}>{cd.title}</span>
                    <Pill label={cd.status} tone={cd.tone} />
                  </button>
                ))}
                {pageCards.length === 0 && <p style={sx('margin:0; padding:20px 14px; font-size:13px; color:var(--muted-foreground);')}>No cards linked to this page yet. Use Link a card.</p>}
              </div>
            </>
          )}
          {!selPage && (
            <>
              <div style={sx('display:flex; align-items:center; gap:8px; flex-wrap:wrap;')}>
                <h2 style={sx('margin:0; font-size:15px; font-weight:600;')}>Your Linear cards</h2>
                <Pill label={linearBadge} tone={lin.mode === 'sample' ? 'sample' : 'info'} />
              </div>
              {linearLoading ? <Loading /> : (
                <>
                  <p style={sx('margin:0; font-size:13px; color:var(--muted-foreground); text-wrap:pretty;')}>
                    {lin.mode === 'connected'
                      ? `${cards.length} issues assigned to ${assignee}, retrieved from Linear on ${fetched}. ${fst.links.length ? `${linkedIds.size} linked to a design page.` : 'None are linked to a design page yet.'} Select a card to see its details.`
                      : lin.mode === 'sample' ? `${cards.length} sample issues. Select a card to see its details.`
                      : `Linear isn’t available${lin.error ? `: ${lin.error}` : '.'} Your cards appear here once it is.`}
                  </p>
                  <div style={sx('display:flex; flex-direction:column; border:1px solid var(--border); border-radius:12px; background:var(--card); overflow:hidden;')}>
                    {cardsAll.map((cd) => (
                      <button key={cd.id} type="button" onClick={() => openCard(cd.id)} className="hv-muted" style={sx('display:flex; align-items:center; gap:12px; padding:10px 14px; border:0; border-bottom:1px solid var(--border); background:transparent; color:var(--foreground); font:inherit; text-align:left; cursor:pointer;')}>
                        <span style={sx(`flex:none; width:56px; font-family:${MONO}; font-size:12px; color:var(--muted-foreground);`)}>{cd.id}</span>
                        <span style={sx('flex:1; min-width:0; display:flex; flex-direction:column; gap:1px;')}>
                          <span style={sx('font-weight:500; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; text-wrap:pretty;')}>{cd.title}</span>
                          <span style={sx('font-size:12px; color:var(--muted-foreground); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;')}>{cd.meta}</span>
                        </span>
                        {!isMobile && <Pill label={linkedIds.has(cd.id) ? 'Linked' : 'Not linked'} tone={linkedIds.has(cd.id) ? 'design' : 'none'} />}
                        <Pill label={cd.status} tone={cd.tone} />
                      </button>
                    ))}
                    {cardsAll.length === 0 && <p style={sx('margin:0; padding:20px 14px; font-size:13px; color:var(--muted-foreground);')}>No Linear cards match.</p>}
                  </div>
                </>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
