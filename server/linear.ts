/* Linear GraphQL → domain model (HANDOFF §7.1). Server-only: LINEAR_API_KEY never reaches the browser.
   Identity: the key's viewer when its email matches LINEAR_VIEWER_EMAIL, otherwise that user looked up by email. */
import type { Cycle, Issue, LinearWorkspace, Project } from '../src/data/types';
import { env } from './http';

const ENDPOINT = 'https://api.linear.app/graphql';
const DEFAULT_EMAIL = 'thunta@luminpdf.com';
const FIGMA_RECENTS = 'https://www.figma.com/files/recents-and-sharing';
const CACHE_MS = 60_000;

class LinearError extends Error {}

async function gql<T>(query: string, variables: Record<string, unknown>, key: string): Promise<T> {
  const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'content-type': 'application/json', authorization: key }, body: JSON.stringify({ query, variables }) });
  const body = await res.json().catch(() => null) as { data?: T; errors?: { message: string }[] } | null;
  if (res.status === 401 || res.status === 403) throw new LinearError('Linear rejected the API key. Check LINEAR_API_KEY.');
  if (!res.ok || !body || body.errors?.length) throw new LinearError(body?.errors?.[0]?.message || `Linear request failed (${res.status})`);
  return body.data as T;
}

const IDENTITY = `query Identity($email: String!) {
  viewer { id name email organization { urlKey } }
  users(filter: { email: { eq: $email } }) { nodes { id name email } }
}`;

const ISSUES = `query Assigned($userId: String!, $after: String) {
  user(id: $userId) {
    assignedIssues(first: 50, after: $after, orderBy: updatedAt) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id identifier title description url priority dueDate createdAt updatedAt
        state { name type }
        labels(first: 20) { nodes { name } }
        project { id name url progress targetDate lead { id name } }
        cycle { id }
        team { id key name }
        attachments(first: 20) { nodes { id title url sourceType } }
        comments(first: 50) { nodes { id } }
      }
    }
  }
}`;

const TEAM_CYCLE = `query TeamCycle($id: String!) {
  team(id: $id) { id key activeCycle { id number name startsAt endsAt progress } }
}`;

type RawIssue = {
  id: string; identifier: string; title: string; description: string | null; url: string; priority: number; dueDate: string | null; createdAt: string; updatedAt: string;
  state: { name: string; type: Issue['state']['type'] }; labels: { nodes: { name: string }[] };
  project: { id: string; name: string; url: string; progress: number; targetDate: string | null; lead: { id: string; name: string } | null } | null;
  cycle: { id: string } | null; team: { id: string; key: string; name: string };
  attachments: { nodes: { id: string; title: string; url: string; sourceType: string | null }[] }; comments: { nodes: { id: string }[] };
};

let cache: { at: number; data: LinearWorkspace } | null = null;

const base = (mode: LinearWorkspace['status']['mode'], label: string, error?: string): LinearWorkspace => ({
  status: { id: 'linear', name: 'Linear', mode, label, ...(error ? { error } : {}) },
  viewer: null, issues: [], projects: [], cycle: null, fetchedAt: null,
  links: { myIssues: 'https://linear.app', activeCycle: 'https://linear.app', inbox: 'https://linear.app', figmaRecents: FIGMA_RECENTS },
});

export async function getLinearWorkspace({ refresh = false } = {}): Promise<LinearWorkspace> {
  const key = env('LINEAR_API_KEY');
  if (!key) return base('disconnected', 'Not connected', 'LINEAR_API_KEY is not set.');
  if (!refresh && cache && Date.now() - cache.at < CACHE_MS) return cache.data;
  try {
    const data = await load(key);
    cache = { at: Date.now(), data };
    return data;
  } catch (err) {
    // Never fall back to sample data in production (HANDOFF §6).
    return base('error', 'Can’t reach Linear', (err as Error).message);
  }
}

