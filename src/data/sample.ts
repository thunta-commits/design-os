/* SAMPLE Linear + Figma data, copied from design/pdd-data.js. Development only:
   loaded when VITE_SAMPLE_DATA=1 so the coded app can be compared against the prototype.
   Production never falls back to it (HANDOFF §6). */
import { isoDateFromToday, isoHoursAgo } from '../lib/dates';
import type { Cycle, FigmaFile, Issue, LinearWorkspace, Project, StateType } from './types';

const base = 'https://linear.app/your-workspace';
const K = { share: 'SAMPLEshare01', esign: 'SAMPLEesign02', ai: 'SAMPLEai03', empty: 'SAMPLEempty04', forms: 'SAMPLEforms05', icons: 'SAMPLEicons06' };
const furl = (k: string, s: string) => `https://www.figma.com/design/${k}/${s}`;

export function sampleFigmaFiles(): FigmaFile[] {
  return [
    { key: K.share, name: 'Share dialog — permissions v4', projectName: 'Sign & Share', lastModified: isoHoursAgo(2), url: furl(K.share, 'Share-dialog'), thumbnailUrl: null, frames: [{ nodeId: '12:340', name: 'Dialog / Default' }, { nodeId: '12:512', name: 'Dialog / Link settings' }, { nodeId: '14:88', name: 'Downgrade warning' }] },
    { key: K.esign, name: 'eSign mobile — field placement', projectName: 'Sign & Share', lastModified: isoHoursAgo(20), url: furl(K.esign, 'eSign-mobile'), thumbnailUrl: null, frames: [{ nodeId: '3:20', name: 'Field tray' }, { nodeId: '3:118', name: 'Zoomed placement' }] },
    { key: K.ai, name: 'DES-230 Lumin AI — Summarize states', projectName: 'Lumin AI', lastModified: isoHoursAgo(28), url: furl(K.ai, 'Summarize-states'), thumbnailUrl: null, frames: [{ nodeId: '1:4', name: 'Loading' }, { nodeId: '1:90', name: 'Error / Rate limit' }, { nodeId: '1:160', name: 'Scanned PDF' }] },
    { key: K.empty, name: 'DES-198 Documents — empty states', projectName: 'Activation', lastModified: isoHoursAgo(7), url: furl(K.empty, 'Empty-states'), thumbnailUrl: null, frames: [{ nodeId: '8:2', name: 'New account' }, { nodeId: '8:40', name: 'No results' }] },
    { key: K.forms, name: 'DS v3 — Form fields audit', projectName: 'Design System', lastModified: isoHoursAgo(98), url: furl(K.forms, 'Form-audit'), thumbnailUrl: null, frames: [{ nodeId: '2:1', name: 'Inventory' }] },
    { key: K.icons, name: 'Annotation icons — 20px grid', projectName: 'Design System', lastModified: isoHoursAgo(50), url: furl(K.icons, 'Annotation-icons'), thumbnailUrl: null, frames: [{ nodeId: '5:10', name: 'Toolbar set' }] },
  ];
}

