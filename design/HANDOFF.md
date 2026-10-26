# Handoff: Design OS · Product Design Dashboard (Lumin)

> The app file was renamed to **Design OS.dc.html** in the design project; older notes may say DashboardApp.

## Overview
A personal workspace for a Product Designer at Lumin (owner: **Thu Nguyen, thunta@luminpdf.com**). It is one app shell with three connected areas:

- **Overview**: today's summary, current work, what needs attention, recent Figma work, recently saved reading, reading matched to active issues, and shortcuts.
- **Lumin Work**: Linear issues assigned to the owner, the current cycle, projects, the "Now and next" board, the issue table, and Figma work with issue links.
- **Storybook**: a reading library (articles, books, guides) with views, filters, collections, favorites, reading status, notes, and **Sources** (RSS/Atom feeds and sites the owner follows).

The areas are cross-linked:
- An issue's detail shows its Figma designs and related reading.
- An article's detail shows the open issues it is relevant to.
- Overview is computed entirely from the same issues, files and library; it has no dataset of its own.

The goal of this handoff is to keep the UI and interactions exactly as designed, and to replace sample data with real Linear, Figma and RSS integrations plus deployable persistence.

## About the design files
The files in `design/` are **design references built in HTML** (Claude Design "Design Components"). They are working prototypes that show the intended look and behaviour. They are **not** production code to ship.

Recreate them in a real codebase. **Recommended starting point:** the user's existing Cowork codebase, `product-design-dashboard/`. It is a Vite + React 18 + TypeScript + react-router (hash routing) app with the same domain model and selectors. The user has it locally, and it was uploaded to this design project as a ZIP.

Port to that codebase:
1. the Lumin Design System visual layer (`@luminpdf/ds`);
2. the Storybook redesign and the Sources feature;
3. the real integrations described below.

Opening `design/Design OS.dc.html` in a browser runs the full prototype. `support.js` and the `_ds/` folder are included so it works offline.

## Fidelity
**High-fidelity.** Colours, type, spacing, states and copy are final.
- Use `@luminpdf/ds` (v0.2.11) components and its semantic tokens.
- Do not hand-pick hex values. Dark mode is the `.dark` class on an ancestor.

---

## 1. Product structure and routes

| Route (hash) | View | Notes |
|---|---|---|
| `#/` | Overview | default |
| `#/work` | Lumin Work | `?view=assigned\|progress\|next\|updated`, `?project=<id>`, `?section=figma` (scrolls to Figma work) |
| `#/storybook` | Storybook | `?view=all\|to-read\|reading\|favorites\|sources`, plus filter params (see §4) |
| any + `?issue=DES-214` | Issue drawer over the current view | |
| any + `?article=<id>` | Article drawer over the current view | |

Detail panels must stay **URL-addressable** query params so they open over any view and can be deep-linked. The prototype keeps them in component state; the coded app should use the URL, as the Cowork code did (`useDetailParams`).

Global overlays (opened from anywhere):
- **Save / Edit article** dialog
- **Integrations** dialog
- **Add source** dialog
- **Toast**: bottom-centre, 4.5 s, with an optional action such as Undo or View

### App shell

**Desktop (≥ 760px container width)**
- A 248px left rail (`bg-sidebar`, right border), containing in order:
  - avatar, name, and "Product Designer · Lumin"
  - main nav: Overview; Lumin Work (open-issue count); Storybook ("N to read")
  - "Save article" outline button
  - **Integrations** list: status dot, name, label; click opens the Integrations dialog
  - **Quick links**: Linear · My issues, Linear · Current cycle, Figma · Recents (all external)
  - theme ToggleGroup (System / Light / Dark), pinned to the bottom
- The main area scrolls independently. Page max-width is 1240px; padding is 28px 32px 48px.

**Mobile (< 760px)**
- 52px top bar: avatar, "Design Dashboard", and icon buttons for Integrations, Theme cycle and Save article.
- Scrolling main area with 16px padding.
- 64px bottom tab bar with the three views; the active tab uses a filled icon.
- Drawers become full width and dialogs go edge to edge.

Theme preference persists to localStorage (`system` / `light` / `dark`). `system` follows `prefers-color-scheme`.

---

## 2. Views

### Overview
- **Header**
  - date line: "Wednesday 22 October · Cycle 42 ends in N days"
  - H1 "Good morning|afternoon|evening, Thư" (28px, 600, −0.02em)
  - summary: "X in progress, Y need(s) attention, Z to read in Storybook."
  - actions: "Open Linear ↗" (outline) and "Save article" (primary)
- **Stats** (4 tiles, auto-fit ≥150px, each clickable):

  | Tile | Sub-line | Click |
  |---|---|---|
  | Assigned to me | "across N projects" | Work → assigned |
  | In progress | "N in review" | Work → progress |
  | Needs attention | "N overdue"; value turns red if anything is overdue | scrolls to the attention panel |
  | To read | "N in progress" | Storybook → to-read |

- **Row 1**
  - **What I'm working on**: a focus-project card with name, role, target date and progress, then up to 6 IssueRows for in-progress or in-review issues sorted by urgency.
  - **Needs attention**: up to 5 attention items, each with a coloured stripe, a reason, the title, and "ID · project".
