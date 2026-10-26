// Drawer (500px right sheet) and dialog frames from design/Design OS.dc.html. Scrim click and Esc close them.
import type { ReactNode } from 'react';
import { useApp } from '../app/store';
import { Button, XIcon } from '../components/ds';
import { sx } from '../lib/sx';

export function DrawerFrame({ label, onClose, header, footer, children }: { label: string; onClose: () => void; header: ReactNode; footer?: ReactNode; children: ReactNode }) {
  const { isMobile } = useApp();
  return (
    <div style={sx('position:absolute; inset:0; z-index:40; display:flex; justify-content:flex-end;')}>
      <button type="button" aria-label="Close" onClick={onClose} style={sx('position:absolute; inset:0; border:0; background:rgb(10 10 10 / 0.32); cursor:default;')} />
      <div role="dialog" aria-label={label} style={sx('position:relative; display:flex; flex-direction:column; height:100%; background:var(--background); border-left:1px solid var(--border); box-shadow:0 16px 48px rgb(0 0 0 / 0.18);', { width: isMobile ? '100%' : 'min(500px, 100%)' })}>
        <div style={sx('flex:none; display:flex; align-items:center; gap:8px; padding:12px 16px; border-bottom:1px solid var(--border);')}>
          {header}
          <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}><XIcon size={16} /></Button>
        </div>
        <div style={sx('flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:22px; padding:20px;')}>{children}</div>
        {footer}
      </div>
    </div>
  );
}

export function DialogFrame({ label, title, width, onClose, footer, children }: { label: string; title: string; width: number; onClose: () => void; footer?: ReactNode; children: ReactNode }) {
  const { isMobile } = useApp();
  return (
    <div style={sx('position:absolute; inset:0; z-index:50; display:flex; align-items:center; justify-content:center;', { padding: isMobile ? '0' : '24px' })}>
      <button type="button" aria-label="Close" onClick={onClose} style={sx('position:absolute; inset:0; border:0; background:rgb(10 10 10 / 0.32); cursor:default;')} />
      <div role="dialog" aria-label={label} style={sx('position:relative; display:flex; flex-direction:column; max-width:100%; max-height:100%; background:var(--background); border:1px solid var(--border); border-radius:14px; box-shadow:0 16px 48px rgb(0 0 0 / 0.2);', { width })}>
        <div style={sx('flex:none; display:flex; align-items:center; padding:14px 18px; border-bottom:1px solid var(--border);')}>
          <strong style={sx('flex:1; font-size:16px; font-weight:600;')}>{title}</strong>
          <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}><XIcon size={16} /></Button>
        </div>
        {children}
        {footer && <div style={sx('flex:none; display:flex; justify-content:flex-end; gap:8px; padding:12px 18px; border-top:1px solid var(--border);')}>{footer}</div>}
      </div>
    </div>
  );
}

export const TAG = 'font-size:12px; padding:1px 6px; border-radius:6px; background:var(--muted); color:var(--muted-foreground);';
export const LABEL = 'font-size:13px; font-weight:500;';
export const ERR = 'font-size:12px; color:var(--destructive);';
export const FIELD = 'display:flex; flex-direction:column; gap:6px;';
