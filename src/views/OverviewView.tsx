// Overview — computed entirely from the same issues, files and library (HANDOFF §2).
import type { ComponentType } from 'react';
import type { IconProps } from '@luminpdf/icons/dist/lib/types';
import { badgeLabel, showBadge } from '../app/badges';
import { useApp } from '../app/store';
import { ArrowsClockwiseIcon, BellIcon, BookmarkSimpleIcon, Button, ListChecksIcon, PenNibIcon, PlusIcon, Progress, StarIcon } from '../components/ds';
import { FigmaTile } from '../components/FigmaTile';
import { IssueRow } from '../components/IssueRow';
import { Pill } from '../components/Pill';
import { H1, H2, HeadLink, Loading, OutlineLink, PANEL, ROW2 } from '../components/ui';
import { daysUntil, formatLong, formatShort, greeting } from '../lib/dates';
import { MONO, sx } from '../lib/sx';
import { articleVM, attentionItems, bucketOf, byUrgency, fileVM, isOpen, issueVM, readingForActiveWork } from '../rules/pdd';

const TONE_COLOR = { critical: 'var(--destructive)', warning: 'var(--custom-amber-900-dark-amber-50)', info: 'var(--card-sky-foreground)' };
const STRIPE = { critical: 'var(--destructive)', warning: 'var(--card-amber-foreground)', info: 'var(--card-sky-foreground)' };

