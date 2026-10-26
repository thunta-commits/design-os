import { authConfigured, isAuthenticated } from '../../server/auth.js';
import { json } from '../../server/http.js';

export function GET(req: Request) {
  return json({ authenticated: isAuthenticated(req), configured: authConfigured() });
}
