import type { IntegrationStatus } from '../data/types';

/** "Sample Linear data" / "Figma not connected". Hidden once the integration is connected (HANDOFF §6). */
export const badgeLabel = (s: IntegrationStatus) => (s.mode === 'sample' ? `Sample ${s.name} data` : `${s.name} ${s.label.toLowerCase()}`);
export const showBadge = (s: IntegrationStatus) => s.mode !== 'connected';
