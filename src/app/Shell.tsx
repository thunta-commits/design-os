// App shell — rail (desktop ≥760px), top bar + tab bar (mobile), main scroller, overlays, toast.
import type { ComponentType } from 'react';
import { BookOpenIcon, Button, DesktopIcon, FolderOpenIcon, ListChecksIcon, MoonIcon, PenNibIcon, PlugIcon, PlusIcon, SquaresFourIcon, SunIcon, ToggleGroup, ToggleGroupItem } from '../components/ds';
import type { IconProps } from '@luminpdf/icons/dist/lib/types';
import { sx } from '../lib/sx';
import { isOpen } from '../rules/pdd';
import { Overlays } from '../overlays/Overlays';
import { DirectoryView } from '../views/DirectoryView';
import { FigmaFilesView } from '../views/FigmaFilesView';
import { OverviewView } from '../views/OverviewView';
import { StorybookView } from '../views/StorybookView';
import { WorkView } from '../views/WorkView';
import type { ViewName } from './route';
import { useApp, type ThemePref } from './store';

export const DOT: Record<string, string> = { sample: 'var(--card-amber-foreground)', connected: 'var(--card-green-foreground)', disconnected: 'var(--muted-foreground)', error: 'var(--destructive)' };

export function Shell() {
  const { state, actions, c, isMobile, dark, rootRef, mainRef } = useApp();
  const view = state.view;
  const open = c.issues.filter(isOpen);
  const toRead = state.lib.articles.filter((a) => a.status === 'to-read');
  const nav: [ViewName, string, ComponentType<IconProps>, string][] = [
    ['overview', 'Overview', SquaresFourIcon, ''],
    ['work', 'Lumin Work', ListChecksIcon, String(open.length)],
    ['directory', 'Directory', FolderOpenIcon, String(state.fstore.links.length || '')],
    ['figma', 'Figma files', PenNibIcon, String(state.fstore.files.length)],
    ['storybook', 'Storybook', BookOpenIcon, `${toRead.length} to read`],
  ];
  const openIntegrations = () => actions.setState({ dialog: 'integrations' });
  const cycleTheme = () => actions.setTheme(({ system: 'light', light: 'dark', dark: 'system' } as const)[state.themePref]);

  return (
    <div ref={rootRef} className={dark ? 'dark' : ''} style={sx("position:relative; height:100vh; width:100%; overflow:hidden; display:flex; background:var(--background); color:var(--foreground); font-family:'Inter', ui-sans-serif, system-ui, sans-serif; font-size:14px; line-height:1.45;", { flexDirection: isMobile ? 'column' : 'row' })}>
      {!isMobile && (
        <aside aria-label="Workspace" style={sx('flex:none; width:248px; display:flex; flex-direction:column; gap:20px; padding:18px 14px; background:var(--sidebar); color:var(--sidebar-foreground); border-right:1px solid var(--sidebar-border); overflow-y:auto;')}>
          <div style={sx('display:flex; align-items:center; gap:10px; padding:0 4px;')}>
            <span aria-hidden="true" style={sx('flex:none; display:inline-flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:999px; background:var(--primary); color:var(--primary-foreground); font-weight:600;')}>{c.viewer.name.slice(0, 1)}</span>
            <span style={sx('display:flex; flex-direction:column; min-width:0;')}>
              <strong style={sx('font-size:14px; font-weight:600;')}>{c.viewer.name}</strong>
              <span style={sx('font-size:12px; color:var(--muted-foreground);')}>{`${c.viewer.role} · ${c.viewer.team}`}</span>
            </span>
          </div>
          <nav aria-label="Main" style={sx('display:flex; flex-direction:column; gap:2px;')}>
            {nav.map(([k, label, Icon, count]) => (
              <button key={k} type="button" onClick={() => actions.go(k)} aria-current={view === k ? 'page' : undefined} className="hv-sidebar" style={sx('display:flex; align-items:center; gap:10px; height:36px; padding:0 10px; border:0; border-radius:8px; color:var(--sidebar-foreground); font:inherit; font-size:14px; cursor:pointer; text-align:left;', { background: view === k ? 'var(--sidebar-accent)' : 'transparent', fontWeight: view === k ? 600 : 500 })}>
                <Icon size={18} />
                <span style={sx('flex:1;')}>{label}</span>
                <span style={sx('font-size:12px; color:var(--muted-foreground); font-variant-numeric:tabular-nums;')}>{count}</span>
              </button>
            ))}
          </nav>
          {/* Save article, Integrations and Quick links were removed from the desktop sidebar at the owner's request (28 Oct).
              Save article stays in page headers; Integrations opens from the "How to connect" banners and the mobile top bar. */}
          <div style={sx('margin-top:auto; padding:0 4px;')}>
            <ToggleGroup type="single" variant="outline" size="sm" value={state.themePref} onValueChange={(v: string) => v && actions.setTheme(v as ThemePref)} aria-label="Theme">
              <ToggleGroupItem value="system" aria-label="System theme"><DesktopIcon size={14} /></ToggleGroupItem>
              <ToggleGroupItem value="light" aria-label="Light theme"><SunIcon size={14} /></ToggleGroupItem>
              <ToggleGroupItem value="dark" aria-label="Dark theme"><MoonIcon size={14} /></ToggleGroupItem>
            </ToggleGroup>
          </div>
        </aside>
      )}

      {isMobile && (
        <header style={sx('flex:none; display:flex; align-items:center; gap:10px; height:52px; padding:0 12px 0 16px; border-bottom:1px solid var(--border); background:var(--background);')}>
          <span aria-hidden="true" style={sx('display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:999px; background:var(--primary); color:var(--primary-foreground); font-size:13px; font-weight:600;')}>{c.viewer.name.slice(0, 1)}</span>
          <strong style={sx('flex:1; font-size:15px; font-weight:600;')}>Design Dashboard</strong>
          <Button variant="ghost" size="icon" aria-label="Integrations" onClick={openIntegrations}><PlugIcon size={18} /></Button>
          <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={cycleTheme}>{dark ? <MoonIcon size={18} /> : <SunIcon size={18} />}</Button>
          <Button variant="ghost" size="icon" aria-label="Save article" onClick={() => actions.openSave()}><PlusIcon size={18} /></Button>
        </header>
      )}

      <main ref={mainRef} id="main" style={sx('position:relative; flex:1; min-width:0; min-height:0; overflow-y:auto;')}>
        <div style={sx('display:flex; flex-direction:column; gap:24px; max-width:1240px; margin:0 auto;', { padding: isMobile ? '16px 16px 32px' : '28px 32px 48px' })}>
          {view === 'overview' && <OverviewView />}
          {view === 'work' && <WorkView />}
          {view === 'storybook' && <StorybookView />}
          {view === 'directory' && <DirectoryView />}
          {view === 'figma' && <FigmaFilesView />}
        </div>
      </main>

      {isMobile && (
        <nav aria-label="Main" style={sx('flex:none; display:grid; grid-template-columns:repeat(5, 1fr); height:64px; border-top:1px solid var(--border); background:var(--background);')}>
          {nav.map(([k, label, Icon]) => (
            <button key={k} type="button" onClick={() => actions.go(k)} aria-current={view === k ? 'page' : undefined} style={sx('display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; border:0; background:transparent; font:inherit; font-size:11px; cursor:pointer;', { color: view === k ? 'var(--foreground)' : 'var(--muted-foreground)', fontWeight: view === k ? 600 : 500 })}>
              <Icon size={20} weight={view === k ? 'fill' : 'regular'} />{label}
            </button>
          ))}
        </nav>
      )}

      <Overlays />
    </div>
  );
}
