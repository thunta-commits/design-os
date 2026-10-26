/* Figma adapter interface from design/pdd-figma.js. This slice ships the DisconnectedAdapter:
   every call throws and nothing is fabricated. The server-backed adapter
   (/api/figma/files/:key, /api/figma/files/:key/usage) replaces it in the Figma slice. */
import { NOT_CONNECTED } from '../rules/figma';
import type { SkipSettings, TrackedFile, Usage } from './types';

export interface FigmaAdapter {
  mode: 'connected' | 'disconnected';
  label: string;
  canResolve: boolean;
  canSync: boolean;
  canScan: boolean;
  canListFolder: boolean;
  reason: string;
  resolveFile(url: string): Promise<{ key: string; name: string; lastModified: string }>;
  listFolder(): Promise<{ key: string; name: string }[]>;
  syncIndex(file: TrackedFile, skip: SkipSettings): Promise<{ name: string; lastModified: string; pages: { id: string; name: string }[] }>;
  scanUsage(file: TrackedFile, skip: SkipSettings): Promise<Usage>;
}

export const DisconnectedAdapter: FigmaAdapter = {
  mode: 'disconnected', label: 'Not connected', canResolve: false, canSync: false, canScan: false, canListFolder: false, reason: NOT_CONNECTED,
  async resolveFile() { throw new Error(NOT_CONNECTED); },
  async listFolder() { throw new Error('Folders can’t be listed without the Figma connector. Add each file by its link.'); },
  async syncIndex() { throw new Error(NOT_CONNECTED); },
  async scanUsage() { throw new Error(NOT_CONNECTED); },
};

export const figmaAdapter: FigmaAdapter = DisconnectedAdapter;