async function load(key: string): Promise<LinearWorkspace> {
  const email = (env('LINEAR_VIEWER_EMAIL') || DEFAULT_EMAIL).toLowerCase();
  const id = await gql<{ viewer: { id: string; name: string; email: string; organization: { urlKey: string } }; users: { nodes: { id: string; name: string; email: string }[] } }>(IDENTITY, { email }, key);
  const user = id.viewer.email.toLowerCase() === email ? id.viewer : id.users.nodes[0];
  if (!user) throw new LinearError(`No Linear user found for ${email}.`);
  const slug = env('LINEAR_WORKSPACE_SLUG') || id.viewer.organization.urlKey;
  const ws = `https://linear.app/${slug}`;

  const raw: RawIssue[] = [];
  let after: string | null = null;
  for (let page = 0; page < 6; page++) {
    const r: { user: { assignedIssues: { pageInfo: { hasNextPage: boolean; endCursor: string }; nodes: RawIssue[] } } } = await gql(ISSUES, { userId: user.id, after }, key);
    raw.push(...r.user.assignedIssues.nodes);
    if (!r.user.assignedIssues.pageInfo.hasNextPage) break;
    after = r.user.assignedIssues.pageInfo.endCursor;
  }

  const issues: Issue[] = raw.map((i) => ({
    id: i.id, identifier: i.identifier, title: i.title, description: i.description || '', url: i.url,
    state: i.state, priority: (Math.max(0, Math.min(4, i.priority)) as Issue['priority']), dueDate: i.dueDate, createdAt: i.createdAt, updatedAt: i.updatedAt,
    projectId: i.project?.id || null, cycleId: i.cycle?.id || null, team: i.team.name,
    labels: i.labels.nodes.map((l) => l.name), attachments: i.attachments.nodes.map((a) => ({ id: a.id, title: a.title, url: a.url, sourceType: a.sourceType || undefined })),
    commentCount: i.comments.nodes.length,
  }));

  const projects = new Map<string, Project>();
  for (const i of raw) if (i.project && !projects.has(i.project.id)) {
    const p = i.project;
    projects.set(p.id, { id: p.id, name: p.name, url: p.url, progress: p.progress, targetDate: p.targetDate, lead: p.lead?.name || 'No lead', role: p.lead?.id === user.id ? 'Lead' : 'Contributor', topics: [] });
  }

  // The cycle shown is the active cycle of LINEAR_TEAM_KEY, or of the team holding most of your open issues.
  const teams = new Map<string, { id: string; key: string; open: number }>();
  for (const i of raw) { const t = teams.get(i.team.id) || { id: i.team.id, key: i.team.key, open: 0 }; if (!['completed', 'canceled'].includes(i.state.type)) t.open++; teams.set(i.team.id, t); }
  const wantKey = env('LINEAR_TEAM_KEY');
  const team = [...teams.values()].find((t) => t.key === wantKey) || [...teams.values()].sort((a, b) => b.open - a.open)[0];
  let cycle: Cycle | null = null;
  if (team) {
    const tc = await gql<{ team: { key: string; activeCycle: { id: string; number: number; name: string | null; startsAt: string; endsAt: string; progress: number } | null } }>(TEAM_CYCLE, { id: team.id }, key);
    const c = tc.team.activeCycle;
    if (c) cycle = { id: c.id, number: c.number, name: c.name || `Cycle ${c.number}`, startsAt: c.startsAt, endsAt: c.endsAt, progress: c.progress, url: `${ws}/team/${tc.team.key}/active` };
  }

  const fetchedAt = new Date().toISOString();
  return {
    status: { id: 'linear', name: 'Linear', mode: 'connected', label: 'Connected', lastSyncedAt: fetchedAt },
    viewer: { id: user.id, name: user.name, email: user.email },
    issues, projects: [...projects.values()], cycle, fetchedAt,
    links: { myIssues: `${ws}/my-issues/assigned`, activeCycle: team ? `${ws}/team/${team.key}/active` : `${ws}/my-issues/assigned`, inbox: `${ws}/inbox`, figmaRecents: FIGMA_RECENTS },
  };
}
