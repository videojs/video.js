import type { TransferRecord } from '../record.ts';
import { seededRandom } from '../synthetic/trace.ts';
import type { MediaPlaylist, Rendition } from './hls.ts';
import { TransferRecorder } from './recorder.ts';
import { openSource } from './source.ts';

export interface SessionOptions {
  src: string;
  durationMs: number;
  recording: string;
  /** Fetch the matching audio segment alongside each video segment, to exercise concurrency. */
  audio: boolean;
  /**
   * Seeds the schedule. The same seed and playlists give the same request sequence whatever the network does, so a
   * repeat pass re-requests exactly what an earlier pass did.
   */
  seed?: number | undefined;
  /** Stop after this many video segments, even before `durationMs`; lets a repeat pass match an earlier one. */
  maxSegments?: number | undefined;
  onProgress?: (record: TransferRecord) => void;
  signal?: AbortSignal;
}

/** Random draws taken every iteration, used or not, so timing never shifts the sequence. */
const DRAWS_PER_SEGMENT = 9;

/**
 * A player-shaped fetch schedule with no player: fill a randomly re-drawn buffer target, idle while a simulated
 * playhead drains it, wander renditions a rung at a time, and occasionally seek back (exercising the local cache) or
 * forward (exercising cold segments). Randomizing all of it keeps idle gaps and request sizes from encoding the network
 * state.
 */
export async function runSession(options: SessionOptions): Promise<TransferRecord[]> {
  const recorder = new TransferRecorder(options.recording);
  const report = () => {
    const last = recorder.records.at(-1);

    if (last) options.onProgress?.(last);
  };

  const source = await openSource(options.src, recorder);
  const media = new Map<string, MediaPlaylist>();
  const loadMedia = async (key: string, trackType: 'video' | 'audio') => {
    const cached = media.get(key);
    if (cached) return cached;

    const playlist = await source.load(key, trackType);

    media.set(key, playlist);

    if (playlist.init) {
      await recorder.fetch(playlist.init.url, {
        kind: 'init',
        role: 'segment',
        trackType,
        renditionId: key,
        byteRange: playlist.init.byteRange,
      });
    }

    return playlist;
  };

  const random = options.seed === undefined ? Math.random : seededRandom(options.seed);
  const deadline = performance.now() + options.durationMs;
  const maxSegments = options.maxSegments ?? Infinity;
  let rung = Math.floor(random() * source.renditions.length);
  let target = 10 + random() * 30;
  let buffer = 0;
  let index = 0;

  for (let fetched = 0; fetched < maxSegments && performance.now() < deadline && !options.signal?.aborted; fetched++) {
    const r = Array.from({ length: DRAWS_PER_SEGMENT }, random);

    if (r[0]! < 0.25) rung = clamp(rung + (r[1]! < 0.5 ? -1 : 1), 0, source.renditions.length - 1);

    if (r[2]! < 0.1) target = 10 + r[3]! * 30;

    const rendition: Rendition = source.renditions[rung]!;
    const video = await loadMedia(rendition.id, 'video');

    if (r[4]! < 0.03) index = Math.max(0, index - 1 - Math.floor(r[5]! * 5));
    else if (r[4]! > 0.98) index += 5 + Math.floor(r[5]! * 20);

    index %= video.segments.length;

    const fetches = [
      recorder.fetch(video.segments[index]!.url, {
        byteRange: video.segments[index]!.byteRange,
        kind: 'segment',
        role: 'segment',
        trackType: 'video',
        renditionId: rendition.id,
        segmentIndex: index,
      }),
    ];
    const audioKey = options.audio ? source.audioFor(rendition) : undefined;

    if (audioKey) {
      const audio = await loadMedia(audioKey, 'audio');
      const audioSegment = audio.segments[index % audio.segments.length]!;

      fetches.push(
        recorder.fetch(audioSegment.url, {
          byteRange: audioSegment.byteRange,
          kind: 'segment',
          role: 'segment',
          trackType: 'audio',
          renditionId: audioKey,
          segmentIndex: index,
        })
      );
    }

    const started = performance.now();

    await Promise.all(fetches);
    report();

    buffer = Math.max(0, buffer - (performance.now() - started) / 1000) + video.segmentSeconds;
    index++;

    if (buffer >= target) {
      const resumeAt = Math.max(0, target - video.segmentSeconds - r[6]! * 4);
      const pauseMs = r[7]! < 0.05 ? r[8]! * 60_000 : 0;

      const idleMs = (buffer - resumeAt) * 1000 + pauseMs;

      console.log(
        `[abr-lab] idle ${(idleMs / 1000).toFixed(1)} s (buffer ${buffer.toFixed(1)} s, target ${target.toFixed(1)} s)`
      );
      await sleep(idleMs, options.signal);
      buffer = resumeAt;
    }
  }

  return recorder.finish();
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);

    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