- **Row 2**
  - **Recent design work**: 3 FigmaTiles (compact). Empty state: "No Figma files yet" with a "Connect Figma" button.
  - **Recently saved**: 4 newest articles.
- **Row 3**
  - **Reading for your current work**: up to 3 articles matched to active issues, each with "For DES-xxx · reason".
  - **Shortcuts**: Up next, Reading queue and Favorites (with counts); Current cycle, Linear inbox and Figma recents (external).
- Rows use `grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr))`.

### Lumin Work
1. **Header**
   - cycle line: "Cycle 42 · 14 Oct – 28 Oct"
   - H1 "Lumin Work"
   - "My issues in Linear ↗" button
2. **Banner**, shown only while not connected (amber): "Linear and Figma aren't connected…" with a "How to connect" link that opens the Integrations dialog. **Remove it when both integrations are live.**
3. **Cycle card**: name, "N days left · X of Y of your issues done", progress bar, and "Open cycle ↗".
4. **Now and next**: 3 columns (In progress / In review / Up next) on a muted background.
   - Each column shows up to 4 IssueCards.
   - "Show all N" switches the table view.
   - Empty column text: "Nothing in review." (and so on).
5. **My projects**: ProjectCards. Clicking one toggles a project filter on the issue table.
6. **My issues** panel
   - Tabs: Assigned to me / In progress / Up next / Recently updated (≤ 7 days), each with a count.
   - Search: matches ID, title and labels.
   - Project select.
   - Design select: Any / Has a design / No design yet.
   - **Desktop** table columns: ID, Issue, Project, Status, Priority↓, Design, Due↓, Updated↓. The arrowed columns are sortable; the default sort is urgency, or updated when the view is "Recently updated".
   - **Mobile**: compact IssueRows instead of the table.
   - Empty state: "No issues match" with "Clear filters".
7. **Figma work**
   - Left: "Recently updated" grid of FigmaTiles.
   - Right: "Open issues without a design · N" (status-only IssueRows), with the note: "Files link to an issue when they're attached in Linear or when the issue ID is in the file name."

### Storybook (redesigned in Claude Design; port this version)
Three levels.

**1. Header**
- Left: H1 "Storybook"; description "Articles, books and guides on UX, UI, design systems, AI in design, research and product thinking."; a 12px meta line "N references · N to read · N sources · saved in this browser".
- Right: search Input (max 320px) and the "Save article" primary button.

**2. Secondary navigation row**
- Tabs with counts: **All · To read · Reading · Favorites · Sources**.
- Right side (article views only):
  - **Browse** toggle (desktop only): shows or hides the Topics/Collections rail; persisted.
  - **Filter** button with an active-count badge.
  - Grid/List ToggleGroup (persisted).
- On the Sources tab the right side is "Add source".
- **Filter popover**: 320px, anchored to the right of the toolbar row, closed by clicking outside or "Done". Fields:
  - Topic, Collection, Project, Source
  - Status (Any / To read / Reading / Read)
  - Saved (Any time / Last 14 days)
  - Sort (Newest / Oldest / Title A–Z / Reading status)
  - "Clear all"
- **Active filter chips** (only when something is applied): "Topic: UX ✕", "Source: Nielsen Norman Group ✕", and so on, plus "Clear all".

**3. Content area**
- Optional **left rail**, 176px, sticky, borderless:
  - Topics: "All topics" plus 7 topics, each with a count.
  - Collections: each with a count.
  - Inline "New collection" input with a + button; creating one selects it.
  - Selected item: `bg-accent`, foreground text. Other items: muted text.
  - Not shown on mobile; Topic and Collection live in the Filter popover there.
- **Results**: "N articles" (aria-live), then:
  - **Grid** of ArticleCards (auto-fill ≥260px, 16px gap, equal heights), or
  - **List** layout (single bordered card of rows).
  - Empty states:
    - "No articles match" (with Clear filters)
    - "No favorites yet: Star an article to keep it here."
    - "Nothing in progress"
    - "Nothing here yet" (with Save an article)
- **Sources tab** shows a single bordered list. Each row has:
  - name with an Active/Paused pill
  - feed/site URL (external link)
  - "Category · updated 3h ago"
  - "N saved · N unread" (or "No saved items yet")
  - actions: **Browse** (switches to All with a Source filter; disabled when empty), a **Switch** (Following / Paused), and Remove (inline confirm, then toast with Undo)
  - Paused rows render at 60% opacity.
  - A note above the list explains whether feeds are live. **Replace the "Feeds aren't fetched yet…" copy once ingestion exists**, for example with "Last synced 3m ago · Sync now".

### Drawers and dialogs
- **Issue drawer** (500px right sheet with scrim; Esc and scrim close it)
  - Header: mono ID, source badge, "Open in Linear ↗", close.
  - Title (20px/600); status pill, priority, due; description.
  - Key–value rows: Project ("name · lead/contributor"), Cycle ("Cycle 42 · ends 28 Oct" or "Not in a cycle"), Due, Updated, Comments, Labels.
  - **Design** section: one card per linked file with name, "Edited 2h ago · attached in Linear | matched by file name", "Open ↗", and frame deep-link chips. Empty: "No design attached: Attach the Figma file to this issue in Linear, or put DES-xxx in the file name…"
  - **Related reading**: up to 4 matched articles with "Matches Sign & Share 2.0 · #ux". "Save a reference" opens the Save dialog prefilled with the issue's project and its first 3 labels as tags.
