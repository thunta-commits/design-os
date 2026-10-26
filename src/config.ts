// Personal settings. No secrets here: tokens live in Vercel env vars and are read by /api only.
import type { TopicId, Viewer } from './data/types';

export const OWNER: Viewer = { name: 'Thư', role: 'Product Designer', team: 'Lumin', email: 'thunta@luminpdf.com' };

/** Dev-only: VITE_SAMPLE_DATA=1 shows the prototype's sample Linear + Figma data (HANDOFF §6). */
export const SAMPLE_MODE = import.meta.env.VITE_SAMPLE_DATA === '1';

export const FIGMA_RECENTS = 'https://www.figma.com/files/recents-and-sharing';
/** Used for quick links until Linear answers (the live response supplies the real ones). */
export const LINEAR_WORKSPACE = 'https://linear.app/luminpdf';

/** Project → Storybook topics, used for reading matches (+1 score). Linear has no equivalent (HANDOFF §7.1, assumption 7).
    Keyed by Linear project name; edit to taste. */
export const PROJECT_TOPICS: Record<string, TopicId[]> = {
  'Legal Collaboration - Phase 1': ['ux', 'product-design'],
};
