// Issue drawer, Article drawer and Directory card drawer.
import type { FormEvent } from 'react';
import { badgeLabel, showBadge } from '../app/badges';
import { EMPTY_FORM, useApp, val } from '../app/store';
import { Button, Input, LinkSimpleIcon, PenNibIcon, PencilSimpleIcon, PlusIcon, StarIcon, Tabs, TabsList, TabsTrigger, Textarea, TrashIcon } from '../components/ds';
import { IssueRow } from '../components/IssueRow';
import { Pill } from '../components/Pill';
import { PriorityIcon } from '../components/PriorityIcon';
import { KeyValues, OutlineLink } from '../components/ui';
import { formatShort, timeAgo } from '../lib/dates';
import { MONO, sx } from '../lib/sx';
import { frameUrl as figmaFrameUrl } from '../rules/figma';
import { articleVM, frameUrl, isOpen, issueVM, PRIORITY_LABEL, relatedArticles, topicName } from '../rules/pdd';
import { cardOf } from '../views/indexGroups';
import { DrawerFrame, TAG } from './frames';

export function IssueDrawer({ identifier }: { identifier: string }) {
  const { state, actions, c } = useApp();
  const issue = c.issues.find((i) => i.identifier === identifier);
  if (!issue) return null;
  const v = issueVM(issue, c); const p = issue.projectId ? c.projectById.get(issue.projectId) : null;
  const designs = c.designLinks.get(issue.id) || [];
  const reading = relatedArticles(issue, p, state.lib.articles, 4);
  const lin = c.integrations.linear, fig = c.integrations.figma;
  const kv = [
    { k: 'Project', v: p ? `${p.name} · ${p.role.toLowerCase()}` : 'No project' },
    { k: 'Cycle', v: c.cycle && issue.cycleId === c.cycle.id ? `${c.cycle.name} · ends ${formatShort(c.cycle.endsAt)}` : 'Not in a cycle' },
    { k: 'Due', v: issue.dueDate ? formatShort(issue.dueDate) : 'No due date' },
    { k: 'Updated', v: timeAgo(issue.updatedAt) },
    { k: 'Comments', v: String(issue.commentCount) },
    { k: 'Labels', v: <span style={sx('display:flex; flex-wrap:wrap; gap:6px;')}>{issue.labels.map((l) => <span key={l} style={sx(TAG)}>{l}</span>)}</span> },
  ];
  return (
    <DrawerFrame label={`${issue.identifier} ${issue.title}`} onClose={actions.closeDetail} header={<>
      <span style={sx(`font-family:${MONO}; font-size:13px; color:var(--muted-foreground);`)}>{issue.identifier}</span>
      {showBadge(lin) && <Pill label={badgeLabel(lin)} tone="sample" />}
      <span style={sx('flex:1;')} />
      <OutlineLink href={issue.url} small>Open in Linear</OutlineLink>
    </>}>
      <div style={sx('display:flex; flex-direction:column; gap:12px;')}>
        <h2 style={sx('margin:0; font-size:20px; line-height:1.3; font-weight:600; letter-spacing:-0.01em;')}>{issue.title}</h2>
        <div style={sx('display:flex; flex-wrap:wrap; align-items:center; gap:12px; font-size:13px;')}>
          <Pill label={v.stateName} tone={v.bucket} />
          <span style={sx('display:inline-flex; align-items:center; gap:4px;', { color: v.priorityColor })}><PriorityIcon name={v.priorityIcon} />{v.priorityLabel}</span>
          <span style={{ color: v.dueColor, fontWeight: v.dueWeight }}>{v.dueText}</span>
        </div>
        <p style={sx('margin:0; color:var(--muted-foreground); max-width:62ch; text-wrap:pretty; white-space:pre-line;')}>{issue.description}</p>
      </div>
      <KeyValues rows={kv} />
      <section style={sx('display:flex; flex-direction:column; gap:10px;')}>
        <div style={sx('display:flex; align-items:center; gap:8px; flex-wrap:wrap;')}>
          <h3 style={sx('margin:0; font-size:14px; font-weight:600;')}>Design</h3>
          {showBadge(fig) && <Pill label={badgeLabel(fig)} tone="sample" />}
        </div>
        {designs.map(({ file, via }) => (
          <div key={file.key} style={sx('display:flex; flex-direction:column; gap:10px; padding:12px; border:1px solid var(--border); border-radius:10px; background:var(--card);')}>
            <div style={sx('display:flex; align-items:center; gap:10px;')}>
              <PenNibIcon size={16} />
              <div style={sx('flex:1; min-width:0; display:flex; flex-direction:column;')}>
                <strong style={sx('font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;')}>{file.name}</strong>
                <span style={sx('font-size:12px; color:var(--muted-foreground);')}>{`Edited ${timeAgo(file.lastModified)} · ${via === 'attachment' ? 'attached in Linear' : 'matched by file name'}`}</span>
              </div>
              <OutlineLink href={file.url} small>Open</OutlineLink>
            </div>
            <div aria-label="Frames" style={sx('display:flex; flex-wrap:wrap; gap:6px;')}>
              {file.frames.map((fr) => <a key={fr.nodeId} href={frameUrl(file, fr.nodeId)} target="_blank" rel="noreferrer" className="hv-muted" style={sx('font-size:12px; padding:3px 8px; border:1px solid var(--border); border-radius:999px; color:var(--foreground); text-decoration:none;')}>{fr.name}</a>)}
            </div>
          </div>
        ))}
        {designs.length === 0 && (
          <div style={sx('display:flex; flex-direction:column; gap:4px; padding:16px; border:1px dashed var(--border); border-radius:10px;')}>
            <strong style={sx('font-weight:600; font-size:13px;')}>No design attached</strong>
            <span style={sx('font-size:13px; color:var(--muted-foreground);')}>{`Attach the Figma file to this issue in Linear, or put ${issue.identifier} in the file name, and it will show here.`}</span>
          </div>
        )}
      </section>
      <section style={sx('display:flex; flex-direction:column; gap:10px;')}>
        <div style={sx('display:flex; align-items:center; justify-content:space-between; gap:8px;')}>
          <h3 style={sx('margin:0; font-size:14px; font-weight:600;')}>Related reading</h3>
          <Button variant="ghost" size="sm" onClick={() => actions.openSave({ projects: issue.projectId ? [issue.projectId] : [], tags: issue.labels.slice(0, 3).join(', ') })}><PlusIcon size={14} />Save a reference</Button>
        </div>
        {reading.map(({ article, because }) => { const a = articleVM(article, c); return (
          <button key={a.id} type="button" onClick={() => actions.openArticle(a.id)} className="hv-ring" style={sx('display:flex; align-items:center; gap:12px; padding:10px 12px; border:1px solid var(--border); border-radius:10px; background:var(--background); color:var(--foreground); font:inherit; text-align:left; cursor:pointer;')}>
            <span style={sx('flex:1; min-width:0; display:flex; flex-direction:column; gap:2px;')}>
              <span style={sx('font-size:12px; color:var(--muted-foreground);')}>{`${topicName(article.topic)} · ${article.publication}`}</span>
              <span style={sx('font-weight:500;')}>{a.title}</span>
              <span style={sx('font-size:12px; color:var(--card-indigo-foreground);')}>{`Matches ${because}`}</span>
            </span>
            <Pill label={a.statusLabel} tone={a.status} />
          </button>
        ); })}
        {reading.length === 0 && <p style={sx('margin:0; font-size:13px; color:var(--muted-foreground);')}>Nothing in Storybook matches this issue’s project or labels yet.</p>}
      </section>
    </DrawerFrame>
  );
}

