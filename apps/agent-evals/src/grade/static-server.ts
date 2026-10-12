// Serves a site with no build step the way any static host would: `node static-server.ts <directory> <port>`.
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const [directory = '.', port = '0'] = process.argv.slice(2);
const root = resolve(directory);
const types: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.mjs': 'text/javascript; charset=utf-8',
  '.mp4': 'video/mp4',
  '.svg': 'image/svg+xml',
  '.vtt': 'text/vtt; charset=utf-8',
  '.woff2': 'font/woff2',
};

createServer(async (request, response) => {
  const { pathname } = new URL(request.url ?? '/', 'http://127.0.0.1');
  const path = normalize(join(root, decodeURIComponent(pathname.endsWith('/') ? `${pathname}index.html` : pathname)));

  if (!path.startsWith(root)) {
    response.statusCode = 400;
    response.end('Invalid path.');
    return;
  }

  try {
    const body = await readFile(path);

    response.setHeader('content-type', types[extname(path)] ?? 'application/octet-stream');
    response.end(body);
  } catch {
    response.statusCode = 404;
    response.end('Not found.');
  }
}).listen(Number(port), '127.0.0.1');
