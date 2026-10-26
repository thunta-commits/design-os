# Prompt for Claude Code

Paste this into Claude Code from the root of the unzipped handoff package, or from the Cowork repo with this package alongside it.

---

I’m handing off a completed Claude Design prototype called **Design OS** for production implementation. Treat `design/Design OS.dc.html`, this `README.md`, and the documented components, states, breakpoints and interaction rules as the source of truth for the UX/UI.

**Goal:** turn the prototype into a real personal product without redesigning it.

**Preserve:**
- the app shell, 5-item nav and mobile tab bar
- the 760px and 1100px breakpoints
- all documented components
- all empty / unavailable / skipped / error / disconnected states
- search and filter behavior
- confirm-then-Undo deletes
- the linking rules (§4, §11.5)
- the Lumin Design System styling (`@luminpdf/ds`)

**Priorities:**
1. **Linear (live).** Assigned issues and current-cycle work for thunta@luminpdf.com (§7.1). Replace `pdd-linear-snapshot.js` and the sample data in `pdd-data.js`.
2. **Figma.** Tracked-file sync, page index (`buildIndex`) and component usage scan through a server adapter implementing the interface in `pdd-figma.js` (§7.2, §11.4).
   - `DS-shadcn-*` libraries are current.
   - Never infer links from similar titles.
3. **Storybook feeds.** A server-side RSS/Atom fetch on an allow-list, with parse and dedupe, Sync now, refresh on load, and a cron (§7.3).
4. **Persistence.** Store in a database: articles, favorites, reading status, notes, collections, sources, tracked Figma files, skip settings, and design links with their history (§7.4).
5. **Auth.** Simple single-user login.
6. **Deploy.** Vercel (§7.5).

Don’t redesign. If a technical limit forces a UX change, flag it and explain the tradeoff first.

**First:**
1. inspect the package;
2. summarize the architecture;
3. list missing credentials and config;
4. list the gaps between the prototype and what can be built;
5. then build the smallest working production slice. Suggested slice: auth, plus a live Linear `/api/linear/workspace` feeding Lumin Work, Overview and Directory, deployed on Vercel.
