// Development-only static server for the app/ folder, standard library only.
// Usage: `node serve.ts` serves http://localhost:8080, or pass
// `--port N` (and `--host H`) for another address. It answers only files
// inside app/: a path that escapes it gets a 403, a missing file a 404,
// bad percent-encoding a 400. It answers HEAD the way it answers GET,
// minus the body, and logs every request to stderr with its status.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('./app', import.meta.url)));

// Extension to content type; anything else falls back to octet-stream.
const MIME_TYPES = {
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

function mimeFor(path) {
  return MIME_TYPES[extname(path).toLowerCase()] || 'application/octet-stream';
}

// Read a --flag value from the argv, or fall back to a default.
function flagValue(argv, flag, fallback) {
  const at = argv.indexOf(flag);
  return at === -1 || at + 1 >= argv.length ? fallback : argv[at + 1];
}

function parsePort(raw) {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 && n < 65536 ? n : 8080;
}

const args = process.argv.slice(2);
const port = parsePort(flagValue(args, '--port', '8080'));
const host = flagValue(args, '--host', '127.0.0.1');

// Map a request path to a file under appRoot, or null when it escapes.
function resolveWithin(pathname) {
  if (pathname.endsWith('/')) pathname += 'index.html';
  const target = resolve(join(appRoot, normalize(pathname)));
  if (target !== appRoot && !target.startsWith(appRoot + sep)) return null;
  return target;
}

// A file's size, or null when it is missing or not a regular file.
function fileSize(target) {
  try {
    const info = statSync(target);
    return info.isFile() ? info.size : null;
  } catch {
    return null;
  }
}

function logRequest(method, path, status) {
  console.error(`${new Date().toISOString()} ${method} ${path} -> ${status}`);
}

const server = createServer((req, res) => {
  const parsed = new URL(req.url ?? '/', 'http://localhost');
  let pathname;
  try {
    pathname = decodeURIComponent(parsed.pathname);
  } catch {
    logRequest(req.method, parsed.pathname, 400);
    res.writeHead(400).end('bad request');
    return;
  }
  const target = resolveWithin(pathname);
  if (target === null) {
    logRequest(req.method, pathname, 403);
    res.writeHead(403).end('forbidden');
    return;
  }
  const size = fileSize(target);
  if (size === null) {
    logRequest(req.method, pathname, 404);
    res.writeHead(404).end('not found');
    return;
  }
  logRequest(req.method, pathname, 200);
  res.writeHead(200, {
    'content-type': mimeFor(target),
    'content-length': size,
    'cache-control': 'no-store',
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  createReadStream(target).pipe(res);
});

server.listen(port, host, () => {
  console.log(`app/ is on http://${host}:${port}`);
});