- **Article drawer**
  - Header: "Topic · saved 22 Oct", favorite star, close.
  - Title, byline, "Open source ↗".
  - **Reading status** Tabs (To read / Reading / Read), applied immediately.
  - Summary.
  - **My notes** textarea: saves on blur and on close, with a "Notes saved" toast.
  - Key–value rows: Topic, Tags, Collections, Lumin project.
  - "Relevant to current work": open issues that share the project or a tag.
  - Footer: "Remove" (inline confirm, then toast with Undo) and "Edit details" (opens the Save dialog in edit mode).
- **Save / Edit article dialog** (640px)
  - Fields: Link* (https only), Title*, Author, Publication or site (auto-filled from the URL host on blur), Topic*, Reading status (Tabs), Short summary, My notes, Tags (comma-separated, normalised to lowercase kebab-case with "#" stripped).
  - Related Lumin project and Collections as Toggle chips; "Add to favorites" checkbox.
  - Errors show only after the first submit:
    - "Add the article's link." / "Use a full link starting with https://"
    - "Add a title."
    - "Choose a topic."
  - Create: toast "Saved to Storybook" with a View action. Edit: toast "Article updated" and reopen the drawer.
- **Integrations dialog**
  - Linear and Figma cards: status, what each will surface, how to connect.
  - Storybook library card with "Reset to starter library…" (inline confirm). **In production, scope reset to dev only, or remove it.**
- **Add source dialog** (480px)
  - Fields: Website or feed URL* (https; the name is auto-filled from the host on blur), Name*, Category (Release notes / Blog / Newsletter / Publication / Research / Website), and a "Follow this source" switch.
  - Toast: "Source “X” added".

Global keyboard: **Esc** closes the open dialog first, then the open drawer.

---

## 3. Reusable components
These are separate files in `design/`. Build each as a React component.

| Component | Props | Used in |
|---|---|---|
| **Pill** | `label`, `tone` | everywhere (status, reading status, design link, sample badge, attention) |
| **IssueRow** | `issue` (VM), `variant: full \| compact \| status-only`, `onOpen(identifier)` | Overview list, mobile issue list, "without a design", article drawer |
| **IssueCard** | `issue`, `onOpen` | Now and next board |
| **ProjectCard** | `project`, `selected`, `onSelect(id)` | My projects |
| **FigmaTile** | `file`, `compact`, `onOpenIssue(identifier)` | Overview, Figma work |
| **ArticleCard** | `article`, `layout: grid \| list`, `compact`, `onOpen(id)`, `onToggleFav(id)` | Storybook |

**Pill tones**, as background / text token pairs from `@luminpdf/ds`:

| Tone | Background / text | Used for |
|---|---|---|
| `in-progress`, `reading`, `warning` | `--custom-amber-50-dark-amber-950` / `--custom-amber-900-dark-amber-50` | |
| `in-review` | `--card-violet` / `--card-violet-foreground` | |
| `up-next` | `--muted` / `--secondary-foreground` | also Paused sources |
| `done`, `read` | `--card-green` / `--card-green-foreground` | also Active sources |
| `to-read` | `--card-blue` / `--card-blue-foreground` | |
| `sample` | `--card-orange` / `--card-orange-foreground` | "Sample Linear data" badge; delete when connected |
| `critical` | `--card-red` / `--card-red-foreground` | |
| `info` | `--card-sky` / `--card-sky-foreground` | |
| `design` | `--card-indigo` / `--card-indigo-foreground` | |
| `none` | transparent, 1px dashed `--border` / `--muted-foreground` | |

All pills render through DS `Badge variant="secondary"` with a style override.

**ArticleCard (grid)**
- 16px padding, 12px radius, 1px `--border`; border becomes `--ring` on hover.
- Content, top to bottom:
  - topic (12px/500, muted) with a favorite star on the right
  - title (15px/600, clamped to 2 lines)
  - byline (12px muted, 1 line)
  - summary (13px, 3-line clamp, min-height 4.5em so cards line up)
  - footer: reading-status Pill on the left; on the right at most 2 tags plus "+N" as muted text.
- Saved date and project appear only in the hover tooltip and the drawer.

**DS components in use:** Button (default / outline / ghost / destructive; sizes sm / icon / icon-sm), Badge, Input, Textarea, NativeSelect, Tabs/TabsList/TabsTrigger, ToggleGroup/ToggleGroupItem, Toggle, Checkbox, Switch, Progress, plus Lumin icons (`*Icon`).
- There are no Figma or Linear logos in the icon set. Substitutes: PenNibIcon for Figma; ListChecksIcon for Lumin Work and Linear.
- Priority icons: WarningIcon (urgent), ArrowUpIcon (high), MinusIcon (medium), ArrowDownIcon (low), DotsThreeIcon (none).

---

## 4. Interaction rules (ported from `state/selectors.ts`; keep them identical)
- **Bucket**:
  - `completed` / `canceled` → done
  - `started` with "review" in the state name → in-review
  - `started` otherwise → in-progress
  - anything else → up-next
