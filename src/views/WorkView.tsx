// Lumin Work (HANDOFF §2): cycle, Now and next, My projects, My issues, Figma work.
import { badgeLabel, showBadge } from '../app/badges';
import { useApp, val } from '../app/store';
import { ArrowDownIcon, Button, Input, NativeSelect, Progress, Tabs, TabsList, TabsTrigger } from '../components/ds';
import { FigmaTile } from '../components/FigmaTile';
import { IssueCard } from '../components/IssueCard';
import { IssueRow } from '../components/IssueRow';
import { Pill } from '../components/Pill';
import { PriorityIcon } from '../components/PriorityIcon';
import { ProjectCard } from '../components/ProjectCard';
import { Banner, EYEBROW, H1, H2, HeadLink, Loading, OutlineLink, PANEL } from '../components/ui';
import type { Issue } from '../data/types';
import { daysUntil, formatShort } from '../lib/dates';
import { MONO, sx } from '../lib/sx';
import { BUCKET_LABEL, bucketOf, byUpdated, byUrgency, fileVM, isOpen, issueVM, projectVM, type Bucket } from '../rules/pdd';

const W_VIEWS = [['assigned', 'Assigned to me'], ['progress', 'In progress'], ['next', 'Up next'], ['updated', 'Recently updated']] as const;

