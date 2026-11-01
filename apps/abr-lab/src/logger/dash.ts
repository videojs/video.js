/**
 * Just enough DASH for the logger: a static MPD's first Period, with video and audio Representations whose segments
 * come from `SegmentTemplate` (`$Number$` or `$Time$`, with or without `SegmentTimeline`), `SegmentList`, or
 * `SegmentBase` with an `indexRange` (resolved by reading the `sidx` box). Live MPDs and later Periods are out of
 * scope.
 */
import type { MediaPlaylist, MediaResource } from './hls.ts';

export interface DashRepresentation {
  id: string;
  kind: 'video' | 'audio';
  bandwidth: number;
  width?: number | undefined;
  height?: number | undefined;
  /** Segments known from the MPD alone, or how to find them (`SegmentBase` needs its `sidx`). */
  segments: MediaPlaylist | { init: MediaResource; indexUrl: string; indexRange: [number, number] };
}

export interface DashManifest {
  video: DashRepresentation[];
  audio: DashRepresentation[];
}

/** Parses with the browser's DOMParser; tests can pass any XML parser with the same shape. */
export function parseMpd(text: string, mpdUrl: string, parseXml = defaultParseXml): DashManifest {
  const mpd = parseXml(text).documentElement;
  if (mpd.getAttribute('type') === 'dynamic') throw new Error('Live (dynamic) MPDs are not supported');

  const period = child(mpd, 'Period');
  if (!period) throw new Error('MPD has no Period');

  const presentationSeconds = parseIsoDuration(
    period.getAttribute('duration') ?? mpd.getAttribute('mediaPresentationDuration') ?? ''
  );
  const periodBase = resolveBase(resolveBase(mpdUrl, mpd), period);
  const manifest: DashManifest = { video: [], audio: [] };

  for (const set of children(period, 'AdaptationSet')) {
    const kind = adaptationKind(set);
    if (!kind) continue;

    const setBase = resolveBase(periodBase, set);

    for (const representation of children(set, 'Representation')) {
      const id = representation.getAttribute('id') ?? String(manifest[kind].length);
      const bandwidth = Number(representation.getAttribute('bandwidth') ?? 0);
      const base = resolveBase(setBase, representation);
      const segments = resolveSegments({ set, representation, base, id, bandwidth, presentationSeconds });
      if (!segments) continue;

      manifest[kind].push({
        id,
        kind,
        bandwidth,
        width: numberAttr(representation, 'width') ?? numberAttr(set, 'width'),
        height: numberAttr(representation, 'height') ?? numberAttr(set, 'height'),
        segments,
      });
    }
  }

  manifest.video.sort((a, b) => a.bandwidth - b.bandwidth);
  manifest.audio.sort((a, b) => a.bandwidth - b.bandwidth);

  return manifest;
}

function resolveSegments(context: {
  set: Element;
  representation: Element;
  base: string;
  id: string;
  bandwidth: number;
  presentationSeconds: number;
}): DashRepresentation['segments'] | undefined {
  const { set, representation, base, id, bandwidth, presentationSeconds } = context;
  const template = child(representation, 'SegmentTemplate') ?? child(set, 'SegmentTemplate');

  if (template) {
    const timescale = Number(template.getAttribute('timescale') ?? 1);
    const startNumber = Number(template.getAttribute('startNumber') ?? 1);
    const media = template.getAttribute('media') ?? '';
    const vars = { RepresentationID: id, Bandwidth: String(bandwidth) };
    const init = template.getAttribute('initialization');
    const timeline = child(template, 'SegmentTimeline');
    const times = timeline
      ? expandTimeline(
          children(timeline, 'S').map((s) => ({
            t: numberAttr(s, 't'),
            d: Number(s.getAttribute('d')),
            r: numberAttr(s, 'r'),
          }))
        )
      : fixedTimes(Number(template.getAttribute('duration') ?? 0), timescale, presentationSeconds);
    const segmentSeconds = times.length > 0 ? times[0]!.duration / timescale : 0;

    return {
      init: init ? { url: new URL(expandTemplate(init, vars), base).href } : undefined,
      segments: times.map(({ time }, i) => ({
        url: new URL(expandTemplate(media, { ...vars, Number: startNumber + i, Time: time }), base).href,
      })),
      segmentSeconds: segmentSeconds || 4,
    };
  }

  const list = child(representation, 'SegmentList') ?? child(set, 'SegmentList');

  if (list) {
    const timescale = Number(list.getAttribute('timescale') ?? 1);
    const initialization = child(list, 'Initialization');

    return {
      init: initialization
        ? resource(base, initialization.getAttribute('sourceURL'), initialization.getAttribute('range'))
        : undefined,
      segments: children(list, 'SegmentURL').map((s) =>
        resource(base, s.getAttribute('media'), s.getAttribute('mediaRange'))
      ),
      segmentSeconds: Number(list.getAttribute('duration') ?? 0) / timescale || 4,
    };
  }

  const segmentBase = child(representation, 'SegmentBase') ?? child(set, 'SegmentBase');
  const indexRange = parseByteRange(segmentBase?.getAttribute('indexRange'));
  const initRange = parseByteRange(child(segmentBase, 'Initialization')?.getAttribute('range'));

  if (segmentBase && indexRange) {
    return { init: { url: base, byteRange: initRange }, indexUrl: base, indexRange };
  }

  return undefined;
}

