// Runs after `expo export -p web`. Expo puts bundled assets under
// dist/assets/node_modules/..., and some static hosts (including Vercel's
// uploader) skip any folder named node_modules. Move them to assets/vendor
// and update references so fonts and the SQLite engine load everywhere.
import { existsSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
const from = join(dist, 'assets/node_modules');
const to = join(dist, 'assets/vendor');

if (existsSync(from)) renameSync(from, to);

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(js|css|html|json)$/.test(name)) {
      const s = readFileSync(p, 'utf8');
      if (s.includes('/assets/node_modules/')) writeFileSync(p, s.replaceAll('/assets/node_modules/', '/assets/vendor/'));
    }
  }
}
walk(dist);
console.log('postexport-web: assets moved to /assets/vendor');
