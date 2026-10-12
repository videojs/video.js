// A live HLS stream for tasks that need one we control: a sliding window over a short loop of segments, served inside
// the container at http://media.acme.test/live/master.m3u8. Agents and the grader both reach it; nothing leaves.
import { createReadStream, readdirSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { join } from 'node:path';

export const LIVE_HOST = 'media.acme.test';

/** Segments the image generates at build time. */
export const LIVE_MEDIA_DIR = '/opt/media/live';

const SEGMENT_SECONDS = 2;
const WINDOW = 6;

export interface LiveStream {
  url: string;
  close: () => void;
}

/**
 * The media playlist at `now`: the latest `WINDOW` segments, cycling through `count` files, with a discontinuity each
 * time the loop starts over so players reset their timestamps.
 */
export function livePlaylist(count: number, startedAt: number, now: number): string {
  const newest = Math.floor((now - startedAt) / 1000 / SEGMENT_SECONDS) + WINDOW - 1;
  const first = newest - WINDOW + 1;
  const lines = [
    '#EXTM3U',
    '#EXT-X-VERSION:3',
    `#EXT-X-TARGETDURATION:${SEGMENT_SECONDS}`,
    `#EXT-X-MEDIA-SEQUENCE:${first}`,
    `#EXT-X-DISCONTINUITY-SEQUENCE:${Math.floor(first / count)}`,
  ];

  for (let sequence = first; sequence <= newest; sequence += 1) {
    if (sequence > first && sequence % count === 0) lines.push('#EXT-X-DISCONTINUITY');

    lines.push(`#EXTINF:${SEGMENT_SECONDS.toFixed(3)},`, `seg/${sequence}.ts`);
  }

  return `${lines.join('\n')}\n`;
}

const MASTER = [
  '#EXTM3U',
  '#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360,CODECS="avc1.42e01e"',
  'stream.m3u8',
  '',
].join('\n');

/** Serves the stream on `port`, which the container maps `LIVE_HOST` to. */
export function startLiveStream(port = 80, mediaDir = LIVE_MEDIA_DIR): Promise<LiveStream> {
  const segments = readdirSync(mediaDir)
    .filter((name) => name.endsWith('.ts'))
    .sort();
  const startedAt = Date.now();
  const server: Server = createServer((request, response) => {
    const path = new URL(request.url ?? '/', `http://${LIVE_HOST}`).pathname;
    const headers = { 'access-control-allow-origin': '*', 'cache-control': 'no-cache' };
    const segment = /^\/live\/seg\/(\d+)\.ts$/.exec(path);

    if (path === '/live/master.m3u8' || path === '/live/stream.m3u8') {
      response.writeHead(200, { ...headers, 'content-type': 'application/vnd.apple.mpegurl' });
      response.end(path === '/live/master.m3u8' ? MASTER : livePlaylist(segments.length, startedAt, Date.now()));
    } else if (segment) {
      response.writeHead(200, { ...headers, 'content-type': 'video/mp2t' });
      createReadStream(join(mediaDir, segments[Number(segment[1]) % segments.length]!)).pipe(response);
    } else {
      response.writeHead(404, headers).end();
    }
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () =>
      resolve({ url: `http://${LIVE_HOST}/live/master.m3u8`, close: () => server.close() })
    );
  });
}
