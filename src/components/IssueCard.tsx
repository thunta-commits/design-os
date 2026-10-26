// design/IssueCard.dc.html
import { MONO, sx } from '../lib/sx';
import type { IssueVM } from '../rules/pdd';
import { Pill } from './Pill';
import { PriorityIcon } from './PriorityIcon';

export function IssueCard({ issue, onOpen }: { issue: IssueVM; onOpen: (identifier: string) => void }) {
  return (
    <button type="button" onClick={() => onOpen(issue.identifier)} className="hv-ring" style={sx('display:flex; flex-direction:column; gap:8px; width:100%; padding:12px; border:1px solid var(--border); border-radius:10px; background:var(--card); color:var(--card-foreground); text-align:left; cursor:pointer; font:inherit; box-shadow:0 1px 2px rgb(0 0 0 / 0.04);')}>
      <span style={sx('display:flex; align-items:center; justify-content:space-between; gap:8px;')}>
        <span style={sx(`font-family:${MONO}; font-size:12px; color:var(--muted-foreground);`)}>{issue.identifier}</span>
        <span style={sx('display:inline-flex; align-items:center; gap:4px; font-size:12px;', { color: issue.priorityColor })}>
          <PriorityIcon name={issue.priorityIcon} />{issue.priorityLabel}
        </span>
      </span>
      <span style={sx('font-size:14px; font-weight:500; line-height:1.35; text-wrap:pretty;')}>{issue.title}</span>
      <span style={sx('display:flex; flex-wrap:wrap; align-items:center; gap:6px;')}>
        {issue.hasProject && <span style={sx('font-size:12px; color:var(--muted-foreground); padding:1px 6px; border-radius:6px; background:var(--muted);')}>{issue.projectName}</span>}
        <Pill label={issue.designLabel} tone={issue.hasDesign ? 'design' : 'none'} />
        <span style={sx('margin-left:auto; font-size:12px;', { color: issue.dueColor, fontWeight: issue.dueWeight })}>{issue.dueText}</span>
      </span>
    </button>
  );
}
