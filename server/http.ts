// Small helpers shared by the /api functions (Web Request/Response signature on Vercel's Node runtime).
export const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { ...init, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...(init.headers || {}) } });

export const errorJson = (status: number, error: string) => json({ error }, { status });

export const env = (name: string) => {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
};
