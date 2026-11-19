// Development-only static server for the app/ folder, standard library only.
// Usage: `node serve.ts` serves http://localhost:8080, or pass `--port N`
// for another port. It only ever serves files inside app/: anything else
// gets a 403, missing files get a 404, and bad percent-encoding gets a 400.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('./app', import.meta.url)));

function pickPort(argv) {
  const flagAt = argv.indexOf('--port');
  const wanted = flagAt === -1 ? 8080 : Number(argv[flagAt + 1]);
  if (Number.isInteger(wanted) && wanted > 0 && wanted < 65536) return wanted;
  return 8080;
}

const port = pickPort(process.argv.slice(2));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.bin': 'application/octet-stream',
  '.wasm': 'application/wasm',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer((req, res) => {
  const parsed = new URL(req.url ?? '/', 'http://localhost');
  let pathname;
  try {
    pathname = decodeURIComponent(parsed.pathname);
  } catch {
    res.writeHead(400).end('bad request');
    return;
  }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const target = resolve(join(appRoot, normalize(pathname)));
  if (target !== appRoot && !target.startsWith(appRoot + sep)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  let byteLength;
  try {
    const info = statSync(target);
    if (!info.isFile()) throw new Error('not a file');
    byteLength = info.size;
  } catch {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, {
    'content-type': TYPES[extname(target).toLowerCase()] ?? 'application/octet-stream',
    'content-length': byteLength,
    'cache-control': 'no-store',
  });
  createReadStream(target).pipe(res);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`app/ is on http://localhost:${port}`);
});
