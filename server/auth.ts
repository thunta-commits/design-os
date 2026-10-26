/* Single-user login: APP_PASSWORD checked once, then an HMAC-signed session cookie (SESSION_SECRET).
   Every data endpoint calls requireAuth(); the static app shell itself holds no private data. */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { env, errorJson } from './http.js';

export const COOKIE = 'dos_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export const authConfigured = () => !!(env('APP_PASSWORD') && env('SESSION_SECRET'));

const sign = (payload: string) => createHmac('sha256', env('SESSION_SECRET')!).update(payload).digest('base64url');
const safeEqual = (a: string, b: string) => { const x = Buffer.from(a); const y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };

export function checkPassword(given: string) {
  const expected = env('APP_PASSWORD');
  if (!expected) return false;
  // Compare HMACs so the comparison is constant-time regardless of length.
  return safeEqual(sign(`pw:${given}`), sign(`pw:${expected}`));
}

export function sessionCookie(secure: boolean) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = `v1.${exp}`;
  return `${COOKIE}=${payload}.${sign(payload)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE}${secure ? '; Secure' : ''}`;
}
export const clearCookie = (secure: boolean) => `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`;

const readCookie = (req: Request, name: string) => {
  const raw = req.headers.get('cookie') || '';
  for (const part of raw.split(';')) { const [k, ...v] = part.trim().split('='); if (k === name) return v.join('='); }
  return null;
};

export function isAuthenticated(req: Request) {
  if (!authConfigured()) return false;
  const value = readCookie(req, COOKIE);
  if (!value) return false;
  const i = value.lastIndexOf('.');
  if (i < 0) return false;
  const payload = value.slice(0, i), sig = value.slice(i + 1);
  if (!safeEqual(sig, sign(payload))) return false;
  const exp = Number(payload.split('.')[1]);
  return Number.isFinite(exp) && exp * 1000 > Date.now();
}

export const isSecure = (req: Request) => new URL(req.url).protocol === 'https:';

/** Returns a 401/503 Response when the request may not proceed, otherwise null. */
export function requireAuth(req: Request): Response | null {
  if (!authConfigured()) return errorJson(503, 'Login isn’t configured. Set APP_PASSWORD and SESSION_SECRET.');
  return isAuthenticated(req) ? null : errorJson(401, 'Sign in to continue.');
}
