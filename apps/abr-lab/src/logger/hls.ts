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

export interface MediaPlaylist {
  initUrl?: string | undefined;
  segmentUrls: string[];
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
  const lines = text.split('\n').map((line) => line.trim());
  const segmentUrls: string[] = [];
  let initUrl: string | undefined;
  let segmentSeconds = 0;

  lines.forEach((line, i) => {
    if (line.startsWith('#EXT-X-MAP:')) {
      const uri = parseAttributes(line).URI;

      if (uri) initUrl = new URL(uri, baseUrl).href;
    }

    if (line.startsWith('#EXTINF:')) {
      segmentSeconds ||= Number.parseFloat(line.slice('#EXTINF:'.length));
      const uri = lines.slice(i + 1).find((next) => next !== '' && !next.startsWith('#'));

      if (uri) segmentUrls.push(new URL(uri, baseUrl).href);
    }
  });

  return { initUrl, segmentUrls, segmentSeconds: segmentSeconds || 4 };
}

function parseAttributes(line: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const pattern = /([A-Z0-9-]+)=("[^"]*"|[^,]*)/g;

  for (const match of line.slice(line.indexOf(':') + 1).matchAll(pattern)) {
    attrs[match[1]!] = match[2]!.replace(/^"|"$/g, '');
  }

  return attrs;
}
