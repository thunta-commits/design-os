import { requireAuth } from '../../server/auth.js';
import { FigmaError, getFileStructure } from '../../server/figma.js';
import { errorJson, json } from '../../server/http.js';

// GET /api/figma/file?key=<file key> → { key, name, lastModified, thumbnailUrl, version, pages: [{ id, name }], fetchedAt }
export async function GET(req: Request) {
  const denied = requireAuth(req);
  if (denied) return denied;
  const key = new URL(req.url).searchParams.get('key') || '';
  try { return json(await getFileStructure(key)); }
  catch (err) { return err instanceof FigmaError ? errorJson(err.status, err.message) : errorJson(500, 'Couldn’t read this Figma file.'); }
}
