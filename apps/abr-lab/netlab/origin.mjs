// The lab origin: HTTPS (h2, with HTTP/1.1 fallback) over the mounted media folder, plus a synthetic `/bytes` endpoint
// for probes. Shaping is not done here: netem on this container's egress does it, set through the control port, so
// TCP and TLS behave as they would on a real link. Plain Node, no dependencies.
import { execFile } from 'node:child_process';
import { createReadStream, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createSecureServer } from 'node:http2';
import { extname, join, normalize } from 'node:path';
import { promisify } from 'node:util';

const MEDIA = process.env.MEDIA ?? '/media';
const TLS_PORT = 8443;
const CONTROL_PORT = 8081;
const DEVICE = 'eth0';
const MTU_BITS = 1514 * 8;

const TYPES = {
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.mpd': 'application/dash+xml',
  '.ts': 'video/mp2t',
  '.aac': 'audio/aac',
  '.mp4': 'video/mp4',
  '.m4s': 'video/iso.segment',
  '.m4a': 'audio/mp4',
  '.m4v': 'video/mp4',
  '.vtt': 'text/vtt',
  '.webvtt': 'text/vtt',
  '.html': 'text/html',
};

const PROBE_PAGE = '<!doctype html><meta charset="utf-8"><title>abr-lab probe</title><p>abr-lab origin</p>';

const run = promisify(execFile);
let conditions = { rttMs: 0, rateKbps: 0, queueMs: 100, lossPct: 0 };

const server = createSecureServer(
  { key: readFileSync('/tls/key.pem'), cert: readFileSync('/tls/cert.pem'), allowHTTP1: true },
  (req, res) => {
    const url = new URL(req.url, 'https://origin');

    res.setHeader('access-control-allow-origin', '*');
    res.setHeader('access-control-allow-headers', 'range');
    res.setHeader('access-control-expose-headers', 'content-length, content-range, x-request-id');
    // The lab may see its own timing; whether a predictor may use it is a feature decision, not a server one.
    res.setHeader('timing-allow-origin', '*');
    res.setHeader('x-request-id', crypto.randomUUID());

    if (req.method === 'OPTIONS') return void res.writeHead(204).end();

    if (url.searchParams.has('goaway')) {
      // The next request must open a new connection. GOAWAY goes out before the body, so it reaches the client (through
      // the same delay) before the client can queue another request on this session; this stream still completes.
      if (req.stream?.session) req.stream.session.close();
      else res.setHeader('connection', 'close');
    }

    if (url.pathname === '/') return void res.writeHead(200, { 'content-type': 'text/html' }).end(PROBE_PAGE);

    if (url.pathname === '/bytes') return sendBytes(res, Number(url.searchParams.get('n') ?? 0));

    sendFile(req, res, url.pathname);
  }
);

function sendBytes(res, n) {
  if (!Number.isInteger(n) || n < 0 || n > 256e6) return void res.writeHead(400).end();

  res.writeHead(200, { 'content-type': 'application/octet-stream', 'content-length': n, 'cache-control': 'no-store' });

  const chunk = Buffer.alloc(64 * 1024);
  let left = n;
  const pump = () => {
    while (left > 0) {
      const size = Math.min(left, chunk.length);

      left -= size;

      if (!res.write(size === chunk.length ? chunk : chunk.subarray(0, size))) return void res.once('drain', pump);
    }

    res.end();
  };

  // Headers go out on their own first. Written in the same tick, they share a 16 kB TLS record with the body, and the
  // client can't read them until the whole record arrives: TTFB would grow with the link's serialization time.
  res.flushHeaders();
  setImmediate(pump);
}

function sendFile(req, res, pathname) {
  const path = normalize(join(MEDIA, decodeURIComponent(pathname)));
  if (!path.startsWith(MEDIA)) return void res.writeHead(403).end();

  let size;

  try {
    const stat = statSync(path);
    if (!stat.isFile()) throw new Error('not a file');

    size = stat.size;
  } catch {
    return void res.writeHead(404).end();
  }

  const headers = {
    'content-type': TYPES[extname(path).toLowerCase()] ?? 'application/octet-stream',
    'accept-ranges': 'bytes',
    // Cacheable like a CDN segment; the recorder's DevTools ground truth drops local cache hits from scoring.
    'cache-control': 'max-age=3600',
  };
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');

  if (!range) {
    res.writeHead(200, { ...headers, 'content-length': size });
    return void createReadStream(path).pipe(res);
  }

  const start = range[1] === '' ? size - Number(range[2]) : Number(range[1]);
  const end = range[1] === '' || range[2] === '' ? size - 1 : Math.min(Number(range[2]), size - 1);
  if (start > end || start < 0) return void res.writeHead(416, { 'content-range': `bytes */${size}` }).end();

  res.writeHead(206, {
    ...headers,
    'content-length': end - start + 1,
    'content-range': `bytes ${start}-${end}/${size}`,
  });
  createReadStream(path, { start, end }).pipe(res);
}

/**
 * Applies RTT, rate, loss and a queue to this container's egress, which carries every response byte. Requests and ACKs
 * travel unshaped, so the delay here is the whole added round trip. The queue holds `queueMs` of data at the shaped
 * rate on top of what the delay line holds, so a slow link doesn't get seconds of buffer.
 */
async function applyConditions(next) {
  const merged = { ...conditions, ...next };
  const args = ['qdisc', 'replace', 'dev', DEVICE, 'root', 'netem'];

  if (merged.rttMs > 0) args.push('delay', `${merged.rttMs}ms`);

  if (merged.lossPct > 0) args.push('loss', `${merged.lossPct}%`);

  if (merged.rateKbps > 0) {
    const packets = Math.ceil((merged.rateKbps * (merged.rttMs + merged.queueMs)) / MTU_BITS);

    args.push('rate', `${merged.rateKbps}kbit`, 'limit', String(Math.max(16, packets + 16)));
  }

  if (merged.rttMs <= 0 && merged.rateKbps <= 0 && merged.lossPct <= 0) {
    await run('tc', ['qdisc', 'del', 'dev', DEVICE, 'root']).catch(() => {});
  } else {
    await run('tc', args);
  }

  conditions = merged;
  return conditions;
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://control');

  try {
    if (url.pathname === '/conditions' && req.method === 'POST') {
      const next = Object.fromEntries(
        ['rttMs', 'rateKbps', 'queueMs', 'lossPct']
          .filter((k) => url.searchParams.has(k))
          .map((k) => [k, Number(url.searchParams.get(k))])
      );

      res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(await applyConditions(next)));
    } else if (url.pathname === '/conditions') {
      const { stdout } = await run('tc', ['qdisc', 'show', 'dev', DEVICE]);

      res
        .writeHead(200, { 'content-type': 'application/json' })
        .end(JSON.stringify({ ...conditions, tc: stdout.trim() }));
    } else {
      res.writeHead(404).end();
    }
  } catch (error) {
    res.writeHead(500).end(String(error));
  }
}).listen(CONTROL_PORT, '0.0.0.0');

server.listen(TLS_PORT, '0.0.0.0', () => console.log(`origin on :${TLS_PORT}, control on :${CONTROL_PORT}`));
