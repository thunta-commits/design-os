// FileIndex view-models from a TrackedFile's stored index. Figma files and Directory both read this one index (HANDOFF §11.3).
import type { IndexGroupVM } from '../components/FileIndex';
import type { DesignLink, Issue, TrackedFile } from '../data/types';
import type { Ctx } from '../rules/pdd';

export function indexGroups(file: TrackedFile | null, links: DesignLink[], collapsed: Record<string, boolean>, toggle: (ck: string) => void, selId: string | null, onSelect: (id: string) => void, q: string): IndexGroupVM[] {
  if (!file || !file.index) return [];
  return file.index.groups.map((g) => {
    const ck = `${file.key}:${g.id}`; const expanded = q ? true : !collapsed[ck];
    const pages = g.pages.filter((p) => !q || p.name.toLowerCase().includes(q) || g.name.toLowerCase().includes(q));
    return {
      id: g.id, name: g.name, skipped: !!g.skipped, expanded, countText: `${g.pages.length} page${g.pages.length === 1 ? '' : 's'}`,
      toggle: () => toggle(ck),
      pages: pages.map((p) => {
        const n = links.filter((l) => l.fileKey === file.key && l.pageId === p.id).length; const on = selId === p.id;
        return { id: p.id, name: p.name, count: String(n), hasCount: n > 0, showSkipped: !!p.skipped && !g.skipped, current: on ? 'page' as const : undefined, bg: on ? 'var(--accent)' : 'transparent', weight: on ? 500 : 400, color: p.skipped ? 'var(--muted-foreground)' : 'var(--foreground)', select: () => onSelect(p.id) };
      }),
    };
  }).filter((g) => g.pages.length);
}

/** Directory card fields (the shape the prototype's Linear snapshot used), derived from a live Issue. */
export function cardOf(i: Issue, c: Ctx) {
  const statusType = i.state.type;
  const tone = statusType === 'completed' || statusType === 'canceled' ? 'done' : statusType === 'started' ? (/review/i.test(i.state.name) ? 'in-review' : 'in-progress') : 'up-next';
  const project = i.projectId ? c.projectById.get(i.projectId)?.name || null : null;
  return { id: i.identifier, title: i.title, url: i.url, status: i.state.name, statusType, tone, team: i.team, project, priority: i.priority, labels: i.labels, cycleId: i.cycleId, updatedAt: i.updatedAt, meta: `${i.team} · ${project || 'No project'}` };
}
export type CardVM = ReturnType<typeof cardOf>;
