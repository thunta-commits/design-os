// Domain model — design/HANDOFF.md §5 and design/pdd-figma.js. Shared by the browser and /api.

export type IntegrationMode = 'sample' | 'connected' | 'disconnected' | 'error';
export interface IntegrationStatus {
  id: 'linear' | 'figma' | 'feeds';
  name: string;
  mode: IntegrationMode;
  label: string;
  lastSyncedAt?: string;
  error?: string;
}

export type StateType = 'triage' | 'backlog' | 'unstarted' | 'started' | 'completed' | 'canceled';
export interface Issue {
  id: string;
  identifier: string;
  title: string;
  description: string;
  url: string;
  state: { name: string; type: StateType };
  priority: 0 | 1 | 2 | 3 | 4;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  projectId: string | null;
  cycleId: string | null;
  team: string;
  labels: string[];
  attachments: { id: string; title: string; url: string; sourceType?: string }[];
  commentCount: number;
}

export type TopicId = 'ux' | 'ui' | 'product-design' | 'design-systems' | 'ai-in-design' | 'research' | 'product-thinking';

export interface Project {
  id: string;
  name: string;
  url: string;
  progress: number;
  targetDate: string | null;
  lead: string;
  role: 'Lead' | 'Contributor';
  topics: TopicId[];
}

export interface Cycle {
  id: string;
  number: number;
  name: string;
  startsAt: string;
  endsAt: string;
  progress: number;
  url: string;
}

export interface FigmaFile {
  key: string;
  name: string;
  projectName: string;
  lastModified: string;
  url: string;
  thumbnailUrl: string | null;
  frames: { nodeId: string; name: string }[];
}
export interface DesignLinkMatch { file: FigmaFile; via: 'attachment' | 'name' }

export interface Viewer { name: string; role: string; team: string; email: string; linearName?: string }

export interface WorkspaceLinks { myIssues: string; activeCycle: string; inbox: string; figmaRecents: string }

/** GET /api/linear/workspace */
export interface LinearWorkspace {
  status: IntegrationStatus;
  viewer: { id: string; name: string; email: string } | null;
  issues: Issue[];
  projects: Project[];
  cycle: Cycle | null;
  links: WorkspaceLinks;
  fetchedAt: string | null;
}

// ─── Storybook ───
export type ReadingStatus = 'to-read' | 'reading' | 'read';
export interface Article {
  id: string;
  title: string;
  url: string;
  author: string;
  publication: string;
  topic: TopicId;
  summary: string;
  notes: string;
  tags: string[];
  savedAt: string;
  status: ReadingStatus;
  favorite: boolean;
  relatedProjectIds: string[];
  collectionIds: string[];
  sourceId?: string | null;
  feedEntryId?: string | null;
  publishedAt?: string | null;
}
export interface Collection { id: string; name: string }
export type SourceCategory = 'Release notes' | 'Blog' | 'Newsletter' | 'Publication' | 'Research' | 'Website';
export interface Source {
  id: string;
  name: string;
  url: string;
  siteUrl?: string;
  category: SourceCategory;
  enabled: boolean;
  updatedAt: string;
  lastSyncedAt?: string | null;
  lastSyncStatus?: 'ok' | 'error' | 'never';
  lastSyncError?: string | null;
}
export interface Library { articles: Article[]; collections: Collection[]; sources: Source[] }

// ─── Figma files + Directory (design/pdd-figma.js) ───
export type FileRole = 'product' | 'library' | 'foundation' | 'reference';
export interface IndexPage { id: string; nodeId: string; name: string; skipped?: boolean }
export interface IndexGroup { id: string; name: string; kind: string; skipped: boolean; pages: IndexPage[] }
export interface FileIndexData { groups: IndexGroup[] }
export interface Usage {
  instances: number;
  pagesWithInstances: number;
  libraries: { fileKey: string; name: string; kind: 'current' | 'legacy' | 'local' | 'other'; components: { key: string; name: string; instances: number; pages: { pageId: string; name: string; instances: number }[] }[] }[];
}
export interface TrackedFile {
  key: string;
  url: string;
  name: string;
  role: FileRole;
  addedAt: string;
  nameSource: 'manual' | 'link' | 'figma' | 'user';
  scope?: string;
  lastModified: string | null;
  pageCount: number | null;
  index: FileIndexData | null;
  indexSyncedAt: string | null;
  usage: Usage | null;
  usageScannedAt: string | null;
  usageStatus: 'never' | 'running' | 'ok' | 'error';
  usageError: string | null;
  /** Signed preview image from Figma; expires, so it is refreshed on each sync. */
  thumbnailUrl?: string | null;
  /** State of the latest Sync Index attempt. `index` and `indexSyncedAt` always describe the last *successful* sync. */
  indexSyncStatus?: 'syncing' | 'error' | null;
  indexSyncError?: string | null;
  indexAttemptedAt?: string | null;
}
export interface HistoryEntry { at: string; kind: 'version' | 'link' | 'changelog' | 'unlink'; text: string; url?: string }
export interface DesignLink {
  id: string;
  fileKey: string;
  pageId: string;
  pageName: string;
  groupName: string;
  nodeId: string | null;
  frameName: string | null;
  /** Linear issue identifier, e.g. AG-111 */
  issueId: string;
  version: string;
  history: HistoryEntry[];
}
export interface SkipSettings { enabled: boolean; groups: string[] }
export interface FigmaStore { files: TrackedFile[]; links: DesignLink[]; skip: SkipSettings; seeded: string[] }