export function OverviewView() {
  const { state, actions, c, isMobile, linearLoading, attnRef, figmaRef } = useApp();
  const arts = state.lib.articles;
  const open = c.issues.filter(isOpen);
  const toRead = arts.filter((a) => a.status === 'to-read');
  const active = open.filter((i) => ['in-progress', 'in-review'].includes(bucketOf(i))).sort(byUrgency);
  const attention = attentionItems(c.issues);
  const inProgress = open.filter((i) => bucketOf(i) === 'in-progress').length;
  const cycleLeft = c.cycle ? daysUntil(c.cycle.endsAt) : 0;
  const focusP = c.projects.map((p) => ({ p, n: active.filter((i) => i.projectId === p.id).length })).sort((a, b) => b.n - a.n || (a.p.role === 'Lead' ? -1 : 1))[0]?.p;
  const files = [...c.figmaFiles].sort((a, b) => b.lastModified.localeCompare(a.lastModified));
  const suggestions = readingForActiveWork(c.issues, c.projects, arts, 3);
  const openArt = (a: (typeof arts)[number]) => ({ ...articleVM(a, c), open: () => actions.openArticle(a.id) });
  const lin = c.integrations.linear, fig = c.integrations.figma;
  const goWork = (view: string) => actions.go('work', { w: { ...state.w, view, sort: 'urgency' } });
  const goSb = (view: string) => actions.go('storybook', { sb: { ...state.sb, view } });

  const stats = [
    { label: 'Assigned to me', value: open.length, sub: `across ${new Set(open.map((i) => i.projectId).filter(Boolean)).size} projects`, color: 'var(--foreground)', go: () => goWork('assigned') },
    { label: 'In progress', value: inProgress, sub: `${open.filter((i) => bucketOf(i) === 'in-review').length} in review`, color: 'var(--foreground)', go: () => goWork('progress') },
    { label: 'Needs attention', value: attention.length, sub: `${attention.filter((a) => a.tone === 'critical').length} overdue`, color: attention.some((a) => a.tone === 'critical') ? 'var(--destructive)' : 'var(--foreground)', go: () => actions.scrollMain(attnRef.current) },
    { label: 'To read', value: toRead.length, sub: `${arts.filter((a) => a.status === 'reading').length} in progress`, color: 'var(--foreground)', go: () => goSb('to-read') },
  ];
  const shortcuts: { label: string; Icon: ComponentType<IconProps>; n: string | number; go: () => void }[] = [
    { label: 'Up next', Icon: ListChecksIcon, n: open.filter((i) => bucketOf(i) === 'up-next').length, go: () => goWork('next') },
    { label: 'Reading queue', Icon: BookmarkSimpleIcon, n: toRead.length, go: () => goSb('to-read') },
    { label: 'Favorites', Icon: StarIcon, n: arts.filter((a) => a.favorite).length, go: () => goSb('favorites') },
    { label: 'Current cycle', Icon: ArrowsClockwiseIcon, n: '↗', go: () => window.open(c.links.activeCycle, '_blank') },
    { label: 'Linear inbox', Icon: BellIcon, n: '↗', go: () => window.open(c.links.inbox, '_blank') },
    { label: 'Figma recents', Icon: PenNibIcon, n: '↗', go: () => window.open(c.links.figmaRecents, '_blank') },
  ];
  // No active cycle in Linear → the date line drops the cycle clause (new state; flagged for Claude Design).
  const dateLine = c.cycle ? `${formatLong()} · ${c.cycle.name} ends in ${cycleLeft} day${cycleLeft === 1 ? '' : 's'}` : formatLong();

  return (
    <>
      <header style={sx('display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:16px;')}>
        <div style={sx('display:flex; flex-direction:column; gap:4px; min-width:0;')}>
          <span style={sx('font-size:13px; color:var(--muted-foreground);')}>{dateLine}</span>
          <h1 style={sx(H1)}>{`${greeting()}, ${c.viewer.name}`}</h1>
          <p style={sx('margin:0; color:var(--muted-foreground); text-wrap:pretty;')}>{linearLoading ? `${toRead.length} to read in Storybook.` : `${inProgress} in progress, ${attention.length} need${attention.length === 1 ? 's' : ''} attention, ${toRead.length} to read in Storybook.`}</p>
        </div>
        <div style={sx('display:flex; flex-wrap:wrap; gap:8px;')}>
          <OutlineLink href={c.links.myIssues}>Open Linear</OutlineLink>
          <Button onClick={() => actions.openSave()}><PlusIcon size={15} />Save article</Button>
        </div>
      </header>

      {linearLoading ? <Loading /> : (
        <>
          <section aria-label="At a glance" style={sx('display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:12px;')}>
            {stats.map((st) => (
              <button key={st.label} type="button" onClick={st.go} className="hv-ring" style={sx('display:flex; flex-direction:column; gap:2px; padding:14px 16px; border:1px solid var(--border); border-radius:12px; background:var(--card); color:var(--card-foreground); font:inherit; text-align:left; cursor:pointer; box-shadow:0 1px 2px rgb(0 0 0 / 0.04);')}>
                <span style={sx('font-size:12px; color:var(--muted-foreground);')}>{st.label}</span>
                <span style={sx('font-size:28px; font-weight:600; letter-spacing:-0.02em; font-variant-numeric:tabular-nums;', { color: st.color })}>{st.value}</span>
                <span style={sx('font-size:12px; color:var(--muted-foreground);')}>{st.sub}</span>
              </button>
            ))}
          </section>

          <div style={sx(ROW2)}>
            <section style={sx(PANEL)}>
              <div style={sx('display:flex; align-items:center; gap:8px; flex-wrap:wrap;')}>
                <h2 style={sx(H2)}>What I’m working on</h2>
                {showBadge(lin) && <Pill label={badgeLabel(lin)} tone="sample" />}
                <HeadLink onClick={() => actions.go('work')}>All work</HeadLink>
              </div>
              {focusP && (
                <div style={sx('display:flex; flex-direction:column; gap:10px; padding:12px; border-radius:10px; background:var(--muted);')}>
                  <div style={sx('display:flex; align-items:flex-start; justify-content:space-between; gap:12px;')}>
                    <div style={sx('display:flex; flex-direction:column; gap:2px;')}>
                      <span style={sx('font-size:12px; color:var(--muted-foreground);')}>{`Focus project · ${focusP.role.toLowerCase()}${focusP.targetDate ? ` · target ${formatShort(focusP.targetDate)}` : ''}`}</span>
                      <strong style={sx('font-weight:600;')}>{focusP.name}</strong>
                    </div>
                    <span style={sx('font-weight:600; font-variant-numeric:tabular-nums;')}>{`${Math.round(focusP.progress * 100)}%`}</span>
                  </div>
                  <Progress value={Math.round(focusP.progress * 100)} />
                </div>
              )}
              <div style={sx('display:flex; flex-direction:column;')}>
                {active.slice(0, 6).map((i) => <IssueRow key={i.id} issue={issueVM(i, c)} variant={isMobile ? 'compact' : 'full'} onOpen={actions.openIssue} />)}
              </div>
            </section>

            <section ref={attnRef} style={sx(`${PANEL} scroll-margin-top:24px;`)}>
              <div style={sx('display:flex; align-items:center; gap:8px;')}>
                <h2 style={sx(H2)}>Needs attention</h2>
                <span style={sx('font-size:12px; color:var(--muted-foreground);')}>{String(attention.length || '')}</span>
              </div>
              <div style={sx('display:flex; flex-direction:column; gap:8px;')}>
                {attention.slice(0, 5).map(({ issue, reason, tone }) => (
                  <button key={issue.id} type="button" onClick={() => actions.openIssue(issue.identifier)} className="hv-ring" style={sx('display:flex; gap:12px; padding:10px 12px; border:1px solid var(--border); border-radius:10px; background:var(--background); color:var(--foreground); font:inherit; text-align:left; cursor:pointer;')}>
                    <span aria-hidden="true" style={sx('flex:none; width:3px; border-radius:3px;', { background: STRIPE[tone] })} />
                    <span style={sx('display:flex; flex-direction:column; gap:2px; min-width:0;')}>
                      <span style={sx('font-size:12px; font-weight:600;', { color: TONE_COLOR[tone] })}>{reason}</span>
                      <span style={sx('font-weight:500;')}>{issue.title}</span>
                      <span style={sx(`font-family:${MONO}; font-size:12px; color:var(--muted-foreground);`)}>{issue.identifier + (issue.projectId && c.projectById.get(issue.projectId) ? ` · ${c.projectById.get(issue.projectId)!.name}` : '')}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </>
      )}

      <div style={sx(ROW2)}>
        <section style={sx(PANEL)}>
          <div style={sx('display:flex; align-items:center; gap:8px; flex-wrap:wrap;')}>
            <h2 style={sx(H2)}>Recent design work</h2>
            {showBadge(fig) && <Pill label={badgeLabel(fig)} tone="sample" />}
            <HeadLink onClick={() => actions.go('work', {}, () => actions.scrollMain(figmaRef.current))}>All files</HeadLink>
          </div>
          {files.length > 0 ? (
            <div style={sx('display:grid; grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); gap:12px;')}>
              {files.slice(0, 3).map((f, i) => <FigmaTile key={f.key} file={fileVM(f, c, i)} compact onOpenIssue={actions.openIssue} />)}
            </div>
          ) : (
            <div style={sx('display:flex; flex-direction:column; align-items:center; gap:8px; padding:24px 12px; border:1px dashed var(--border); border-radius:10px; text-align:center;')}>
              <strong style={sx('font-weight:600;')}>No Figma files yet</strong>
              <span style={sx('font-size:13px; color:var(--muted-foreground);')}>Connect Figma to see files you edited recently.</span>
              <Button variant="outline" size="sm" onClick={() => actions.setState({ dialog: 'integrations' })}>Connect Figma</Button>
            </div>
          )}
        </section>

        <section style={sx('display:flex; flex-direction:column; gap:6px; min-width:0; padding:18px; border:1px solid var(--border); border-radius:12px; background:var(--card);')}>
          <div style={sx('display:flex; align-items:center; gap:8px; padding-bottom:6px;')}>
            <h2 style={sx(H2)}>Recently saved</h2>
            <HeadLink onClick={() => actions.go('storybook')}>Storybook</HeadLink>
          </div>
          {[...arts].sort((a, b) => b.savedAt.localeCompare(a.savedAt)).slice(0, 4).map(openArt).map((r) => (
            <button key={r.id} type="button" onClick={r.open} className="hv-muted" style={sx('display:flex; flex-direction:column; align-items:flex-start; gap:4px; padding:10px 8px; border:0; border-bottom:1px solid var(--border); border-radius:0; background:transparent; color:var(--foreground); font:inherit; text-align:left; cursor:pointer;')}>
              <span style={sx('display:flex; gap:6px; width:100%; font-size:12px; color:var(--muted-foreground);')}><span style={sx('font-weight:600; color:var(--foreground);')}>{r.topicName}</span><span>·</span><span>{r.publication}</span><span style={sx('margin-left:auto;')}>{r.savedAgo}</span></span>
              <span style={sx('font-weight:500;')}>{r.title}</span>
              <Pill label={r.statusLabel} tone={r.status} />
            </button>
          ))}
        </section>
      </div>

      <div style={sx(ROW2)}>
        <section style={sx('display:flex; flex-direction:column; gap:6px; min-width:0; padding:18px; border:1px solid var(--border); border-radius:12px; background:var(--card);')}>
          <div style={sx('display:flex; align-items:center; gap:8px; padding-bottom:6px; flex-wrap:wrap;')}>
            <h2 style={sx(H2)}>Reading for your current work</h2>
            <span style={sx('font-size:12px; color:var(--muted-foreground);')}>Matched by project and labels</span>
          </div>
          {suggestions.map(({ article, issue, because }) => { const r = openArt(article); return (
            <button key={r.id} type="button" onClick={r.open} className="hv-muted" style={sx('display:flex; flex-direction:column; align-items:flex-start; gap:4px; padding:10px 8px; border:0; border-bottom:1px solid var(--border); background:transparent; color:var(--foreground); font:inherit; text-align:left; cursor:pointer;')}>
              <span style={sx('display:flex; gap:6px; font-size:12px; color:var(--muted-foreground);')}><span style={sx('font-weight:600; color:var(--foreground);')}>{r.topicName}</span><span>·</span><span>{r.publication}</span></span>
              <span style={sx('font-weight:500;')}>{r.title}</span>
              <span style={sx('font-size:12px; color:var(--card-indigo-foreground);')}>{`For ${issue.identifier} · ${because}`}</span>
            </button>
          ); })}
          {suggestions.length === 0 && <p style={sx('margin:0; font-size:13px; color:var(--muted-foreground);')}>Tag articles with the same labels you use in Linear to see them here.</p>}
        </section>

        <section style={sx('display:flex; flex-direction:column; gap:12px; min-width:0; padding:18px; border:1px solid var(--border); border-radius:12px; background:var(--card);')}>
          <h2 style={sx(H2)}>Shortcuts</h2>
          <div style={sx('display:grid; grid-template-columns:repeat(auto-fill, minmax(170px, 1fr)); gap:8px;')}>
            {shortcuts.map(({ label, Icon, n, go }) => (
              <button key={label} type="button" onClick={go} className="hv-ring" style={sx('display:flex; align-items:center; gap:10px; height:44px; padding:0 12px; border:1px solid var(--border); border-radius:10px; background:var(--background); color:var(--foreground); font:inherit; font-size:13px; font-weight:500; text-align:left; cursor:pointer;')}>
                <Icon size={17} />
                <span style={sx('flex:1;')}>{label}</span>
                <span style={sx('font-size:12px; color:var(--muted-foreground); font-variant-numeric:tabular-nums;')}>{n}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