- **Urgency sort**: overdue first, then priority (Linear 1 → 4, with 0 last), then due date.
- **Attention**: one reason per open issue; the first matching rule wins.

  | Condition | Reason | Tone |
  |---|---|---|
  | past due date | "Overdue by N days" | critical |
  | due today | "Due today" | warning |
  | urgent priority | "Urgent" (or "Urgent · due tomorrow") | warning |
  | due tomorrow | "Due tomorrow" | warning |
  | in review with comments | "N comments in review" | info |

  Sort: critical, then warning, then info; ties by urgency.
- **Issue → Figma**:
  1. a Figma attachment on the Linear issue (key parsed from `figma.com/(design|file|proto)/<key>`);
  2. otherwise, the issue identifier appearing in the file name as a whole word (`\bDES-230\b`).

  Record which rule matched (`via`). **Never infer from fuzzy similarity.**
- **Issue → reading score**: +3 if the article shares the issue's project; +2 for each article tag that matches an issue label (normalised kebab-case); +1 if the article's topic is in the project's topics. Keep articles scoring ≥ 2 that have a stated reason. Prefer to-read articles on ties.
- **Reading for current work**: walk in-progress and in-review issues by urgency, skip read articles, deduplicate, take the top 3 by score.
- **Library query**: view, topic, collection, status, project, source, saved-within-14-days, and a multi-word search (all words must match title, author, publication, summary, notes or tags; a leading "#" is ignored), followed by the chosen sort.
- **Source ↔ article**: an article belongs to a source when its URL host equals the source host or is a subdomain of it (www is ignored). Once feeds are ingested, store an explicit `sourceId` on ingested items and keep host matching only for manually saved articles.

---

## 5. Data models (TypeScript)
These carry over from the Cowork `src/data/types.ts`. Additions are marked **NEW**.

```ts
type IntegrationMode = 'sample' | 'connected' | 'disconnected' | 'error';
interface IntegrationStatus { id: 'linear' | 'figma' | 'feeds'; name: string; mode: IntegrationMode; label: string; lastSyncedAt?: string; error?: string }

interface Issue {
  id: string; identifier: string; title: string; description: string; url: string;
  state: { name: string; type: 'backlog' | 'unstarted' | 'started' | 'completed' | 'canceled' };
  priority: 0 | 1 | 2 | 3 | 4; dueDate: string | null; createdAt: string; updatedAt: string;
  projectId: string | null; cycleId: string | null; labels: string[];
  attachments: { id: string; title: string; url: string; sourceType?: string }[]; commentCount: number;
}
interface Project { id: string; name: string; url: string; progress: number; targetDate: string | null; lead: string; role: 'Lead' | 'Contributor'; topics: TopicId[] }
interface Cycle { id: string; number: number; name: string; startsAt: string; endsAt: string; progress: number; url: string }
interface FigmaFile { key: string; name: string; projectName: string; lastModified: string; url: string; thumbnailUrl: string | null; frames: { nodeId: string; name: string }[] }
interface DesignLink { file: FigmaFile; via: 'attachment' | 'name' }

type TopicId = 'ux' | 'ui' | 'product-design' | 'design-systems' | 'ai-in-design' | 'research' | 'product-thinking';
type ReadingStatus = 'to-read' | 'reading' | 'read';
interface Article {
  id: string; title: string; url: string; author: string; publication: string; topic: TopicId;
  summary: string; notes: string; tags: string[]; savedAt: string; status: ReadingStatus; favorite: boolean;
  relatedProjectIds: string[]; collectionIds: string[];
  sourceId?: string | null;        // NEW – set for feed-ingested items
  feedEntryId?: string | null;     // NEW – Atom <id> / RSS <guid>, the dedupe key
  publishedAt?: string | null;     // NEW
}
interface Collection { id: string; name: string }

// NEW
type SourceCategory = 'Release notes' | 'Blog' | 'Newsletter' | 'Publication' | 'Research' | 'Website';
interface Source {
  id: string; name: string; url: string;            // feed URL or site URL
  siteUrl?: string; category: SourceCategory; enabled: boolean;
  updatedAt: string;                                 // feed's own <updated>/lastBuildDate
  lastSyncedAt?: string | null; lastSyncStatus?: 'ok' | 'error' | 'never'; lastSyncError?: string | null;
  etag?: string | null; lastModified?: string | null; // conditional GET
}
interface FeedEntry {                                  // NEW – inbox of fetched items before/without saving
  id: string; sourceId: string; entryId: string;      // unique (sourceId, entryId)
  title: string; url: string; author?: string; summary?: string; categories: string[];
  publishedAt?: string; updatedAt?: string; fetchedAt: string; savedArticleId?: string | null;
}
```

**Product decision for Claude Code to confirm:** should new feed entries appear in Storybook automatically as `to-read` Articles, or in a per-source "New" list until the owner saves them? The user asked that "new Figma releases automatically appear in Storybook", so the default is **auto-create as to-read** with `sourceId` and `feedEntryId` set, deduplicated on `(sourceId, feedEntryId)` with a fallback on canonical URL.

---

## 6. Sample vs real-data boundaries