/** Replaces `$Name$` and `$Name%0Nd$` identifiers; `$$` is a literal dollar. */
export function expandTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\$(\w*)(%0(\d+)d)?\$/g, (match, name: string, _format, width?: string) => {
    if (name === '') return '$';

    const value = vars[name];
    if (value === undefined) return match;

    return width ? String(value).padStart(Number(width), '0') : String(value);
  });
}

/** `SegmentTimeline` `S` entries to start times and durations; `r` repeats, `t` resets the clock. */
export function expandTimeline(entries: Array<{ t?: number | undefined; d: number; r?: number | undefined }>) {
  const out: Array<{ time: number; duration: number }> = [];
  let time = 0;

  for (const { t, d, r = 0 } of entries) {
    if (t !== undefined) time = t;

    // A negative repeat means "until the next S or the end"; static MPDs rarely need it, so one is assumed.
    for (let i = 0; i <= Math.max(0, r); i++) {
      out.push({ time, duration: d });
      time += d;
    }
  }

  return out;
}

function fixedTimes(duration: number, timescale: number, presentationSeconds: number) {
  if (!duration || !presentationSeconds) return [];

  const count = Math.ceil((presentationSeconds * timescale) / duration);

  return Array.from({ length: count }, (_, i) => ({ time: i * duration, duration }));
}

/** ISO 8601 durations as MPDs use them (`PT1H2M3.5S`, `P1DT2H`), in seconds. */
export function parseIsoDuration(value: string): number {
  const match = /^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(
    value
  );
  if (!match) return 0;

  const [, days = '0', hours = '0', minutes = '0', seconds = '0'] = match;

  return Number(days) * 86_400 + Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

/**
 * Segment byte ranges from an ISO-BMFF `sidx` box: each reference's size, laid out back to back after the box plus its
 * `first_offset`. `indexStart` is the file offset where the box begins.
 */
export function parseSidx(bytes: Uint8Array, indexStart: number): Array<{ range: [number, number]; seconds: number }> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const boxSize = view.getUint32(0);
  const type = String.fromCharCode(...bytes.subarray(4, 8));
  if (type !== 'sidx') throw new Error(`Expected sidx, found ${type}`);

  const version = view.getUint8(8);
  const timescale = view.getUint32(16);
  let offset = 20;
  let firstOffset: number;

  if (version === 0) {
    firstOffset = view.getUint32(offset + 4);
    offset += 8;
  } else {
    firstOffset = Number(view.getBigUint64(offset + 8));
    offset += 16;
  }

  const count = view.getUint16(offset + 2);
  let position = indexStart + boxSize + firstOffset;
  const out: Array<{ range: [number, number]; seconds: number }> = [];

  offset += 4;

  for (let i = 0; i < count; i++) {
    const size = view.getUint32(offset) & 0x7fffffff;
    const duration = view.getUint32(offset + 4);

    out.push({ range: [position, position + size - 1], seconds: duration / timescale });
    position += size;
    offset += 12;
  }

  return out;
}

function adaptationKind(set: Element): 'video' | 'audio' | undefined {
  const type =
    set.getAttribute('contentType') ??
    set.getAttribute('mimeType') ??
    child(set, 'Representation')?.getAttribute('mimeType') ??
    '';
  if (type.startsWith('video')) return 'video';

  if (type.startsWith('audio')) return 'audio';

  return undefined;
}

function resolveBase(base: string, element: Element): string {
  const own = child(element, 'BaseURL')?.textContent?.trim();

  return own ? new URL(own, base).href : base;
}

function resource(base: string, url: string | null, range: string | null): MediaResource {
  return { url: url ? new URL(url, base).href : base, byteRange: parseByteRange(range) };
}

function parseByteRange(value: string | null | undefined): [number, number] | undefined {
  const match = value ? /^(\d+)-(\d+)$/.exec(value) : null;

  return match ? [Number(match[1]), Number(match[2])] : undefined;
}

function numberAttr(element: Element, name: string): number | undefined {
  const value = element.getAttribute(name);

  return value === null ? undefined : Number(value);
}

function child(element: Element | null | undefined, name: string): Element | undefined {
  return element ? children(element, name)[0] : undefined;
}

function children(element: Element, name: string): Element[] {
  return Array.from(element.children).filter((c) => c.localName === name);
}

function defaultParseXml(text: string): Document {
  return new DOMParser().parseFromString(text, 'application/xml');
}
