import type { FileIndexData } from '../data/types';

/** Rebuild the flat page list (in index order, separators restored as group headers) so skip rules can be
    re-applied to a stored index with buildIndex() — no Figma call needed. */
export function rebuildPages(index: FileIndexData) {
  return index.groups.flatMap((g) => [...(g.kind === 'ungrouped' ? [] : [{ id: g.id, name: g.name }]), ...g.pages.map((p) => ({ id: p.id, name: g.kind === 'ungrouped' ? p.name : `↳ ${p.name}` }))]);
}
