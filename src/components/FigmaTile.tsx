// design/FigmaTile.dc.html. Uses Figma's thumbnail_url when present; the wireframe placeholder is the fallback (HANDOFF §8.10).
import { useState } from 'react';
import { MONO, sx } from '../lib/sx';
import type { FileVM } from '../rules/pdd';
import { ArrowUpRightIcon } from './ds';

export function FigmaTile({ file, compact = false, onOpenIssue }: { file: FileVM; compact?: boolean; onOpenIssue: (identifier: string) => void }) {
  const [thumbFailed, setThumbFailed] = useState(false);
  const showThumb = !!file.thumbnailUrl && !thumbFailed;
  return (
    <div style={sx('display:flex; flex-direction:column; border:1px solid var(--border); border-radius:10px; background:var(--card); overflow:hidden; min-width:0;')}>
      <a href={file.url} target="_blank" rel="noreferrer" aria-label={`Open ${file.name} in Figma`} style={sx('position:relative; display:flex; flex-direction:column; gap:8px; padding:16px; background:var(--muted); text-decoration:none; border-bottom:1px solid var(--border);', { height: compact ? '96px' : '124px', ...(showThumb ? { padding: 0 } : {}) })}>
        {showThumb ? (
          <img src={file.thumbnailUrl!} alt="" onError={() => setThumbFailed(true)} style={sx('width:100%; height:100%; object-fit:cover;')} />
        ) : (
          <>
            <span style={sx('display:block; height:8px; border-radius:3px; background:var(--border);', { width: file.wireW })} />
            <span style={sx('display:block; flex:1; border-radius:6px; background:var(--card); border:1px solid var(--border);')} />
            <span style={sx('display:flex; gap:6px;')}>
              <span style={sx('display:block; height:14px; width:38%; border-radius:3px; background:var(--border);')} />
              <span style={sx('display:block; height:14px; width:24%; border-radius:3px; background:var(--primary); opacity:0.75;')} />
            </span>
          </>
        )}
        <span style={sx('position:absolute; top:8px; right:8px; display:inline-flex; align-items:center; gap:3px; padding:2px 7px; border-radius:999px; background:var(--card); border:1px solid var(--border); font-size:11px; color:var(--foreground);')}>Open <ArrowUpRightIcon size={11} /></span>
      </a>
      <div style={sx('display:flex; flex-direction:column; gap:4px; padding:10px 12px 12px;')}>
        <span title={file.name} style={sx('font-size:13px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--foreground);')}>{file.name}</span>
        <span style={sx('font-size:12px; color:var(--muted-foreground);')}>{file.sub}</span>
        <span style={sx('display:flex; flex-wrap:wrap; gap:6px; margin-top:4px;')}>
          {file.issues.map((l) => (
            <button key={l.identifier} type="button" title={l.title} onClick={() => onOpenIssue(l.identifier)} className="hv-muted" style={sx(`padding:1px 7px; border-radius:6px; border:1px solid var(--border); background:var(--background); font-family:${MONO}; font-size:11px; color:var(--foreground); cursor:pointer;`)}>{l.identifier}</button>
          ))}
          {!file.issues.length && <span style={sx('font-size:11px; color:var(--muted-foreground); font-style:italic;')}>Not linked to an issue</span>}
        </span>
      </div>
    </div>
  );
}
