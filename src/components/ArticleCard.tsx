// design/ArticleCard.dc.html
import type { MouseEvent } from 'react';
import { sx } from '../lib/sx';
import type { ArticleVM } from '../rules/pdd';
import { StarIcon } from './ds';
import { Pill } from './Pill';

interface Props { article: ArticleVM; layout?: 'grid' | 'list'; compact?: boolean; onOpen: (id: string) => void; onToggleFav: (id: string) => void }

export function ArticleCard({ article, layout = 'grid', compact = false, onOpen, onToggleFav }: Props) {
  const starColor = article.favorite ? 'var(--card-amber-foreground)' : 'var(--muted-foreground)';
  const starWeight = article.favorite ? 'fill' : 'regular';
  const favLabel = article.favorite ? `Remove ${article.title} from favorites` : `Add ${article.title} to favorites`;
  const toggleFav = (e: MouseEvent) => { e.stopPropagation(); onToggleFav(article.id); };

  if (layout === 'grid') {
    return (
      <article title={article.hoverMeta} className="hv-ring" style={sx('display:flex; flex-direction:column; gap:8px; height:100%; box-sizing:border-box; padding:16px 16px 14px; border:1px solid var(--border); border-radius:12px; background:var(--card); color:var(--card-foreground);')}>
        <div style={sx('display:flex; align-items:center; gap:8px; min-height:24px;')}>
          <span style={sx('font-size:12px; font-weight:500; color:var(--muted-foreground);')}>{article.topicName}</span>
          <button type="button" aria-pressed={article.favorite} aria-label={favLabel} onClick={toggleFav} className="hv-muted" style={sx('margin:-4px -6px -4px auto; display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border:0; border-radius:6px; background:transparent; cursor:pointer;', { color: starColor })}>
            <StarIcon size={16} weight={starWeight} />
          </button>
        </div>
        <button type="button" onClick={() => onOpen(article.id)} className="hv-underline" style={sx('padding:0; border:0; background:transparent; text-align:left; font:inherit; font-size:15px; font-weight:600; line-height:1.35; letter-spacing:-0.01em; color:var(--foreground); cursor:pointer; text-wrap:pretty; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;')}>{article.title}</button>
        <span style={sx('font-size:12px; color:var(--muted-foreground); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;')}>{article.byline}</span>
        <p style={sx('margin:2px 0 0; font-size:13px; line-height:1.5; color:var(--muted-foreground); display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; min-height:4.5em;')}>{article.summary}</p>
        <div style={sx('display:flex; align-items:center; gap:10px; margin-top:auto; padding-top:8px; min-width:0;')}>
          <Pill label={article.statusLabel} tone={article.status} />
          <span style={sx('flex:1; min-width:0; font-size:12px; color:var(--muted-foreground); white-space:pre; overflow:hidden; text-overflow:ellipsis; text-align:right;')}>{article.tagLine}</span>
        </div>
      </article>
    );
  }
  return (
    <div style={sx('display:flex; align-items:center; gap:12px; padding:8px 10px; border-bottom:1px solid var(--border); color:var(--foreground);')}>
      <button type="button" onClick={() => onOpen(article.id)} style={sx('flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; padding:0; border:0; background:transparent; text-align:left; font:inherit; cursor:pointer;')}>
        <strong style={sx('font-size:14px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;')}>{article.title}</strong>
        <span style={sx('font-size:12px; color:var(--muted-foreground); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;')}>{article.byline}</span>
      </button>
      {!compact && (
        <>
          <span style={sx('flex:none; width:110px; font-size:13px; color:var(--muted-foreground);')}>{article.topicName}</span>
          <span style={sx('flex:none; width:56px; font-size:13px; color:var(--muted-foreground); font-variant-numeric:tabular-nums;')}>{article.saved}</span>
        </>
      )}
      <Pill label={article.statusLabel} tone={article.status} />
      <button type="button" aria-pressed={article.favorite} aria-label={favLabel} onClick={toggleFav} className="hv-muted" style={sx('display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border:0; border-radius:6px; background:transparent; cursor:pointer;', { color: starColor })}>
        <StarIcon size={17} weight={starWeight} />
      </button>
    </div>
  );
}
