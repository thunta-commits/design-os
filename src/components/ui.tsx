// Repeated patterns from design/Design OS.dc.html, kept as small components with the design's exact styles.
import type { ReactNode } from 'react';
import { sx } from '../lib/sx';
import { ArrowRightIcon, ArrowUpRightIcon, InfoIcon } from './ds';

export const PANEL = 'display:flex; flex-direction:column; gap:14px; min-width:0; padding:18px; border:1px solid var(--border); border-radius:12px; background:var(--card);';
export const H1 = 'margin:0; font-size:28px; line-height:1.2; font-weight:600; letter-spacing:-0.02em;';
export const H2 = 'margin:0; font-size:15px; font-weight:600;';
export const EYEBROW = 'font-size:11px; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; color:var(--muted-foreground);';
export const ROW2 = 'display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 380px), 1fr)); gap:16px; align-items:start;';

/** Outline-styled external link ("Open Linear ↗", "Open in Figma ↗"). */
export function OutlineLink({ href, children, small = false, iconSize }: { href: string; children: ReactNode; small?: boolean; iconSize?: number }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="hv-muted" style={sx(small
      ? 'display:inline-flex; align-items:center; gap:6px; height:28px; padding:0 10px; border:1px solid var(--border); border-radius:8px; background:var(--background); color:var(--foreground); font-size:13px; font-weight:500; text-decoration:none; white-space:nowrap;'
      : 'display:inline-flex; align-items:center; gap:6px; height:32px; padding:0 12px; border:1px solid var(--border); border-radius:8px; background:var(--background); color:var(--foreground); font-size:14px; font-weight:500; text-decoration:none; white-space:nowrap;')}>
      {children}<ArrowUpRightIcon size={iconSize ?? (small ? 14 : 15)} />
    </a>
  );
}

/** Muted inline link at the right of a panel heading ("All work →", "Figma recents ↗"). */
export function HeadLink({ onClick, href, children }: { onClick?: () => void; href?: string; children: ReactNode }) {
  if (href) return <a href={href} target="_blank" rel="noreferrer" style={sx('margin-left:auto; display:inline-flex; align-items:center; gap:4px; font-size:13px; color:var(--muted-foreground); text-decoration:none;')}>{children}<ArrowUpRightIcon size={14} /></a>;
  return <button type="button" onClick={onClick} className="hv-fg" style={sx('margin-left:auto; display:inline-flex; align-items:center; gap:4px; border:0; background:transparent; font:inherit; font-size:13px; color:var(--muted-foreground); cursor:pointer;')}>{children}<ArrowRightIcon size={14} /></button>;
}

/** Amber "not connected" note with a "How to connect" action. */
export function Banner({ children, onAction, minWidth = 200 }: { children: ReactNode; onAction: () => void; minWidth?: number }) {
  return (
    <div role="note" style={sx('display:flex; align-items:center; flex-wrap:wrap; gap:10px; padding:10px 14px; border:1px solid var(--custom-amber-200-dark-amber-900); border-radius:10px; background:var(--custom-amber-50-dark-amber-950); color:var(--custom-amber-900-dark-amber-50); font-size:13px;')}>
      <InfoIcon size={16} />
      <span style={sx('flex:1; text-wrap:pretty;', { minWidth })}>{children}</span>
      <button type="button" onClick={onAction} style={sx('border:0; background:transparent; font:inherit; font-weight:600; color:inherit; text-decoration:underline; cursor:pointer;')}>How to connect</button>
    </div>
  );
}

/** Loading line shown while the first Linear response is on its way. */
export function Loading({ children = 'Loading your work from Linear…' }: { children?: ReactNode }) {
  return <p role="status" style={sx('margin:0; padding:48px 0; font-size:13px; color:var(--muted-foreground); text-align:center;')}>{children}</p>;
}

/** Key–value list used in drawers and Figma file details. */
export function KeyValues({ rows, cols = '110px', boxed = false }: { rows: { k: string; v: ReactNode; color?: string }[]; cols?: string; boxed?: boolean }) {
  return (
    <dl style={sx(boxed ? 'display:grid; gap:10px 12px; margin:0; padding:14px 16px; border:1px solid var(--border); border-radius:12px; background:var(--card); font-size:13px;' : 'display:grid; gap:10px 12px; margin:0; font-size:13px;', { gridTemplateColumns: `${cols} minmax(0,1fr)` })}>
      {rows.map((kv) => [
        <dt key={`${kv.k}-k`} style={sx('color:var(--muted-foreground);')}>{kv.k}</dt>,
        <dd key={`${kv.k}-v`} style={sx('margin:0; overflow-wrap:anywhere;', kv.color ? { color: kv.color } : undefined)}>{kv.v}</dd>,
      ])}
    </dl>
  );
}
