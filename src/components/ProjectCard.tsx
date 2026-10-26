// design/ProjectCard.dc.html
import { sx } from '../lib/sx';
import type { ProjectVM } from '../rules/pdd';
import { Progress } from './ds';

export function ProjectCard({ project, selected, onSelect }: { project: ProjectVM; selected: boolean; onSelect: (id: string) => void }) {
  return (
    <button type="button" aria-pressed={selected} onClick={() => onSelect(project.id)} className="hv-ring" style={sx('display:flex; flex-direction:column; gap:10px; width:100%; padding:14px; border-radius:10px; color:var(--card-foreground); text-align:left; cursor:pointer; font:inherit; box-shadow:0 1px 2px rgb(0 0 0 / 0.04);', { border: `1px solid ${selected ? 'var(--primary)' : 'var(--border)'}`, background: selected ? 'var(--accent)' : 'var(--card)' })}>
      <span style={sx('display:flex; justify-content:space-between; gap:8px; font-size:12px; color:var(--muted-foreground);')}>
        <span>{project.role}</span><span>{project.target}</span>
      </span>
      <span style={sx('font-size:15px; font-weight:600; letter-spacing:-0.01em;')}>{project.name}</span>
      <Progress value={project.pct} />
      <span style={sx('display:flex; justify-content:space-between; gap:8px; font-size:12px; color:var(--muted-foreground);')}>
        <span style={sx('font-variant-numeric:tabular-nums;')}>{project.pctLabel}</span><span>{project.openLabel}</span>
      </span>
    </button>
  );
}
