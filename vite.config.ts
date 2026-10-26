import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

/* Serves api/**.ts in `npm run dev` with the same Web Request/Response signature Vercel uses,
   so the app runs locally without the Vercel CLI. */
function apiRoutes(): Plugin {
  return {
    name: 'design-os-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next();
        const url = new URL(req.url, `http://${req.headers.host}`);
        const file = resolve(__dirname, `.${url.pathname}.ts`);
        if (!existsSync(file)) { res.statusCode = 404; res.end('{"error":"Not found"}'); return; }
        try {
          const mod = await server.ssrLoadModule(file);
          const handler = mod[req.method || 'GET'];
          if (!handler) { res.statusCode = 405; res.end('{"error":"Method not allowed"}'); return; }
          const chunks: Buffer[] = [];
          for await (const c of req) chunks.push(c as Buffer);
          const body = chunks.length ? Buffer.concat(chunks) : undefined;
          const request = new Request(url, { method: req.method, headers: req.headers as Record<string, string>, body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body });
          const response: Response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          server.ssrFixStacktrace(err as Error);
          console.error(err);
          res.statusCode = 500; res.end(JSON.stringify({ error: (err as Error).message }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Make .env.local values visible to the dev API handlers (process.env), like Vercel does.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));
  // `--mode artifact`: one self-contained HTML file with sample data, for a private preview (no /api).
  if (mode === 'artifact') return { plugins: [react(), tailwindcss(), viteSingleFile()], build: { outDir: 'dist-artifact', assetsInlineLimit: 10_000_000 } };
  return {
    plugins: [react(), tailwindcss(), apiRoutes()],
  };
});
