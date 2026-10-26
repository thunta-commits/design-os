// design/FileIndex.dc.html — the index panel shared by Figma files and Directory (HANDOFF §11.3).
import { sx } from '../lib/sx';
import { ArrowsClockwiseIcon, Button, CaretDownIcon, CaretRightIcon } from './ds';
import { Pill } from './Pill';

export interface IndexPageVM { id: string; name: string; count: string; hasCount: boolean; showSkipped: boolean; current?: 'page'; bg: string; weight: number; color: string; select: () => void }
export interface IndexGroupVM { id: string; name: string; skipped: boolean; expanded: boolean; countText: string; toggle: () => void; pages: IndexPageVM[] }

interface Props {
  title?: string; syncText?: string; groups: IndexGroupVM[]; emptyTitle?: string; emptyText?: string;
  showSync?: boolean; syncDisabled?: boolean; syncTitle?: string; onSync?: () => void; actionLabel?: string; onAction?: () => void;
}

export function FileIndex({ title = 'File index', syncText = '', groups, emptyTitle = 'No Figma index yet', emptyText = 'Sync this file’s index once Figma is connected. Pages appear here after the first sync.', showSync = true, syncDisabled = true, syncTitle = '', onSync, actionLabel = '', onAction }: Props) {
  return (
    <aside aria-label="File index" style={sx("display:flex; flex-direction:column; gap:10px; padding:14px; border:1px solid var(--border); border-radius:12px; background:var(--card); color:var(--foreground); font-family:'Inter', ui-sans-serif, system-ui, sans-serif; font-size:14px;")}>
      <div style={sx('display:flex; align-items:baseline; justify-content:space-between; gap:8px;')}>
        <strong style={sx('font-size:13px; font-weight:600; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;')}>{title}</strong>
        <span style={sx('flex:none; font-size:12px; color:var(--muted-foreground);')}>{syncText}</span>
      </div>
      {!groups.length && (
        <div style={sx('display:flex; flex-direction:column; gap:8px; padding:12px 4px; align-items:flex-start;')}>
          <strong style={sx('font-size:13px; font-weight:600;')}>{emptyTitle}</strong>
          <span style={sx('font-size:13px; color:var(--muted-foreground); text-wrap:pretty;')}>{emptyText}</span>
          {showSync && <Button variant="outline" size="sm" disabled={syncDisabled} title={syncTitle} onClick={() => onSync?.()}><ArrowsClockwiseIcon size={14} />Sync Index</Button>}
          {!!actionLabel && <Button variant="outline" size="sm" onClick={() => onAction?.()}>{actionLabel}</Button>}
        </div>
      )}
      {groups.map((g) => (
        <div key={g.id} role="group" aria-label={g.name} style={sx('display:flex; flex-direction:column; gap:2px;')}>
          <button type="button" aria-expanded={g.expanded} onClick={g.toggle} className="hv-fg" style={sx('display:flex; align-items:center; gap:6px; padding:6px 6px 4px; border:0; border-radius:6px; background:transparent; font:inherit; color:var(--muted-foreground); text-align:left; cursor:pointer;')}>
            {g.expanded ? <CaretDownIcon size={12} /> : <CaretRightIcon size={12} />}
            <span style={sx('flex:1; min-width:0; font-size:11px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;')}>{g.name}</span>
            {g.skipped && <Pill label="Skipped" tone="none" />}
            <span style={sx('flex:none; font-size:11px; font-variant-numeric:tabular-nums;')}>{g.countText}</span>
          </button>
          {g.expanded && g.pages.map((p) => (
            <button key={p.id} type="button" aria-current={p.current} onClick={p.select} className="hv-muted" style={sx('display:flex; align-items:center; gap:8px; min-height:32px; padding:0 8px 0 24px; border:0; border-radius:8px; font:inherit; font-size:13px; text-align:left; cursor:pointer;', { background: p.bg, color: p.color, fontWeight: p.weight })}>
              <span style={sx('flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;')}>{p.name}</span>
              {p.showSkipped && <span style={sx('font-size:11px; color:var(--muted-foreground);')}>Skipped</span>}
              {p.hasCount && <span style={sx('min-width:20px; height:20px; padding:0 6px; display:inline-flex; align-items:center; justify-content:center; border-radius:999px; background:var(--card-indigo); color:var(--card-indigo-foreground); font-size:11px; font-weight:600;')}>{p.count}</span>}
            </button>
          ))}
        </div>
      ))}
    </aside>
  );
}
