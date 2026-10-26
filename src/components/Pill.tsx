// design/Pill.dc.html — DS Badge (secondary) with a tone override.
import { Badge } from './ds';

const TONES: Record<string, [string, string]> = {
  'in-progress': ['var(--custom-amber-50-dark-amber-950)', 'var(--custom-amber-900-dark-amber-50)'],
  reading: ['var(--custom-amber-50-dark-amber-950)', 'var(--custom-amber-900-dark-amber-50)'],
  warning: ['var(--custom-amber-50-dark-amber-950)', 'var(--custom-amber-900-dark-amber-50)'],
  'in-review': ['var(--card-violet)', 'var(--card-violet-foreground)'],
  'up-next': ['var(--muted)', 'var(--secondary-foreground)'],
  done: ['var(--card-green)', 'var(--card-green-foreground)'],
  read: ['var(--card-green)', 'var(--card-green-foreground)'],
  'to-read': ['var(--card-blue)', 'var(--card-blue-foreground)'],
  sample: ['var(--card-orange)', 'var(--card-orange-foreground)'],
  critical: ['var(--card-red)', 'var(--card-red-foreground)'],
  info: ['var(--card-sky)', 'var(--card-sky-foreground)'],
  design: ['var(--card-indigo)', 'var(--card-indigo-foreground)'],
  none: ['transparent', 'var(--muted-foreground)'],
};
export type PillTone = keyof typeof TONES | string;

export function Pill({ label, tone = 'up-next' }: { label: string; tone?: PillTone }) {
  const [bg, fg] = TONES[tone] || TONES['up-next'];
  return (
    <Badge variant="secondary" style={{ background: bg, color: fg, whiteSpace: 'nowrap', fontWeight: 500, ...(tone === 'none' ? { border: '1px dashed var(--border)' } : {}) }}>
      {label}
    </Badge>
  );
}
