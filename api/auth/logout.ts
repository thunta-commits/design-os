import { clearCookie, isSecure } from '../../server/auth';
import { json } from '../../server/http';

export function POST(req: Request) {
  return json({ authenticated: false }, { headers: { 'set-cookie': clearCookie(isSecure(req)) } });
}
