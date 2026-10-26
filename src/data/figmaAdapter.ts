/* Figma adapter interface from design/pdd-figma.js. The UI only talks to an adapter:
   - DisconnectedAdapter: every call throws and nothing is fabricated (no FIGMA_TOKEN, or sample mode).
   - ServerAdapter: Sync Index reads the file through /api/figma/file (the token stays on the server).
   Scan usage is not implemented yet and stays unavailable in both. */
import { NOT_CONNECTED } from '../rules/figma';
import { figmaApi } from './api';
import type { SkipSettings, TrackedFile, Usage } from './types';

export interface FigmaAdapter {
  mode: 'connected' | 'disconnected';
  label: string;
  canResolve: boolean;
  canSync: boolean;
  canScan: boolean;
  canListFolder: boolean;
  /** Why Sync Index is unavailable (shown as the disabled button's tooltip). */
  reason: string;
  /** Why Scan usage is unavailable. */
  scanReason: string;
  resolveFile(url: string): Promise<{ key: string; name: string; lastModified: string }>;
  listFolder(): Promise<{ key: string; name: string }[]>;
  syncIndex(file: TrackedFile, skip: SkipSettings): Promise<{ name: string; lastModified: string; thumbnailUrl: string | null; pages: { id: string; name: string }[] }>;
  scanUsage(file: TrackedFile, skip: SkipSettings): Promise<Usage>;
}

export const SCAN_NOT_READY = 'Usage scanning isn’t available yet.';

export const DisconnectedAdapter: FigmaAdapter = {
  mode: 'disconnected', label: 'Not connected', canResolve: false, canSync: false, canScan: false, canListFolder: false, reason: NOT_CONNECTED, scanReason: NOT_CONNECTED,
  async resolveFile() { throw new Error(NOT_CONNECTED); },
  async listFolder() { throw new Error('Folders can’t be listed without the Figma connector. Add each file by its link.'); },
  async syncIndex() { throw new Error(NOT_CONNECTED); },
  async scanUsage() { throw new Error(NOT_CONNECTED); },
};

export const ServerAdapter: FigmaAdapter = {
  mode: 'connected', label: 'Connected', canResolve: false, canSync: true, canScan: false, canListFolder: false, reason: '', scanReason: SCAN_NOT_READY,
  async resolveFile() { throw new Error('Name lookup from a link isn’t available yet. Enter the name, then Sync Index.'); },
  async listFolder() { throw new Error('Folders can’t be listed yet. Add each file by its link.'); },
  async syncIndex(file) {
    const r = await figmaApi.file(file.key);
    return { name: r.name, lastModified: r.lastModified, thumbnailUrl: r.thumbnailUrl, pages: r.pages };
  },
  async scanUsage() { throw new Error(SCAN_NOT_READY); },
};