export function sampleLinearWorkspace(): LinearWorkspace {
  const cycle: Cycle = { id: 'cyc-42', number: 42, name: 'Cycle 42', startsAt: isoDateFromToday(-8), endsAt: isoDateFromToday(6), progress: 0.58, url: `${base}/team/DES/active` };
  const projects: Project[] = [
    { id: 'prj-sign-share', name: 'Sign & Share 2.0', url: `${base}/project/sign-and-share-2`, progress: 0.62, targetDate: isoDateFromToday(23), lead: 'You', role: 'Lead', topics: ['ux', 'ui', 'product-design'] },
    { id: 'prj-ai', name: 'Lumin AI Assistant', url: `${base}/project/lumin-ai-assistant`, progress: 0.38, targetDate: isoDateFromToday(44), lead: 'Product lead', role: 'Contributor', topics: ['ai-in-design', 'ux'] },
    { id: 'prj-ds3', name: 'Design System v3', url: `${base}/project/design-system-v3`, progress: 0.24, targetDate: isoDateFromToday(80), lead: 'Design lead', role: 'Contributor', topics: ['design-systems', 'ui'] },
    { id: 'prj-activation', name: 'Activation & Onboarding', url: `${base}/project/activation`, progress: 0.15, targetDate: isoDateFromToday(37), lead: 'Growth PM', role: 'Contributor', topics: ['research', 'product-thinking', 'ux'] },
  ];
  const att = (key: string, title: string) => ({ id: `att-${key}`, title, url: `https://www.figma.com/design/${key}/sample`, sourceType: 'figma' });
  const S = (name: string, type: StateType) => ({ name, type });
  type Seed = [string, string, string, Issue['state'], Issue['priority'], number | null, number, string | null, string | null, string[], Issue['attachments'], number];
  const seeds: Seed[] = [
    ['DES-214', 'Share dialog: permission levels & link settings', 'Redesign the share dialog so viewers, commenters and editors are clear at a glance. Include link expiry and "anyone with the link" states, and the downgrade warning when removing edit access.', S('In Progress', 'started'), 2, 1, 2, 'prj-sign-share', 'cyc-42', ['ux', 'permissions', 'sharing'], [att(K.share, 'Share dialog — permissions v4')], 6],
    ['DES-221', 'eSign: signer field placement on mobile', 'Signers on small screens struggle to place signature and date fields precisely. Explore snap-to-line, zoomed placement mode and a field tray. Hand-off needed before the sprint review.', S('In Progress', 'started'), 1, 1, 20, 'prj-sign-share', 'cyc-42', ['mobile', 'esign', 'interaction'], [att(K.esign, 'eSign mobile — field placement')], 3],
    ['DES-230', 'AI Summarize panel: loading, empty and error states', 'Define every non-happy-path state for the Summarize panel: long documents, scanned PDFs without text, rate limits and partial results. Pair with eng on streaming behaviour.', S('In Progress', 'started'), 2, 6, 30, 'prj-ai', 'cyc-42', ['ai', 'states', 'ux'], [], 2],
    ['DES-226', 'Annotation toolbar: icon set refresh', 'Redraw the annotation toolbar icons on the 20px grid with a consistent 1.5px stroke. Check legibility at 16px and in dark mode.', S('In Progress', 'started'), 3, 8, 54, 'prj-ds3', 'cyc-42', ['icons', 'design-system', 'ui'], [], 0],
    ['DES-205', 'Synthesis: PDF merge usability test', 'Synthesise the five moderated sessions on the merge flow. Pull out top issues, severity and recommended changes for the PM review.', S('In Review', 'started'), 2, 0, 4, 'prj-activation', 'cyc-42', ['research', 'usability-testing'], [], 4],
    ['DES-198', 'Documents list empty states', 'Empty states for a new account, an empty folder, no search results and a filtered view with no matches. Each should point to one clear next action.', S('In Review', 'started'), 3, 3, 6, 'prj-activation', 'cyc-42', ['onboarding', 'empty-states', 'ux'], [], 3],
    ['DES-187', 'Billing page: plan comparison table', 'Make plan differences scannable on the billing page. Group features, highlight the current plan, and handle the annual/monthly toggle.', S('Todo', 'unstarted'), 2, -2, 72, null, 'cyc-42', ['pricing', 'ui', 'tables'], [], 1],
    ['DES-233', 'Audit form-field components for DS v3', 'Inventory text fields, selects, date pickers and checkboxes across the app. Note inconsistencies in states, spacing and error messaging; propose the v3 spec.', S('Todo', 'unstarted'), 3, 12, 96, 'prj-ds3', 'cyc-42', ['design-system', 'forms', 'accessibility'], [], 0],
    ['DES-238', 'AI chat: citation and source chips', 'Show where an AI answer came from in the document. Chips should jump to the cited page and highlight the passage.', S('Todo', 'unstarted'), 3, 19, 120, 'prj-ai', null, ['ai', 'trust', 'ui'], [], 1],
    ['DES-236', 'Onboarding checklist v2 explorations', 'Explore three directions for the first-run checklist: task list, guided tour, and contextual nudges. Bring to design crit.', S('Backlog', 'backlog'), 4, 15, 150, 'prj-activation', null, ['onboarding', 'exploration'], [], 0],
    ['DES-241', 'Share: guest access activity log', 'Let owners see who opened, commented on or downloaded a shared document.', S('Backlog', 'backlog'), 4, null, 200, 'prj-sign-share', null, ['sharing', 'permissions'], [], 0],
    ['DES-209', 'Merge flow: file order and preview', 'Drag to reorder files before merging, with page-count preview. Shipped to beta.', S('Done', 'completed'), 3, -3, 26, 'prj-activation', 'cyc-42', ['ux', 'merge'], [], 5],
  ];
  const issues: Issue[] = seeds.map((s, i) => ({
    id: `iss-${i + 1}`, identifier: s[0], title: s[1], description: s[2], state: s[3], priority: s[4],
    dueDate: s[5] === null ? null : isoDateFromToday(s[5]), updatedAt: isoHoursAgo(s[6]), projectId: s[7], cycleId: s[8], team: 'Design',
    labels: s[9], attachments: s[10], commentCount: s[11], url: `${base}/issue/${s[0]}`, createdAt: isoHoursAgo(24 * (20 + i)),
  }));
  return {
    status: { id: 'linear', name: 'Linear', mode: 'sample', label: 'Sample data' },
    viewer: null, issues, projects, cycle, fetchedAt: null,
    links: { myIssues: `${base}/my-issues/assigned`, activeCycle: `${base}/team/DES/active`, inbox: `${base}/inbox`, figmaRecents: 'https://www.figma.com/files/recents-and-sharing' },
  };
}