export function ArticleDrawer({ id }: { id: string }) {
  const { state, actions, c } = useApp();
  const art = state.lib.articles.find((a) => a.id === id);
  if (!art) return null;
  const av = articleVM(art, c);
  const tagSet = new Set(art.tags);
  const related = c.issues.filter(isOpen).filter((i) => (i.projectId && art.relatedProjectIds.includes(i.projectId)) || i.labels.some((l) => tagSet.has(l))).slice(0, 4);
  const cols = state.lib.collections.filter((x) => art.collectionIds.includes(x.id)).map((x) => x.name);
  const projs = art.relatedProjectIds.map((pid) => c.projectById.get(pid)).filter(Boolean).map((p) => p!.name);
  const remove = () => { const snap = art; actions.removeArticle(art.id); actions.setState({ article: null, notes: null, confirmDelete: false }); actions.showToast('Article removed', { label: 'Undo', run: () => actions.addArticle({ ...snap }) }); };
  const edit = () => { const notes = state.notes ?? art.notes; actions.setState({ article: null, notes: null, dialog: 'save', touched: false, form: { ...EMPTY_FORM, id: art.id, url: art.url, title: art.title, author: art.author, publication: art.publication, topic: art.topic, status: art.status, summary: art.summary, notes, tags: art.tags.join(', '), projects: art.relatedProjectIds, collections: art.collectionIds, favorite: art.favorite } }); };
  return (
    <DrawerFrame label={art.title} onClose={actions.closeDetail}
      header={<>
        <span style={sx('flex:1; font-size:13px; color:var(--muted-foreground);')}>{`${av.topicName} · saved ${av.saved}`}</span>
        <Button variant="ghost" size="icon-sm" aria-pressed={art.favorite} aria-label="Toggle favorite" onClick={() => actions.toggleFav(art.id)}><StarIcon size={17} weight={art.favorite ? 'fill' : 'regular'} color={art.favorite ? 'var(--card-amber-foreground)' : 'currentColor'} /></Button>
      </>}
      footer={
        <div style={sx('flex:none; display:flex; align-items:center; gap:8px; padding:12px 16px; border-top:1px solid var(--border);')}>
          {state.confirmDelete ? (
            <>
              <span style={sx('flex:1; font-size:13px;')}>Remove this article from Storybook?</span>
              <Button variant="ghost" onClick={() => actions.setState({ confirmDelete: false })}>Cancel</Button>
              <Button variant="destructive" onClick={remove}>Remove</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => actions.setState({ confirmDelete: true })} style={{ marginRight: 'auto' }}><TrashIcon size={15} color="var(--destructive)" /><span style={sx('color:var(--destructive);')}>Remove</span></Button>
              <span style={sx('flex:1;')} />
              <Button variant="outline" onClick={edit}><PencilSimpleIcon size={15} />Edit details</Button>
            </>
          )}
        </div>
      }>
      <div style={sx('display:flex; flex-direction:column; gap:8px; align-items:flex-start;')}>
        <h2 style={sx('margin:0; font-size:20px; line-height:1.3; font-weight:600; letter-spacing:-0.01em; text-wrap:pretty;')}>{art.title}</h2>
        <span style={sx('color:var(--muted-foreground);')}>{av.byline}</span>
        <OutlineLink href={art.url} small>Open source</OutlineLink>
      </div>
      <div style={sx('display:flex; flex-direction:column; gap:6px;')}>
        <span style={sx('font-size:13px; font-weight:500;')}>Reading status</span>
        <Tabs value={art.status} onValueChange={(s: string) => s && actions.updateArticle(art.id, { status: s as typeof art.status })}>
          <TabsList>
            <TabsTrigger value="to-read">To read</TabsTrigger>
            <TabsTrigger value="reading">Reading</TabsTrigger>
            <TabsTrigger value="read">Read</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {av.hasSummary && (
        <section style={sx('display:flex; flex-direction:column; gap:6px;')}>
          <h3 style={sx('margin:0; font-size:14px; font-weight:600;')}>Summary</h3>
          <p style={sx('margin:0; color:var(--muted-foreground); text-wrap:pretty;')}>{art.summary}</p>
        </section>
      )}
      <div style={sx('display:flex; flex-direction:column; gap:6px;')}>
        <label htmlFor="article-notes" style={sx('font-size:13px; font-weight:500;')}>My notes</label>
        <Textarea id="article-notes" rows={5} placeholder="What to remember, where it applies at Lumin…" value={state.notes ?? art.notes} onChange={(e) => actions.setState({ notes: val(e) })} onBlur={actions.saveNotes} />
      </div>
      <KeyValues rows={[
        { k: 'Topic', v: av.topicName },
        { k: 'Tags', v: <span style={sx('display:flex; flex-wrap:wrap; gap:6px;')}>{av.allTags.map((t) => <span key={t} style={sx(TAG)}>{t}</span>)}{!art.tags.length && <span style={sx('color:var(--muted-foreground);')}>None</span>}</span> },
        { k: 'Collections', v: cols.length ? cols.join(', ') : 'None' },
        { k: 'Lumin project', v: projs.length ? projs.join(', ') : 'Not linked' },
      ]} />
      <section style={sx('display:flex; flex-direction:column; gap:8px;')}>
        <h3 style={sx('margin:0; font-size:14px; font-weight:600;')}>Relevant to current work</h3>
        <div style={sx('display:flex; flex-direction:column; margin:0 -8px;')}>
          {related.map((i) => <IssueRow key={i.id} issue={issueVM(i, c)} variant="status-only" onOpen={actions.openIssue} />)}
        </div>
        {related.length === 0 && <p style={sx('margin:0; font-size:13px; color:var(--muted-foreground);')}>No open issues share this article’s project or tags.</p>}
      </section>
    </DrawerFrame>
  );
}

