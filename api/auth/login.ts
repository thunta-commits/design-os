import { authConfigured, checkPassword, isSecure, sessionCookie } from '../../server/auth.js';
import { errorJson, json } from '../../server/http.js';

export async function POST(req: Request) {
  if (!authConfigured()) return errorJson(503, 'Login isn’t configured. Set APP_PASSWORD and SESSION_SECRET.');
  const body = await req.json().catch(() => ({})) as { password?: unknown };
  if (typeof body.password !== 'string' || !checkPassword(body.password)) return errorJson(401, 'That password isn’t right.');
  return json({ authenticated: true }, { headers: { 'set-cookie': sessionCookie(isSecure(req)) } });
}
