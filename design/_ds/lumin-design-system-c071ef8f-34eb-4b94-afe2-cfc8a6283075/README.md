## Building with the Lumin Design System

<!-- @ds-provenance:start -->
### Source

This library is compiled from real source, not reimplemented. It came from:

| | |
|---|---|
| Package | `@luminpdf/ds` v0.2.11 |
| Repository | [github.com/luminpdf/platform](https://github.com/luminpdf/platform) |
| Path | `packages/lumin-design-system` |
| Branch | `production` |
| Commit | [`35e8b86b8d`](https://github.com/luminpdf/platform/commit/35e8b86b8d5556621d886bdb60dcc804ab69d408) · 2026-08-05 |
| Last change to this package | [`b80c80db91`](https://github.com/luminpdf/platform/commit/b80c80db91) · 2026-07-21 |
| Icons | `@luminpdf/icons` v0.5.0 |

Source tree was clean at build time — the bundle matches this commit exactly.
Component sources live at `packages/lumin-design-system/components/ui/<name>.tsx`; each card's
`.prompt.md` names the Figma node it matches.
<!-- @ds-provenance:end -->

Every component below is real compiled `@luminpdf/ds` code on `window.LuminDS` —
destructure what you need, there is nothing to import or install.

### Setup

Link `styles.css` once (it `@import`s the tokens, Inter, and all component CSS)
and mount into your own node. **Most components need no provider**, with two
exceptions that throw or misbehave without one:

- `TooltipProvider` must wrap any `Tooltip` — `Tooltip` is Radix's Root, not a
  self-contained widget.
- `SidebarProvider` must wrap any `Sidebar` — it throws
  `useSidebar must be used within a SidebarProvider`.

**Dark mode is one class.** The theme declares
`@custom-variant dark (&:is(.dark *))`, so putting `class="dark"` on an ancestor
flips every token and every `dark:` utility at once. Never hand-pick dark colours.

### Styling idiom: Tailwind v4 utilities over semantic tokens

This is a Tailwind v4 system. Style with utility classes, and **never hardcode a
hex value** — use the semantic families, which are defined for light and dark:

| Purpose | Classes |
|---|---|
| Surfaces | `bg-background` `bg-card` `bg-popover` `bg-muted` `bg-accent` `bg-sidebar` |
| Text | `text-foreground` `text-muted-foreground` `text-card-foreground` `text-popover-foreground` `text-accent-foreground` |
| Intent pairs | `bg-primary`/`text-primary-foreground`, `bg-secondary`/`text-secondary-foreground`, `bg-destructive`/`text-destructive-foreground` |
| Lines & focus | `border-border` `border-input` `ring-ring` |
| Data viz | `bg-chart-1` … `bg-chart-5` (also `text-chart-*`) |
| Tinted cards | `bg-card-{red,orange,amber,yellow,lime,green,emerald,teal,cyan,sky,blue,indigo,violet,purple,fuchsia,pink,rose}` with the matching `text-card-<hue>-foreground` |

Typography beyond Tailwind's defaults — these are custom utilities, not guesses:

- `text-display-{sm,md,lg,xl}` — marketing display type.
- `text-heading-{sm,md,lg,xl}` — UI headings.
- Body copy is plain `text-xs` / `text-sm` / `text-base` / `text-lg`, in Inter.

Layout helpers: `px-container`, `py-section`, `gap-section-title-{sm,md,lg,xl}`.
Radius: `rounded-{none,xs,sm,md,lg,xl,2xl,3xl,full}` — **`rounded-md` (8px) is the
DS default for controls**, matching Figma.

Prefer a component prop over a class when one exists. `Button` takes
`variant="default|destructive|outline|secondary|ghost|link"`,
`size="default|xs|sm|lg|icon|icon-xs|icon-sm|icon-lg"` and `loading`; `Badge` adds
a `verified` variant to that same variant list.

### Icons

221 Lumin icons ship on the same global, always spelled **`<Name>Icon`** —
`CaretDownIcon`, `MagnifyingGlassIcon`, `TrashIcon`, `SignatureIcon`,
`FilePdfIcon`, `AiSparkleIcon`. (The bare `CaretDown` form is deprecated
upstream and is deliberately not exported.) Use these rather than inlining SVG —
they are the brand's iconography.

They render as `<svg>` and default to `fill: currentColor`, so **colour them with
text utilities**, not a `color` prop: `<TrashIcon className="text-destructive" />`.
Props: `size` (number or CSS length), `color`, `weight`
(`thin | light | regular | bold | fill | duotone`, default `regular`),
`mirrored`, and `alt` (renders an SVG `<title>` — set it when the icon is the
only label).

```jsx
const { Button, TrashIcon, MagnifyingGlassIcon } = window.LuminDS;

<Button variant="destructive"><TrashIcon /> Delete</Button>
<Button variant="ghost" size="icon" aria-label="Search"><MagnifyingGlassIcon size={18} /></Button>
```

The set covers navigation, actions, status, files, people, communication, time,
layout, media, security, commerce, charts and system, plus Lumin's own
`SignatureIcon`, `StampIcon`, `HighlighterIcon`, `AgreementGenIcon` and
`AiSparkleIcon`. It is a curated subset of `@luminpdf/icons` (1,773 icons) — if
you need one that isn't on the global, pick the nearest available rather than
inlining a foreign SVG.

### Where the truth lives

Read these before styling — they beat any summary:

- `styles.css` and the files it `@import`s — the real compiled tokens and utilities.
- `components/<group>/<Name>/<Name>.prompt.md` and `<Name>.d.ts` — the exact prop
  contract per component, plus `@lumin-delta` notes recording where this DS
  intentionally diverges from shadcn and which Figma node each matches.
- `guidelines/` — the team's own design documentation.

### Available but not shown as cards

These ship on `window.LuminDS` and are fully usable; they simply have no upstream
stories, so there is no preview card: `AspectRatio`, `Drawer`, `Empty`, `Form`,
`HoverCard`, `Item`, `Kbd`, `Label`, `NativeSelect`, `NavigationMenu`,
`Separator`, `Sidebar`, `Skeleton`, `Slider`, `Spinner`, `Switch`, `ToggleGroup`
— plus the helpers `cn`, `TooltipProvider`, `SidebarProvider`, `DirectionProvider`.
Check their `.d.ts` for props.

### Idiomatic example

Library components for the controls; DS utilities for your own layout glue.

```jsx
const { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, Label } = window.LuminDS;

<div className="bg-background px-container py-section flex flex-col gap-6">
  <div className="flex items-center justify-between">
    <h2 className="text-heading-lg text-foreground">Documents</h2>
    <Badge variant="secondary">12 total</Badge>
  </div>

  <Card>
    <CardHeader><CardTitle>Share this file</CardTitle></CardHeader>
    <CardContent className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" placeholder="name@lumin.com" />
      </div>
      <p className="text-muted-foreground text-sm">Anyone with the link can view.</p>
      <Button className="w-full">Send invite</Button>
    </CardContent>
  </Card>
</div>
```

> One caveat: `text-display-*` is designed for "PP Agrandir", a licensed face that
> is not bundled — it falls back to the Inter sans stack. Everything else renders
> in the real Inter shipped with this system.

# LuminDS (@luminpdf/ds@0.2.11)

This design system is the published @luminpdf/ds React library, bundled as a single
browser global. All 40 components are the real upstream code.

## Where things are

- `_ds_bundle.js` — the whole-DS bundle at the project root; loads every component to `window.LuminDS`. First line is a `/* @ds-bundle: … */` metadata header.
- `styles.css` — the single stylesheet entry: it `@import`s the tokens, fonts, and component styles (`_ds_bundle.css`). Link this one file.
- `components/<group>/<Name>/<Name>.prompt.md` (example JSX + variants), `<Name>.d.ts` (types), `<Name>.html` (variant grid).
- `tokens/*.css` — CSS custom properties, names verbatim from upstream.
- `fonts/` — `@font-face` files + `fonts.css` (when the package ships fonts).
- `guidelines/` — the design system's own usage guidance (10 doc(s), see `guidelines/index.md`). Read these before composing larger layouts.

For a specific component, `read_file("components/<group>/<Name>/<Name>.prompt.md")`.

## Loading

Add these two lines to your page once (React must be on the page first):

```html
<link rel="stylesheet" href="styles.css">
<script src="_ds_bundle.js"></script>
```

Components are then available at `window.LuminDS.*`. Mount into a dedicated child node (e.g. `<div id="ds-root">`), not the host page's own React root, so the two trees don't collide:

```jsx
const { Accordion } = window.LuminDS;
ReactDOM.createRoot(document.getElementById('ds-root')).render(<Accordion />);
```

## Tokens

647 CSS custom properties from @luminpdf/ds. Names are
preserved verbatim from upstream. They are declared inside `_ds_bundle.css` (this DS ships one compiled stylesheet rather than separate token files).

- **color** (290): `--tw-border-style`, `--tw-shadow-color`, `--tw-inset-shadow-color`, …
- **spacing** (15): `--tw-space-y-reverse`, `--tw-space-x-reverse`, `--tw-inset-shadow`, …
- **typography** (63): `--tw-font-weight`, `--tw-tracking`, `--font-sans`, …
- **radius** (12): `--radius-xs`, `--radius-sm`, `--radius-md`, …
- **shadow** (20): `--tw-shadow`, `--tw-shadow-alpha`, `--tw-ring-shadow`, …
- **other** (247): `--tw-translate-x`, `--tw-translate-y`, `--tw-translate-z`, …

## Components

### ui
- `Accordion`
- `ChartContainer`
- `Collapsible`
- `ContextMenu`
- `DatePicker`
- `DropdownMenu`
- `Field`
- `Menubar`
- `Sheet`
- `Table`
- `Tabs`
- `Toaster`
- `Toggle`
- `Tooltip`

### lumin
- `Alert`
- `AlertDialog`
- `Avatar`
- `Badge`
- `Breadcrumb`
- `Button`
- `ButtonGroup`
- `Calendar`
- `Card`
- `Carousel`
- `Checkbox`
- `Combobox`
- `Command`
- `Dialog`
- `FilePicker`
- `Input`
- `InputGroup`
- `InputOTP`
- `Pagination`
- `Popover`
- `Progress`
- `RadioGroup`
- `ResizablePanelGroup`
- `ScrollArea`
- `Select`
- `Textarea`