| Data | Prototype now | Production |
|---|---|---|
| Viewer (Thư, Product Designer · Lumin) | hard-coded config | the Linear `viewer`; must resolve to thunta@luminpdf.com |
| Issues, projects, cycle | **sample** (`pdd-data.js`, dates relative to today) | **Linear API** |
| Figma files and frames | **sample** (6 fake keys) | **Figma REST API**, LEX-02 - New IA Design |
| Storybook articles and collections | seed library in localStorage (`pdd.claude-design.library.v1`) | database |
| Sources | 6 seed sources; "updated" times are sample values | database plus feed ingestion |
| Theme, Storybook layout, rail open | localStorage | keep in localStorage (per device) |

Rules:
- **Every block of non-real data must stay labelled**, using the "Sample Linear data" / "Sample Figma data" pills and the Work banner.
- When an integration is connected, remove its labels automatically (`mode: 'connected'`).
- When it is unavailable or has no permission, show the **disconnected** empty states: "No Figma files yet / Connect Figma", "Not connected…". **Never fall back to sample data in production.** Sample mode should exist only behind a dev flag.

---

## 7. Integration requirements

### Architecture
- A static SPA plus server functions; Vercel is assumed, since the Cowork repo already has `vercel.json`.
- All tokens stay server-side. The browser calls `/api/*` only.
- Keep the Cowork source interfaces (`LinearSource`, `FigmaSource`, `StorybookRepository`) and register the real implementations in `src/data/index.ts`. Views never call integrations directly.

### 7.1 Linear (priority 1)
- Auth: a Linear API key (or OAuth app) in the `LINEAR_API_KEY` environment variable.
- **Endpoint `GET /api/linear/workspace`** returns `{ viewer, issues, projects, cycle, status }` mapped to the types above.
- GraphQL to query:
  - `users(filter: { email: { eq: "thunta@luminpdf.com" } })`, or `viewer` if the key belongs to Thu.
  - `user.assignedIssues(filter: { state: { type: { nin: ["completed","canceled"] } } }, first: 100)`, plus recently completed issues in the current cycle for the "X of Y done" count. Fields:
    - `identifier, title, description, url, priority, dueDate, createdAt, updatedAt`
    - `state { name type }`, `labels { nodes { name } }`, `project { id }`, `cycle { id }`
    - `attachments { nodes { id title url sourceType } }`, `comments { totalCount }`
  - The projects behind those issues: `id name url progress targetDate lead { name }`. `role` is `Lead` when the lead is the viewer.
  - The team's `activeCycle { id number name startsAt endsAt progress }`. The cycle URL is `https://linear.app/<workspace>/team/<KEY>/active`.
- Prioritise current-cycle and active issues; keep backlog items in Up next.
- Cache for 60 s server-side. Expose `lastSyncedAt` and show it in the Integrations dialog.
- Quick links (My issues, Current cycle, Inbox) come from the real workspace slug. Replace the `your-workspace` placeholders.
- `Project.topics` (used for reading matches) has no Linear equivalent. **Assumption:** keep a small local mapping from project to topics, editable in settings, or derive topics from project labels.

### 7.2 Figma (priority 2)
- Auth: a personal access token or OAuth (`FIGMA_TOKEN`), with scope to read files and projects.
- **Endpoint `GET /api/figma/files`**:
  1. find the project **"LEX-02 - New IA Design"** with `GET /v1/teams/:team_id/projects` (a team ID is required; see the assumptions);
  2. `GET /v1/projects/:project_id/files`, giving `key, name, last_modified, thumbnail_url`;
  3. for the most recent N files (say 12), `GET /v1/files/:key?depth=2` for the top-level frames used as deep-link chips. Frame URL: `https://www.figma.com/design/<key>/?node-id=<nodeId with ":"→"-">`.
- "Files I'm actively working on": the API does not expose per-user edit history directly. Use the following, in order:
  - (a) sort by `last_modified`;
  - (b) optionally `GET /v1/files/:key/versions` and keep files whose recent versions were made by the owner's Figma user;
  - (c) no guessing beyond that.
- **Issue links**: only the two verifiable rules in §4. Files with no match show "Not linked to an issue".
- Cache for 5 min; thumbnails are signed URLs with an expiry, so re-fetch them.

### 7.3 Storybook Sources and RSS/Atom (priority 3)
- **Endpoint `GET /api/feed?sourceId=…`** (or `POST /api/sources/:id/sync`). It runs on the server, so there are no CORS issues; this was verified in the browser, where the Figma and NN/g feeds are CORS-blocked.
  - **Only fetch URLs that belong to a stored Source** (an allow-list), so it is not an open proxy.
  - Send `If-None-Match` / `If-Modified-Since` using the stored `etag` / `lastModified`; a 304 means nothing new.
  - Parse Atom and RSS 2.0, for example with `fast-xml-parser`:

    | Field | Atom | RSS 2.0 |
    |---|---|---|
    | entry ID | `<id>` | `<guid>` (else link) |
    | title | `<title>` | `<title>` |
    | canonical URL | `<link rel="alternate" href>` | `<link>` |
    | author | `<author><name>` | `<author>` / `dc:creator` |
    | summary | `<summary>` / `<content>` | `<description>` |
    | categories | `<category term>` | `<category>` |
    | published | `<published>` | `<pubDate>` |
    | updated | `<updated>` | — |

  - Strip HTML from summaries and truncate to about 300 characters.
  - **Dedupe** on `(sourceId, entryId)`, then fall back to the normalised canonical URL. Updated entries update in place; they never duplicate.
  - Map entry categories to `tags` (kebab-case) so they can match Linear labels. Default `topic` per source, settable in the Add source dialog.
    - **Assumption:** add a "Default topic" field to the dialog. It is not in the prototype yet, so this is a small UI addition; otherwise default to `product-design`.
