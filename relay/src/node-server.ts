// Runs the relay on plain Node: `ANTHROPIC_API_KEY=... npm run dev`
import { createServer } from 'node:http';
import { fetchHandler } from './handler.ts';

const port = Number(process.env.PORT ?? 8787);

createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
  if (!headers.has('x-forwarded-for')) headers.set('x-forwarded-for', req.socket.remoteAddress ?? 'unknown');

  const response = await fetchHandler(
    new Request(`http://localhost${req.url}`, { method: req.method, headers, body: req.method === 'GET' ? undefined : body }),
  );
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(await response.text());
}).listen(port, () => console.log(`relay listening on http://localhost:${port}`));
