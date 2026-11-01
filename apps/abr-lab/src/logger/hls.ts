/** Just enough HLS parsing for the logger: renditions, the default audio, and each media playlist's segment URLs. */

export interface Rendition {
  id: string;
  bandwidth: number;
  resolution?: string | undefined;
  url: string;
  audioGroup?: string | undefined;
}

export interface MultivariantPlaylist {
  renditions: Rendition[];
  /** Default audio playlist per group id. */
  audio: Map<string, string>;
}

/** A URL, plus an inclusive byte range when the playlist addresses part of a file (`EXT-X-BYTERANGE`). */
export interface MediaResource {
  url: string;
  byteRange?: [number, number] | undefined;
}

export interface MediaPlaylist {
  init?: MediaResource | undefined;
  segments: MediaResource[];
  segmentSeconds: number;
}

export function parseMultivariant(text: string, baseUrl: string): MultivariantPlaylist {
  const lines = text.split('\n').map((line) => line.trim());
  const renditions: Rendition[] = [];
  const audio = new Map<string, string>();

  lines.forEach((line, i) => {
    if (line.startsWith('#EXT-X-MEDIA:')) {
      const attrs = parseAttributes(line);

      if (
        attrs.TYPE === 'AUDIO' &&
        attrs.DEFAULT === 'YES' &&
        attrs.URI &&
        attrs['GROUP-ID'] &&
        !audio.has(attrs['GROUP-ID'])
      ) {
        audio.set(attrs['GROUP-ID'], new URL(attrs.URI, baseUrl).href);
      }
    }

    if (line.startsWith('#EXT-X-STREAM-INF:')) {
      const attrs = parseAttributes(line);
      const uri = lines.slice(i + 1).find((next) => next !== '' && !next.startsWith('#'));
      if (!uri) return;

      renditions.push({
        id: `r${renditions.length}`,
        bandwidth: Number(attrs.BANDWIDTH),
        resolution: attrs.RESOLUTION,
        url: new URL(uri, baseUrl).href,
        audioGroup: attrs.AUDIO,
      });
    }
  });

  renditions.sort((a, b) => a.bandwidth - b.bandwidth);

  return { renditions, audio };
}

export function parseMedia(text: string, baseUrl: string): MediaPlaylist {
  const segments: MediaResource[] = [];
  let init: MediaResource | undefined;
  let segmentSeconds = 0;
  let awaitingUri = false;
  let pendingRange: [number, number] | undefined;
  let nextOffset = 0;

  for (const line of text.split('\n').map((l) => l.trim())) {
    if (line.startsWith('#EXT-X-MAP:')) {
      const attrs = parseAttributes(line);

      if (attrs.URI) init = { url: new URL(attrs.URI, baseUrl).href, byteRange: parseRange(attrs.BYTERANGE, 0) };
    } else if (line.startsWith('#EXT-X-BYTERANGE:')) {
      pendingRange = parseRange(line.slice('#EXT-X-BYTERANGE:'.length), nextOffset);
      nextOffset = pendingRange![1] + 1;
    } else if (line.startsWith('#EXTINF:')) {
      segmentSeconds ||= Number.parseFloat(line.slice('#EXTINF:'.length));
      awaitingUri = true;
    } else if (awaitingUri && line !== '' && !line.startsWith('#')) {
      segments.push({ url: new URL(line, baseUrl).href, byteRange: pendingRange });
      awaitingUri = false;
      pendingRange = undefined;
    }
  }

  return { init, segments, segmentSeconds: segmentSeconds || 4 };
}

/** `length[@offset]` to an inclusive range; a missing offset continues from the previous range. */
function parseRange(value: string | undefined, defaultOffset: number): [number, number] | undefined {
  if (!value) return undefined;

  const [length, offset] = value.split('@').map(Number);
  const start = offset ?? defaultOffset;

  return [start, start + length! - 1];
}

function parseAttributes(line: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const pattern = /([A-Z0-9-]+)=("[^"]*"|[^,]*)/g;

  for (const match of line.slice(line.indexOf(':') + 1).matchAll(pattern)) {
    attrs[match[1]!] = match[2]!.replace(/^"|"$/g, '');
  }

  return attrs;
}
