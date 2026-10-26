import { authConfigured, isAuthenticated } from '../../server/auth';
import { json } from '../../server/http';

export function GET(req: Request) {
  return json({ authenticated: isAuthenticated(req), configured: authConfigured() });
}
