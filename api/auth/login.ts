import { authConfigured, checkPassword, isSecure, sessionCookie } from '../../server/auth.js';
import { errorJson, json } from '../../server/http.js';

export async function POST(req: Request) {
  if (!authConfigured()) return errorJson(503, 'Login isn’t configured.');
  const body = await req.json().catch(() => ({})) as { password?: unknown };
  if (typeof body.password !== 'string' || !checkPassword(body.password)) return errorJson(401, 'Incorrect password.');
  return json({ authenticated: true }, { headers: { 'set-cookie': sessionCookie(isSecure(req)) } });
}
