// Run the relay on any Node host:  ANTHROPIC_API_KEY=... npm run relay
// Serves POST /api/sponsor and GET /api/health, same paths as on Vercel.
import { createServer } from 'node:http';
import { handleHealth, handleSponsorRequest } from './sponsor';

const port = Number(process.env.PORT || 8787);

createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
  if (!headers.has('x-forwarded-for')) headers.set('x-forwarded-for', req.socket.remoteAddress ?? 'unknown');

  const request = new Request(`http://localhost${req.url}`, {
    method: req.method,
    headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : Buffer.concat(chunks),
  });
  const path = new URL(request.url).pathname;
  const response =
    path === '/api/health'
      ? handleHealth()
      : path === '/api/sponsor'
        ? await handleSponsorRequest(request)
        : new Response('not found', { status: 404 });

  res.writeHead(response.status, { ...Object.fromEntries(response.headers), 'Access-Control-Allow-Origin': '*' });
  res.end(await response.text());
}).listen(port, () => console.log(`One More Day relay on http://localhost:${port}`));