- **Triggers**:
  - refresh on app load (enabled sources, if the last sync is older than 15 min);
  - **"Sync now"** per source and globally in the Sources header (a small UI addition next to "Add source");
  - polling every 30 min while the app is open;
  - a **Vercel Cron** hourly job for background sync while the app is closed.
- Paused sources are skipped by every trigger.
- Sync state per source: `lastSyncedAt`, `lastSyncStatus`, `lastSyncError`. Show "Synced 3m ago" or "Sync failed · Retry" in the row meta, replacing "updated 3h ago".
- Seed sources:

  | Source | URL | Category | Status |
  |---|---|---|---|
  | Figma Release Notes | https://www.figma.com/release-notes/feed/atom.xml | Release notes | active |
  | Nielsen Norman Group | https://www.nngroup.com/feed/rss/ | Publication | active |
  | Product Talk | https://www.producttalk.org/feed/ | Blog | active |
  | Microsoft Research | https://www.microsoft.com/en-us/research/feed/ | Research | active |
  | Google PAIR | https://pair.withgoogle.com/ | Website | active; no feed, so it is never synced |
  | Laws of UX | https://lawsofux.com/ | Website | paused |

  Mark website-only sources as "no feed" and skip syncing them.

### 7.4 Persistence (priority 4)
- Recommended: **Postgres** (Supabase or Vercel Postgres) or **Vercel KV**, behind the existing `StorybookRepository` interface (`list`, `add`, `update`, `remove`, collections, plus new source and feed-entry methods).
- Tables:
  - `articles`, `collections`, `article_collections`
  - `sources`
  - `feed_entries` (unique on `source_id, entry_id`)
  - `sync_runs` (optional log)
- Single user. Protect the app with simple auth, for example Vercel password protection or a magic link for thunta@luminpdf.com, because it exposes Linear and Figma data.
- Optimistic UI: the prototype updates instantly and shows toasts. Keep that, and roll back with an error toast on failure.
- One-time migration: if localStorage has `pdd.claude-design.library.v1` (or the Cowork key), offer to import it on first load.

### 7.5 Deployment (priority 5)
- Vite build to `dist/`, served with `/api/*` serverless functions plus a cron (`vercel.json` `crons`).
- Environment variables:
  - `LINEAR_API_KEY`, `LINEAR_WORKSPACE_SLUG`, `LINEAR_TEAM_KEY`
  - `FIGMA_TOKEN`, `FIGMA_TEAM_ID`
  - `DATABASE_URL` (or `KV_*`)
  - `APP_PASSWORD` (optional)
- Keep hash routing, or switch to browser routing with an SPA fallback.
- Preserve the responsive breakpoint. The prototype measures the **container** width with a ResizeObserver, at 760px. In the app, a `(max-width: 759px)` media query is equivalent.

---

## 7.6 Verified environment findings (from the design session)
- In the design environment, a browser `fetch` to the Figma Atom feed and the NN/g RSS feed failed with a CORS block. Public relays either timed out, required an API key, or hung. **Feeds must be fetched server-side.**
- No Linear or Figma connector was available during design. No real issues, users or files were retrieved, so items 1–2 below are still unverified. All Linear and Figma content in the prototype is sample data.

## 8. Unresolved technical assumptions (confirm before or while building)
1. **Linear identity**: that thunta@luminpdf.com exists in the Lumin Linear workspace, and whether the API key belongs to Thu (`viewer`) or to a service user (look up by email). The sample team key is `DES`; the real one is unknown.
2. **Figma location**: whether "LEX-02 - New IA Design" is a project or a folder, and which team ID it belongs to. The REST API lists files per project, and team IDs must be supplied, since there is no "list my teams" endpoint for PAT users.
3. **"Actively working on"**: the definition in §7.2 (recency, optionally filtered by version authorship).
4. **Auto-ingest vs inbox** for feed entries (§5); the default is auto-create to-read Articles.
5. **Source default topic**: a small form addition (§7.3).
6. **Sync now** buttons: small additions to the Sources view (§7.3).
7. **Project → topics** mapping for reading matches (§7.1).
8. **Auth**: the single-user protection method.
9. **Reset library**: keep it dev-only or remove it.
10. **Thumbnails**: the prototype draws wireframe placeholders. Use Figma `thumbnail_url` when present and keep the placeholder as a fallback.
11. **Recently saved**: no longer a tab. It is the Filter → Saved "Last 14 days" option. Overview links still use `to-read` and `favorites`.

---

## 9. Design tokens (from `@luminpdf/ds`; use the tokens, not the hex values)