export function CardDrawer({ id }: { id: string }) {
  const { state, actions, c } = useApp();
  const issue = c.issues.find((i) => i.identifier === id);
  if (!issue) return null;
  const card = cardOf(issue, c);
  const fst = state.fstore;
  const link = fst.links.find((l) => l.issueId === card.id);
  const lf = link ? fst.files.find((f) => f.key === link.fileKey) : null;
  const MUTED = 'var(--muted-foreground)', FGC = 'var(--foreground)';
  const kv = (k: string, v: string, muted?: boolean) => ({ k, v, color: muted ? MUTED : FGC });
  const pushHist = (entry: { kind: 'changelog' | 'version'; text: string }, patch: { version?: string } = {}) => actions.mutateFstore((st) => ({ ...st, links: st.links.map((l) => (l.id === link!.id ? { ...l, ...patch, history: [...l.history, { at: new Date().toISOString(), ...entry }] } : l)) }));
  const cycleText = !card.cycleId ? 'Not in a cycle' : c.cycle && card.cycleId === c.cycle.id ? c.cycle.name : 'In a cycle';
  const addChangelog = (e?: FormEvent) => { e?.preventDefault(); const t = state.clNote.trim(); if (!t || !link) return; pushHist({ kind: 'changelog', text: t }); actions.setState({ clNote: '' }); actions.showToast('Changelog added'); };
  const tagVersion = () => { const t = state.clNote.trim(); if (!t || !link) return; pushHist({ kind: 'version', text: `${t} tagged` }, { version: t }); actions.setState({ clNote: '' }); actions.showToast(`Tagged ${t}`); };
  const unlink = () => { const snap = link!; actions.mutateFstore((st) => ({ ...st, links: st.links.filter((l) => l.id !== snap.id) })); actions.showToast('Card unlinked', { label: 'Undo', run: () => actions.mutateFstore((s2) => ({ ...s2, links: [...s2.links, snap] })) }); };
  return (
    <DrawerFrame label={`${card.id} ${card.title}`} onClose={actions.closeDetail} header={<>
      <span style={sx(`font-family:${MONO}; font-size:13px; color:var(--muted-foreground);`)}>{card.id}</span>
      <Pill label={card.status} tone={card.tone} />
      {link && <Pill label={link.version} tone="in-review" />}
      <span style={sx('flex:1;')} />
    </>}>
      <h2 style={sx('margin:0; font-size:20px; line-height:1.3; font-weight:600; letter-spacing:-0.01em; text-wrap:pretty;')}>{card.title}</h2>
      <KeyValues cols="120px" rows={[
        kv('Cycle', cycleText, !card.cycleId), kv('Project', card.project || 'No project', !card.project), kv('Team', card.team), kv('Priority', PRIORITY_LABEL[card.priority] || 'No priority'),
        kv('Design', link ? [lf ? lf.name : 'Removed file', link.groupName, link.pageName, link.frameName].filter(Boolean).join(' › ') : 'Not linked to a design page', !link),
        kv('Specs', 'No spec link', true), kv('Labels', card.labels.join(', ') || 'None', !card.labels.length), kv('Updated in Linear', formatShort(card.updatedAt)),
      ]} />
      <div style={sx('display:flex; flex-wrap:wrap; gap:8px;')}>
        <OutlineLink href={card.url} iconSize={14}>Open in Linear</OutlineLink>
        {link && lf && <OutlineLink href={figmaFrameUrl(lf, link.nodeId || link.pageId)} iconSize={14}>Open design</OutlineLink>}
        {!link && (
          <>
            <Button variant="outline" disabled title="Link this card to a design page first">Open design</Button>
            <Button onClick={() => actions.openLink({ issueId: card.id })}><LinkSimpleIcon size={15} />Link to a design page</Button>
          </>
        )}
      </div>
      <section style={sx('display:flex; flex-direction:column; gap:10px;')}>
        <h3 style={sx('margin:0; font-size:14px; font-weight:600;')}>History</h3>
        {link ? (
          <>
            <ol style={sx('margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:12px; border-left:2px solid var(--border); padding-left:14px;')}>
              {[...link.history].reverse().map((h, i) => <li key={i} style={sx('display:flex; flex-direction:column; gap:2px;')}><span style={sx('font-size:12px; color:var(--muted-foreground);')}>{formatShort(h.at)}</span><span style={sx('font-size:13px;')}>{h.text}</span></li>)}
            </ol>
            <form onSubmit={addChangelog} style={sx('display:flex; flex-wrap:wrap; gap:8px; align-items:center;')}>
              <div style={sx('flex:1; min-width:180px;')}><Input placeholder="Changelog note or version (e.g. v1.1)" aria-label="Changelog note or version" value={state.clNote} onChange={(e) => actions.setState({ clNote: val(e) })} /></div>
              <Button variant="outline" size="sm" type="submit">Add changelog</Button>
              <Button variant="outline" size="sm" type="button" onClick={tagVersion}>Tag version</Button>
            </form>
            <div><Button variant="ghost" size="sm" onClick={unlink}><span style={sx('color:var(--destructive);')}>Unlink card from design</span></Button></div>
          </>
        ) : (
          <p style={sx('margin:0; font-size:13px; color:var(--muted-foreground); text-wrap:pretty;')}>No history yet. Versions and changelog entries start when this card is linked to a design page.</p>
        )}
      </section>
    </DrawerFrame>
  );
}
