import { requireAuth } from '../../server/auth';
import { json } from '../../server/http';
import { getLinearWorkspace } from '../../server/linear';

// GET /api/linear/workspace → { status, viewer, issues, projects, cycle, links, fetchedAt } (HANDOFF §7.1)
export async function GET(req: Request) {
  const denied = requireAuth(req);
  if (denied) return denied;
  const refresh = new URL(req.url).searchParams.get('refresh') === '1';
  return json(await getLinearWorkspace({ refresh }));
}