| Token | Light | Dark |
|---|---|---|
| `--background` | #ffffff | #0a0a0a |
| `--card` | #ffffff | #171717 |
| `--muted` | #f5f5f5 | #262626 |
| `--accent` | #f5f5f5 | #404040 |
| `--sidebar` | #fafafa | #171717 |
| `--sidebar-accent` | #e5e5e5 | #404040 |
| `--foreground` | #0a0a0a | #fafafa |
| `--muted-foreground` | #737373 | #a3a3a3 |
| `--primary` | #171717 | #e5e5e5 |
| `--primary-foreground` | #fafafa | #171717 |
| `--border` | #e5e5e5 | #ffffff1a |
| `--ring` | #a3a3a3 | #737373 |
| `--destructive` | #dc2626 | #f87171 |
| `--popover` | #ffffff | #262626 |

- Tinted pairs are `--card-<hue>` / `--card-<hue>-foreground`, plus the amber alert pair `--custom-amber-50-dark-amber-950` / `--custom-amber-900-dark-amber-50` / `--custom-amber-200-dark-amber-900` (border).
- **Type** (Inter, bundled):

  | Use | Size / weight |
  |---|---|
  | Page H1 | 28px / 600, −0.02em |
  | Drawer title | 20px / 600, −0.01em |
  | Panel H2 | 15px / 600 |
  | Body | 14px / 1.45 |
  | Meta | 12–13px |
  | Eyebrow | 11px / 600, uppercase, 0.04em |
  | Identifiers | `ui-monospace` 12px |

- **Radius**: controls 8px (DS `rounded-md`); cards and panels 12px; tiles 10px; dialogs 14px; pills and chips 999px.
- **Spacing**: page gap 24px; panel padding 18px; grid gaps 12–16px; Storybook content gap 32px.
- **Shadows**:
  - cards: none, or `0 1px 2px rgb(0 0 0 / .04)`
  - drawers and dialogs: `0 16px 48px rgb(0 0 0 / .18–.2)`
  - popovers and toasts: `0 12px 40px rgb(0 0 0 / .14–.2)`
- **Scrim**: `rgb(10 10 10 / .32)`.

## 10. Assets
No raster assets. Icons come from `@luminpdf/icons` through `@luminpdf/ds`. The Inter font is bundled with the DS. Figma thumbnails use placeholders until real `thumbnail_url` values are available.

## 11. Directory and Figma files (added after the first handoff)

Two views were added between Lumin Work and Storybook. The nav order is now: Overview · Lumin Work · Directory · Figma files · Storybook. The mobile tab bar has 5 tabs.

### 11.1 Figma files (`#/figma`)
**List state**
- Header meta: "N tracked files · Figma not connected · saved in this browser".
- Amber "not connected" banner with a "How to connect" link.
- **Add file form**: four columns on desktop (Figma file link · Name · Role · Add file), stacked on mobile.
  - The name is prefilled from the link's slug ("Taken from the link. Edit if needed.").
  - Validation:
    - empty link
    - non-file link
    - **folder link**: "That’s a folder link. Folders can’t be listed until Figma is connected…"
    - duplicate key: "This file is already tracked."
    - empty name
- **Skip rules bar** (muted background):
  - a Switch, "Skip working pages when indexing";
  - Toggle chips for Archive, Drafts & explorations, Ready to delete, Cover and Index (persisted);
  - an explanation line underneath.
- **Tracked files**: search, a role filter, and one bordered list.
  - Desktop columns: File | Pages | Index | Component usage | Actions.
  - File cell: the name (a button that opens the details state), "Open in Figma ↗", and a role Pill, the key, and "last updated …".
  - Actions: Sync Index, Scan usage, role NativeSelect (sm), and a trash icon (inline confirm, then toast with Undo).
  - **Unknown values render as "—", "Index not synced" or "Not scanned". Never fabricate them.**

**Details state** (click a file name)
- "← All Figma files", role Pill, H1 file name, Open in Figma, Sync Index, Scan usage.
- Two-column grid: `260px minmax(0,1fr)`, stacking below about 1100px container width.
  - Left: the **FileIndex** panel.
  - Right: either "File details" key–value rows (Role, Last updated, Pages, Last index sync, Component usage, Linked cards, File key), or, once a page is selected:
    - the page path ("File › Group") and page name
    - "Open page in Figma ↗"
    - key–value rows: Group, Page ID, Status (Active / Skipped), Component usage
    - "Linked Linear cards" with "Link a card"

### 11.2 Directory (`#/directory`)
- Toolbar: tracked-file NativeSelect, "Filter pages and cards" search, and a "Link a card" primary button.
- The same FileIndex panel, plus a main area:
  - **No page selected**: "Your Linear cards", the real issues assigned to the owner, each with ID, a 2-line title, "Team · Project", a Linked/Not linked Pill and a status Pill.
  - **Page selected**: the page path and title, then "Cards designed on this page".
- **Card drawer** (500px):
  - header: ID, status Pill, version Pill
  - title
  - key–value rows: Cycle, Project, Team, Priority, Design path, Specs, Labels, Updated in Linear
  - Open in Linear, Open design (disabled until linked), "Link to a design page"
  - History timeline; "Add changelog" / "Tag version" input
  - "Unlink card from design" (toast with Undo)
