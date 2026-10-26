import { clearCookie, isSecure } from '../../server/auth.js';
import { json } from '../../server/http.js';

export function POST(req: Request) {
  return json({ authenticated: false }, { headers: { 'set-cookie': clearCookie(isSecure(req)) } });
}
