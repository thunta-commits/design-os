// design/IssueRow.dc.html
import { MONO, sx } from '../lib/sx';
import type { IssueVM } from '../rules/pdd';
import { Pill } from './Pill';

export type IssueRowVariant = 'full' | 'compact' | 'status-only';

export function IssueRow({ issue, variant = 'full', onOpen }: { issue: IssueVM; variant?: IssueRowVariant; onOpen: (identifier: string) => void }) {
  const showMeta = variant !== 'compact' && variant !== 'status-only';
  const showDue = variant !== 'status-only';
  return (
    <button type="button" onClick={() => onOpen(issue.identifier)} className="hv-muted" style={sx('display:flex; align-items:center; gap:12px; width:100%; min-height:44px; padding:8px 10px; border:0; border-radius:8px; background:transparent; color:var(--foreground); text-align:left; cursor:pointer; font:inherit;')}>
      <span style={sx(`flex:none; width:68px; font-family:${MONO}; font-size:12px; color:var(--muted-foreground);`)}>{issue.identifier}</span>
      <span style={sx('flex:1; min-width:0; font-size:14px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;')}>{issue.title}</span>
      {showMeta && (
        <>
          <Pill label={issue.designLabel} tone={issue.hasDesign ? 'design' : 'none'} />
          <Pill label={issue.bucketLabel} tone={issue.bucket} />
        </>
      )}
      {showDue && (
        <span style={sx('flex:none; min-width:64px; text-align:right; font-size:12px; font-variant-numeric:tabular-nums;', { color: issue.dueColor, fontWeight: issue.dueWeight })}>{issue.dueText}</span>
      )}
    </button>
  );
}