- **Link a card dialog**:
  - fields: Linear card, Figma file, Design page (skipped pages excluded), Section/frame (optional), Version (default v1.0)
  - "Link card" stays disabled with an explanation note until a real indexed page exists.

### 11.3 FileIndex component (`FileIndex.dc.html`), shared by both views
- Props: `title, syncText, groups[], emptyTitle, emptyText, showSync, syncDisabled, syncTitle, onSync, actionLabel, onAction`.
- Group VM: `{ id, name, skipped, expanded, caret, countText, toggle, pages[] }`. Collapse state is keyed by `fileKey:groupId`.
- Page VM: `{ name, count, hasCount, showSkipped, current, bg, weight, color, select }`.
  - Selected page: `bg-accent` with weight 500.
  - Skipped page: muted text, plus a "Skipped" tag or a group-level Skipped pill.
  - Linked-card count: an indigo round badge.
- Both views must read the **same** stored index (`TrackedFile.index`). Do not create a second index model.

### 11.4 Data and service layer (`pdd-figma.js`, the reference implementation)
- The models `TrackedFile`, `Index`, `Usage` and `DesignLink` are documented at the top of the file. Persistence key: `pdd.claude-design.figma.v1`.
- The adapter interface is `{ mode, canResolve, canSync, canScan, canListFolder, reason, resolveFile(url), listFolder(), syncIndex(file, skip) → { name, lastModified, pages:[{id,name}] }, scanUsage(file, skip) → Usage }`.
  - The shipped adapter is **DisconnectedAdapter**: every call throws "Connect Figma to sync file structure and component usage."
  - Production code replaces it with a server-backed adapter (`/api/figma/files/:key`, `/api/figma/files/:key/usage`).
- `buildIndex(pages, skip)` groups pages **only** by real separator pages: ALL-CAPS names such as "SEARCH" or "—— HEADER ——", with "↳ child" pages under them. It marks groups and pages as skipped using the skip list.
- Page deep link: `https://www.figma.com/design/<key>/?node-id=<id with ":"→"-">`.
- Library classification for usage scans:
  - `DS-shadcn-*` is **current** and must never be flagged;
  - `LEX … component/library/UI kit` is **legacy**, using a configurable regex.
  - Scans should use `GET /v1/files/:key?geometry=omit`, walking INSTANCE nodes and resolving `componentId` → `components`/`componentSets` → the library file key through `GET /v1/components/:key`.
- **Scope seed**: the six New IA files (LEX-UI-100 to LEX-UI-105, keys in `SCOPE_FILES`). They are seeded once, and later removals are respected. Names and links came from the team; nothing came from Figma.

### 11.5 Linear in Directory (`pdd-linear-snapshot.js`)
- A **real** snapshot, retrieved through the Linear connector on 2026-10-26: 13 issues assigned to Thu Nguyen (thunta@luminpdf.com).
  - Team: AgreementGen.
  - Statuses: 5 Delivered, 8 Backlog.
  - None are in a cycle.
- It is **static**. Replace it with `/api/linear/workspace` (§7.1). Lumin Work still uses sample data and should move to the same live source.
- Linking rules: a relationship exists only when it was created explicitly (DesignLink), is a Linear attachment to a Figma URL, or the issue ID appears in a page or file name. **Never infer from similar titles.** Persist DesignLinks server-side, with history entries `{ at, kind: version|link|changelog|unlink, text }`.

## 12. Current status: product vs prototype (as of 26 Oct 2026)

| Capability | Status in Claude Design | Production work |
|---|---|---|
| UI, navigation, responsive layout, dark mode | ✅ complete reference | port as-is |
| Storybook articles, favorites, status, notes, collections, sources | ✅ works, **this browser only** (localStorage) | DB plus sync (§7.4) |
| Figma tracked files, skip rules, design links | ✅ works, this browser only | DB |
| Linear data | ⚠️ Directory: real but static snapshot. Lumin Work and Overview: **sample** | live API (§7.1) |
| Figma metadata, index, usage scan | ❌ disconnected (no connector, and the browser can't call the Figma API) | server adapter (§7.2, §11.4) |
| RSS/Atom feeds | ❌ CORS-blocked in the browser (verified) | server feed proxy plus cron (§7.3) |
| Cross-device persistence, auth, background refresh, deploy | ❌ not possible inside Claude Design | Vercel plus DB plus cron (§7.5) |

## 13. Files in this bundle
- `design/Design OS.dc.html`: the whole app (shell, five views, drawers, dialogs, toast) and its logic. This is the source of truth for layout and behaviour.
- `design/FileIndex.dc.html`: the shared index panel (§11.3).
- `design/Pill.dc.html`, `IssueRow`, `IssueCard`, `ProjectCard`, `FigmaTile`, `ArticleCard`: the reusable components (§3).
- `design/pdd-data.js`: selectors, view-models and the **sample** Linear/Figma data. It is the reference for the §4 rules; the sample data must not ship.
- `design/pdd-figma.js`: the Figma files and Directory model, the adapter interface and the disconnected adapter (§11.4).
- `design/pdd-linear-snapshot.js`: the real Linear snapshot (§11.5). Replace it with the live API.
- `design/support.js` and `design/_ds/`: runtime and design-system bundle, so the prototype opens offline.
