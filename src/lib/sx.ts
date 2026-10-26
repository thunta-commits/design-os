import type { CSSProperties } from 'react';

/* Inline styles are kept as CSS text copied from the Claude Design file (design/Design OS.dc.html),
   so a later handoff can be diffed against this code line by line. sx() turns that text into a
   React style object; results are cached because most strings are static. */
const cache = new Map<string, CSSProperties>();

const camel = (prop: string) =>
  prop.startsWith('--') ? prop : prop.replace(/^-(webkit|moz|ms)-/, (_, v: string) => `${v[0].toUpperCase()}${v.slice(1)}-`).replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

export function sx(css: string, extra?: CSSProperties): CSSProperties {
  let style = cache.get(css);
  if (!style) {
    const out: Record<string, string> = {};
    for (const decl of css.split(';')) {
      const i = decl.indexOf(':');
      if (i < 0) continue;
      const k = decl.slice(0, i).trim();
      const v = decl.slice(i + 1).trim();
      if (k && v) out[camel(k)] = v;
    }
    style = out as CSSProperties;
    cache.set(css, style);
  }
  return extra ? { ...style, ...extra } : style;
}

export const MONO = "ui-monospace, 'SF Mono', Menlo, monospace";
