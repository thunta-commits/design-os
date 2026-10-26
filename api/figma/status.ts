import { requireAuth } from '../../server/auth.js';
import { figmaConfigured } from '../../server/figma.js';
import { json } from '../../server/http.js';

// GET /api/figma/status → { configured } — whether FIGMA_TOKEN is set. Never returns the token.
export function GET(req: Request) {
  const denied = requireAuth(req);
  if (denied) return denied;
  return json({ configured: figmaConfigured() });
}
