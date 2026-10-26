// Ported from design/pdd-data.js (dates). Keep names in step with the design file.
const DAY = 86400000;

export const startOfDay = (d: Date | string | number = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const isoDateFromToday = (n: number) => { const d = startOfDay(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const isoHoursAgo = (h: number) => new Date(Date.now() - h * 3600000).toISOString();
export const daysAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString();
export const parseDate = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso));
export const daysUntil = (iso: string) => Math.round((startOfDay(parseDate(iso)).getTime() - startOfDay().getTime()) / DAY);
const fShort = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
const fLong = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
export const formatShort = (iso: string) => fShort.format(parseDate(iso));
export const formatLong = (d = new Date()) => fLong.format(d);

export type DueTone = 'overdue' | 'soon' | 'normal' | 'none';
export function formatDue(iso: string | null): { text: string; tone: DueTone } {
  if (!iso) return { text: 'No date', tone: 'none' };
  const n = daysUntil(iso);
  if (n < 0) return { text: n === -1 ? 'Overdue 1d' : `Overdue ${-n}d`, tone: 'overdue' };
  if (n === 0) return { text: 'Today', tone: 'soon' };
  if (n === 1) return { text: 'Tomorrow', tone: 'soon' };
  return { text: formatShort(iso), tone: 'normal' };
}

export function timeAgo(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d === 1) return 'yesterday';
  if (d < 7) return `${d}d ago`;
  return formatShort(iso);
}

export const greeting = (d = new Date()) => { const h = d.getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

const fStamp = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const fExact = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'medium' });
/** "Last synced just now" · "Last synced 3 min ago" (under an hour) · "Last synced Oct 26, 14:32" · "Never synced". */
export function syncedLabel(iso: string | null | undefined) {
  if (!iso) return 'Never synced';
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'Last synced just now';
  if (m < 60) return `Last synced ${m} min ago`;
  return `Last synced ${fStamp.format(new Date(iso))}`;
}
/** Exact local timestamp for tooltips, e.g. "Oct 26, 2026, 2:32:05 PM". */
export const exactTime = (iso: string | null | undefined) => (iso ? fExact.format(new Date(iso)) : '');