export function WorkView() {
  const { state, actions, c, isMobile, linearLoading, figmaRef } = useApp();
  const isDesktop = !isMobile;
  const w = state.w;
  const open = c.issues.filter(isOpen);
  const vm = (i: Issue) => issueVM(i, c);
  const dcount = (i: Issue) => (c.designLinks.get(i.id) || []).length;
  const tests: Record<string, (i: Issue) => boolean> = { assigned: isOpen, progress: (i) => ['in-progress', 'in-review'].includes(bucketOf(i)), next: (i) => bucketOf(i) === 'up-next', updated: (i) => Date.now() - new Date(i.updatedAt).getTime() < 7 * 86400000 };
  const sorts: Record<string, (a: Issue, b: Issue) => number> = { urgency: byUrgency, due: (a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'), priority: (a, b) => (a.priority || 5) - (b.priority || 5), updated: byUpdated };
  const q = w.search.trim().toLowerCase();
  const rows = c.issues.filter(tests[w.view] || isOpen).filter((i) => !w.project || i.projectId === w.project)
    .filter((i) => w.design === 'any' || (w.design === 'with' ? dcount(i) > 0 : dcount(i) === 0))
    .filter((i) => !q || `${i.identifier} ${i.title} ${i.labels.join(' ')}`.toLowerCase().includes(q)).sort(sorts[w.sort]);
  const sortHead = (k: string, label: string) => {
    const on = w.sort === k;
    return (
      <th key={k} scope="col" aria-sort={on ? 'ascending' : undefined} style={sx('padding:8px 12px; text-align:left;')}>
        <button type="button" onClick={() => actions.setW({ sort: k })} style={sx('display:inline-flex; align-items:center; gap:4px; border:0; padding:0; background:transparent; font:inherit; cursor:pointer;', { fontWeight: on ? 600 : 500, color: on ? 'var(--foreground)' : 'var(--muted-foreground)' })}>{label}{on && <ArrowDownIcon size={12} />}</button>
      </th>
    );
  };
  const cycle = c.cycle;
  const cycleLeft = cycle ? daysUntil(cycle.endsAt) : 0;
  const cycleIssues = cycle ? c.issues.filter((i) => i.cycleId === cycle.id) : [];
  const missing = open.filter((i) => bucketOf(i) !== 'up-next' && dcount(i) === 0).concat(open.filter((i) => bucketOf(i) === 'up-next' && dcount(i) === 0));
  const files = [...c.figmaFiles].sort((a, b) => b.lastModified.localeCompare(a.lastModified));
  const lin = c.integrations.linear, fig = c.integrations.figma;
  const openIntegrations = () => actions.setState({ dialog: 'integrations' });
  // Banner: shown until both integrations are live (HANDOFF §2). Copy varies with what is actually missing.
  const banner = lin.mode === 'connected' && fig.mode === 'connected' ? null
    : lin.mode === 'sample' ? 'Linear and Figma aren’t connected. Issues, projects and files on this page are sample data showing how your real work will appear.'
    : lin.mode === 'error' ? `Linear couldn’t be loaded${lin.error ? `: ${lin.error}` : '.'} Nothing here is sample data.`
    : lin.mode !== 'connected' && fig.mode === 'connected' ? 'Linear isn’t connected. Your issues and projects appear here once it is.'
    : lin.mode !== 'connected' ? 'Linear and Figma aren’t connected. Your issues, projects and files appear here once they are.'
    : 'Figma isn’t connected, so Figma work and design links on this page stay empty until it is.';
  const thStyle = sx('padding:8px 12px; text-align:left; font-weight:500; color:var(--muted-foreground);');

  return (
    <>
      <header style={sx('display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:16px;')}>
        <div style={sx('display:flex; flex-direction:column; gap:4px; min-width:0;')}>
          <span style={sx('font-size:13px; color:var(--muted-foreground);')}>{cycle ? `${cycle.name} · ${formatShort(cycle.startsAt)} – ${formatShort(cycle.endsAt)}` : linearLoading ? ' ' : 'No active cycle'}</span>
          <h1 style={sx(H1)}>Lumin Work</h1>
          <p style={sx('margin:0; color:var(--muted-foreground); text-wrap:pretty;')}>Issues and projects assigned to you in Linear, with the Figma work behind them.</p>
        </div>
        <OutlineLink href={c.links.myIssues}>My issues in Linear</OutlineLink>
      </header>

      {!linearLoading && banner && <Banner onAction={openIntegrations}>{banner}</Banner>}

      {linearLoading ? <Loading /> : (
        <>
          <section style={sx('display:flex; flex-direction:column; gap:10px; padding:16px 18px; border:1px solid var(--border); border-radius:12px; background:var(--card);')}>
            <div style={sx('display:flex; align-items:center; gap:8px; flex-wrap:wrap;')}>
              <h2 style={sx(H2)}>{cycle ? cycle.name : 'No active cycle'}</h2>
              <span style={sx('font-size:12px; color:var(--muted-foreground);')}>{cycle ? `${cycleLeft} day${cycleLeft === 1 ? '' : 's'} left · ${cycleIssues.filter((i) => bucketOf(i) === 'done').length} of ${cycleIssues.length} of your issues done` : 'Your team has no cycle running in Linear right now.'}</span>
              {cycle && <HeadLink href={cycle.url}>Open cycle</HeadLink>}
            </div>
            {cycle && <Progress value={Math.round(cycle.progress * 100)} />}
          </section>

          <section style={sx('display:flex; flex-direction:column; gap:12px;')}>
            <h2 style={sx(H2)}>Now and next</h2>
            <div style={sx('display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 240px), 1fr)); gap:12px; align-items:start;')}>
              {(['in-progress', 'in-review', 'up-next'] as Bucket[]).map((b) => {
                const items = open.filter((i) => bucketOf(i) === b).sort(byUrgency);
                return (
                  <div key={b} style={sx('display:flex; flex-direction:column; gap:8px; padding:10px; border-radius:12px; background:var(--muted);')}>
                    <div style={sx('display:flex; align-items:center; justify-content:space-between; padding:2px 4px;')}>
                      <Pill label={BUCKET_LABEL[b]} tone={b} />
                      <span style={sx('font-size:12px; color:var(--muted-foreground); font-variant-numeric:tabular-nums;')}>{items.length}</span>
                    </div>
                    {items.slice(0, 4).map((i) => <IssueCard key={i.id} issue={vm(i)} onOpen={actions.openIssue} />)}
                    {items.length > 4 && <Button variant="ghost" size="sm" onClick={() => actions.setW({ view: b === 'up-next' ? 'next' : 'progress' })}>{`Show all ${items.length}`}</Button>}
                    {!items.length && <p style={sx('margin:0; padding:4px 4px 8px; font-size:13px; color:var(--muted-foreground);')}>{`Nothing ${BUCKET_LABEL[b].toLowerCase()}.`}</p>}
                  </div>
                );
              })}
            </div>
          </section>

          <section style={sx('display:flex; flex-direction:column; gap:12px;')}>
            <div style={sx('display:flex; align-items:baseline; gap:8px; flex-wrap:wrap;')}>
              <h2 style={sx(H2)}>My projects</h2>
              <span style={sx('font-size:12px; color:var(--muted-foreground);')}>Select one to filter your issues</span>
            </div>
            <div style={sx('display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%, 220px), 1fr)); gap:12px;')}>
              {c.projects.map((p) => <ProjectCard key={p.id} project={projectVM(p, c)} selected={w.project === p.id} onSelect={(id) => actions.setW({ project: state.w.project === id ? '' : id })} />)}
            </div>
          </section>

          <section style={sx(PANEL)}>
            <div style={sx('display:flex; align-items:center; gap:8px; flex-wrap:wrap;')}>
              <h2 style={sx(H2)}>My issues</h2>
              {showBadge(lin) && <Pill label={badgeLabel(lin)} tone="sample" />}
            </div>
            <div style={sx('display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:10px;')}>
              <div style={sx('max-width:100%; overflow-x:auto;')}>
                <Tabs value={w.view} onValueChange={(v: string) => v && actions.setW({ view: v, sort: v === 'updated' ? 'updated' : 'urgency' })}>
                  <TabsList>
                    {W_VIEWS.map(([value, label]) => (
                      <TabsTrigger key={value} value={value}>{label}<span style={sx('font-size:11px; color:var(--muted-foreground); font-variant-numeric:tabular-nums;')}>{c.issues.filter(tests[value]).length}</span></TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
              <div style={sx('display:flex; flex-wrap:wrap; gap:8px; align-items:center;')}>
                <div style={sx('width:220px; max-width:100%;')}>
                  <Input type="search" placeholder="Search issues" aria-label="Search issues" value={w.search} onChange={(e) => actions.setW({ search: val(e) })} />
                </div>
                <NativeSelect aria-label="Project" value={w.project} onChange={(e) => actions.setW({ project: val(e) })}>
                  <option value="">All projects</option>
                  {c.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </NativeSelect>
                <NativeSelect aria-label="Design" value={w.design} onChange={(e) => actions.setW({ design: val(e) })}>
                  <option value="any">Any design state</option>
                  <option value="with">Has a design</option>
                  <option value="without">No design yet</option>
                </NativeSelect>
              </div>
            </div>

            {rows.length > 0 && isDesktop && (
              <div style={sx('overflow-x:auto; border:1px solid var(--border); border-radius:10px;')}>
                <table style={sx('width:100%; border-collapse:collapse; font-size:13px;')}>
                  <thead>
                    <tr style={sx('border-bottom:1px solid var(--border); background:var(--muted);')}>
                      <th scope="col" style={thStyle}>ID</th>
                      <th scope="col" style={thStyle}>Issue</th>
                      <th scope="col" style={thStyle}>Project</th>
                      <th scope="col" style={thStyle}>Status</th>
                      {sortHead('priority', 'Priority')}
                      <th scope="col" style={thStyle}>Design</th>
                      {sortHead('due', 'Due')}
                      {sortHead('updated', 'Updated')}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((i) => { const r = vm(i); return (
                      <tr key={i.id} onClick={() => actions.openIssue(i.identifier)} className="hv-muted" style={sx('border-bottom:1px solid var(--border); cursor:pointer;')}>
                        <td style={sx(`padding:10px 12px; font-family:${MONO}; font-size:12px; color:var(--muted-foreground); white-space:nowrap;`)}>{r.identifier}</td>
                        <td style={sx('padding:10px 12px; max-width:340px;')}><span style={sx('display:block; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;')}>{r.title}</span></td>
                        <td style={sx('padding:10px 12px; color:var(--muted-foreground); white-space:nowrap;')}>{r.projectName}</td>
                        <td style={sx('padding:10px 12px;')}><Pill label={r.stateName} tone={r.bucket} /></td>
                        <td style={sx('padding:10px 12px; white-space:nowrap;')}><span style={sx('display:inline-flex; align-items:center; gap:4px;', { color: r.priorityColor })}><PriorityIcon name={r.priorityIcon} />{r.priorityLabel}</span></td>
                        <td style={sx('padding:10px 12px;')}><Pill label={r.designLabel} tone={r.hasDesign ? 'design' : 'none'} /></td>
                        <td style={sx('padding:10px 12px; white-space:nowrap;', { color: r.dueColor, fontWeight: r.dueWeight })}>{r.dueText}</td>
                        <td style={sx('padding:10px 12px; white-space:nowrap; color:var(--muted-foreground); font-variant-numeric:tabular-nums;')}>{r.updated}</td>
                      </tr>
                    ); })}
                  </tbody>
                </table>
              </div>
            )}
            {rows.length > 0 && !isDesktop && (
              <div style={sx('display:flex; flex-direction:column; margin:0 -8px;')}>
                {rows.map((i) => <IssueRow key={i.id} issue={vm(i)} variant="compact" onOpen={actions.openIssue} />)}
              </div>
            )}
            {rows.length === 0 && (
              <div style={sx('display:flex; flex-direction:column; align-items:center; gap:8px; padding:28px 12px; border:1px dashed var(--border); border-radius:10px; text-align:center;')}>
                <strong style={sx('font-weight:600;')}>No issues match</strong>
                <span style={sx('font-size:13px; color:var(--muted-foreground);')}>Try another view or clear the filters.</span>
                <Button variant="outline" size="sm" onClick={() => actions.setW({ search: '', design: 'any', project: '', view: 'assigned' })}>Clear filters</Button>
              </div>
            )}
          </section>

          <section ref={figmaRef} style={sx(PANEL)}>
            <div style={sx('display:flex; align-items:center; gap:8px; flex-wrap:wrap;')}>
              <h2 style={sx(H2)}>Figma work</h2>
              {showBadge(fig) && <Pill label={badgeLabel(fig)} tone="sample" />}
              <HeadLink href={c.links.figmaRecents}>Figma recents</HeadLink>
            </div>
            <div style={sx('display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 380px), 1fr)); gap:20px; align-items:start;')}>
              <div style={sx('display:flex; flex-direction:column; gap:10px; min-width:0;')}>
                <span style={sx(EYEBROW)}>Recently updated</span>
                {files.length > 0 ? (
                  <div style={sx('display:grid; grid-template-columns:repeat(auto-fill, minmax(170px, 1fr)); gap:12px;')}>
                    {files.map((f, i) => <FigmaTile key={f.key} file={fileVM(f, c, i)} onOpenIssue={actions.openIssue} />)}
                  </div>
                ) : (
                  <div style={sx('display:flex; flex-direction:column; align-items:center; gap:8px; padding:24px 12px; border:1px dashed var(--border); border-radius:10px; text-align:center;')}>
                    <strong style={sx('font-weight:600;')}>No Figma files</strong>
                    <span style={sx('font-size:13px; color:var(--muted-foreground);')}>{fig.mode === 'connected' ? 'Tracked files appear here after their first Sync Index.' : 'Recently edited files will appear here once Figma is connected.'}</span>
                    {fig.mode === 'connected'
                      ? <Button variant="outline" size="sm" onClick={() => actions.go('figma')}>Go to Figma files</Button>
                      : <Button variant="outline" size="sm" onClick={openIntegrations}>Connect Figma</Button>}
                  </div>
                )}
              </div>
              <div style={sx('display:flex; flex-direction:column; gap:10px; min-width:0;')}>
                <span style={sx(EYEBROW)}>{`Open issues without a design · ${missing.length}`}</span>
                <div style={sx('display:flex; flex-direction:column; margin:0 -8px;')}>
                  {missing.map((i) => <IssueRow key={i.id} issue={vm(i)} variant="status-only" onOpen={actions.openIssue} />)}
                </div>
                <p style={sx('margin:0; font-size:12px; color:var(--muted-foreground);')}>Files link to an issue when they’re attached in Linear or when the issue ID is in the file name.</p>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
