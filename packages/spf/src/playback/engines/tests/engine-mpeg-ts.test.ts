import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { isCarriedAudioTrack } from '../../../media/hls/carried-audio';
import type { MaybeResolvedPresentation } from '../../../media/types';
import { findTrackById, getTracksByType } from '../../../media/utils/tracks';
import { createEngine as createTransmuxingAudioEngine } from '../hls-audio-mpeg-ts';
import { createEngine as createTransmuxingVideoEngine } from '../hls-video-mpeg-ts';

// Spike harness against public Mux assets packaged as MPEG-TS. Network-dependent — the
// fixture question is open; see `.agents/plans/spf-mpeg-ts-transmux-spike.md`.
// Muxed H.264 + AAC, non-zero PTS from 10s.
const MUX_TS_URL = 'https://stream.mux.com/a4nOgmxGWg6gULfcBbAa00gXyfcwPnAFldF8RdsNyk8M.m3u8';
// Multi-audio: the default English audio is muxed into the video TS and declared as a URI-less
// `EXT-X-MEDIA`; Spanish / commentary are audio-only TS renditions of their own.
const MUX_MULTI_AUDIO_TS_URL = 'https://stream.mux.com/Sc89iWAyNkhJ3P1rQ02nrEdCFTnfT01CZ2KmaEcxXfB008.m3u8';
// Muxed H.264 + AAC with B-frames, 60s in 5s segments: long enough to seek past the initial buffer.
const MUX_TS_60S_URL = 'https://stream.mux.com/VcmKA6aqzIzlg3MayLJDnbF55kX00mds028Z65QxvBYaA.m3u8';
// Audio-only TS asset (one `mp4a.40.2` variant, no `EXT-X-MEDIA`).
const MUX_AUDIO_ONLY_TS_URL = 'https://stream.mux.com/3zd01ukbq5UaSPrfGnZ2eYBcMXuf3Uc5Rc5XINRcHA00g.m3u8';

const realFetch = globalThis.fetch;

/** The decoded audio byte count where the browser exposes one (Chromium); `undefined` elsewhere. */
function audioDecodedBytes(video: HTMLVideoElement): number | undefined {
  return (video as HTMLVideoElement & { webkitAudioDecodedByteCount?: number }).webkitAudioDecodedByteCount;
}

/** Whether every SourceBuffer holds data at `time`: the browser-neutral evidence that each track was accepted. */
function sourceBuffersCover(mediaSource: MediaSource | undefined, time: number): boolean {
  const sourceBuffers = Array.from(mediaSource?.sourceBuffers ?? []);

  return (
    sourceBuffers.length > 0 &&
    sourceBuffers.every(({ buffered }) =>
      Array.from({ length: buffered.length }, (_, i) => [buffered.start(i), buffered.end(i)]).some(
        ([start, end]) => start! <= time && time < end!
      )
    )
  );
}

/** Draw the current frame and report whether it has any non-uniform content (a rendered picture, not a blank). */
function frameHasPicture(video: HTMLVideoElement): boolean {
  const canvas = document.createElement('canvas');

  canvas.width = 32;
  canvas.height = 18;

  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const first = [data[0], data[1], data[2]];

  for (let i = 4; i < data.length; i += 4) {
    if (Math.abs(data[i]! - first[0]!) + Math.abs(data[i + 1]! - first[1]!) + Math.abs(data[i + 2]! - first[2]!) > 24) {
      return true;
    }
  }

  return false;
}

describe('createEngine (hls-video-mpeg-ts / hls-audio-mpeg-ts, real Mux TS sources, end to end)', () => {
  let media: HTMLMediaElement | undefined;

  afterEach(() => {
    media?.remove();
  });

  it('transmuxes a muxed TS rendition, relocates it to 0, and renders frames', async () => {
    const video = document.createElement('video');

    media = video;
    video.muted = true;
    video.width = 320;
    video.height = 180;
    document.body.append(video);

    const engine = createTransmuxingVideoEngine();
    const { state, context } = engine;

    context.mediaElement.set(video);
    state.preload.set('auto');
    state.presentation.set({ url: MUX_TS_URL } as MaybeResolvedPresentation);

    await vi.waitFor(() => expect(state.selectedVideoTrackId.get()).toBeDefined(), { timeout: 10_000 });
    await vi.waitFor(() => expect(video.buffered.length).toBeGreaterThan(0), { timeout: 20_000, interval: 250 });

    // Relocation: Mux's TS starts at PTS 10s; the buffered range must start at the presentation origin.
    expect(video.buffered.start(0)).toBeLessThan(0.1);
    expect(video.buffered.end(0)).toBeGreaterThan(4);

    void video.play().catch(() => {});
    await vi.waitFor(() => expect(video.getVideoPlaybackQuality().totalVideoFrames).toBeGreaterThan(10), {
      timeout: 15_000,
      interval: 250,
    });
    await vi.waitFor(() => expect(video.currentTime).toBeGreaterThan(0.5), { timeout: 10_000, interval: 250 });

    expect(video.videoWidth).toBeGreaterThan(0);
    expect(frameHasPicture(video)).toBe(true);
    expect(video.getVideoPlaybackQuality().droppedVideoFrames).toBeLessThan(5);
    expect(state.errors.get() ?? []).toEqual([]);

    // The muxed audio decodes alongside (Chromium exposes decoded byte counts).
    const audioBytes = (video as HTMLVideoElement & { webkitAudioDecodedByteCount?: number })
      .webkitAudioDecodedByteCount;

    if (audioBytes !== undefined) expect(audioBytes).toBeGreaterThan(0);

    await engine.destroy();
  }, 60_000);

  it('keeps a stream whose first segment presents on its boundary aligned to the playlist', async () => {
    // Mux's live streams and their recordings put a segment's first *presented* frame on the playlist boundary, with
    // B-frames decoding up to two frames earlier. Serving the 60s asset from its third segment reproduces that shape
    // (the first segment of the on-demand asset decodes on the boundary instead).
    const multivariant = await (await realFetch(MUX_TS_60S_URL)).text();
    const renditionUrl = multivariant.split('\n').find((line) => line.startsWith('https://'))!;
    const rendition = (await (await realFetch(renditionUrl)).text()).split('\n');
    const firstSegment = rendition.findIndex((line) => line.startsWith('#EXTINF'));
    const trimmed = [...rendition.slice(0, firstSegment), ...rendition.slice(firstSegment + 4)].join('\n');
    const playlists = new Map([
      [
        MUX_TS_60S_URL,
        `#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=2000000,CODECS="mp4a.40.2,avc1.640020"\n${renditionUrl}\n`,
      ],
      [renditionUrl, trimmed],
    ]);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
      const playlist = playlists.get(input instanceof Request ? input.url : String(input));

      return playlist === undefined ? realFetch(input, init) : Promise.resolve(new Response(playlist));
    });

    const video = document.createElement('video');

    media = video;
    video.muted = true;
    document.body.append(video);

    const engine = createTransmuxingVideoEngine();
    const { state, context } = engine;

    context.mediaElement.set(video);
    state.preload.set('auto');
    state.presentation.set({ url: MUX_TS_60S_URL } as MaybeResolvedPresentation);

    await vi.waitFor(() => expect(video.buffered.length).toBeGreaterThan(0), { timeout: 20_000, interval: 250 });
    void video.play().catch(() => {});

    // A seek onto a boundary past the buffer: the fresh range must start on the boundary, or Chromium waits in the
    // hole before it. Mux's audio can start up to one AAC frame (~21ms) late, which every browser plays through;
    // unaligned B-frame video starts two video frames (~67ms) late.
    const boundary = 30;
    const audioFrame = 1024 / 48000;

    expect(sourceBuffersCover(context.mediaSource.get(), boundary)).toBe(false);
    video.currentTime = boundary;
    await vi.waitFor(() => expect(video.currentTime).toBeGreaterThan(boundary + 1), { timeout: 15_000, interval: 250 });
    expect(sourceBuffersCover(context.mediaSource.get(), boundary + audioFrame)).toBe(true);
    expect(state.errors.get() ?? []).toEqual([]);

    fetchSpy.mockRestore();
    await engine.destroy();
  }, 60_000);

  it('plays the multi-audio shape: the carried default audio first, then switches to and from an alternate', async () => {
    const video = document.createElement('video');

    media = video;
    video.muted = true;
    video.width = 320;
    video.height = 180;
    document.body.append(video);

    // Every network request, to prove the video and audio loaders share one request per segment.
    const requested: string[] = [];
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
      requested.push(input instanceof Request ? input.url : String(input));
      return realFetch(input, init);
    });

    const engine = createTransmuxingVideoEngine();
    const { state, context } = engine;

    context.mediaElement.set(video);
    state.preload.set('auto');
    state.presentation.set({ url: MUX_MULTI_AUDIO_TS_URL } as MaybeResolvedPresentation);

    await vi.waitFor(() => expect(state.selectedAudioTrackId.get()).toBeDefined(), { timeout: 10_000 });

    // The DEFAULT=YES rendition is the one carried in the video segments; it is the pick, not a dubbed alternate.
    const presentation = state.presentation.get()!;
    const defaultId = state.selectedAudioTrackId.get()!;
    const defaultTrack = findTrackById(presentation, defaultId)!;

    expect(defaultTrack).toMatchObject({ type: 'audio', name: 'English', default: true });
    expect(isCarriedAudioTrack(presentation, defaultTrack)).toBe(true);

    void video.play().catch(() => {});
    await vi.waitFor(() => expect(video.getVideoPlaybackQuality().totalVideoFrames).toBeGreaterThan(10), {
      timeout: 15_000,
      interval: 250,
    });
    await vi.waitFor(() => expect(video.currentTime).toBeGreaterThan(1), { timeout: 10_000, interval: 250 });

    expect(context.mediaSource.get()?.sourceBuffers.length).toBe(2);
    expect(state.mediaContainerData.get()?.audio?.trackId).toBe(2);
    expect(sourceBuffersCover(context.mediaSource.get(), video.currentTime)).toBe(true);
    expect(audioDecodedBytes(video) ?? 1).toBeGreaterThan(0);
    expect(state.errors.get() ?? []).toEqual([]);

    // One request per video segment served both loaders.
    const segmentRequests = requested.filter((url) => new URL(url).pathname.endsWith('.ts'));

    expect(segmentRequests.length).toBeGreaterThan(0);
    expect(new Set(segmentRequests).size).toBe(segmentRequests.length);

    // Switch to an audio-only alternate: playback continues on the new rendition's AAC.
    const alternate = getTracksByType(presentation, 'audio').find((track) => track.language === 'es')!;
    const decodedBefore = audioDecodedBytes(video);
    const timeBefore = video.currentTime;

    state.userAudioTrackSelection.set({ id: alternate.id });
    await vi.waitFor(() => expect(state.selectedAudioTrackId.get()).toBe(alternate.id), { timeout: 5_000 });
    await vi.waitFor(() => expect(video.currentTime).toBeGreaterThan(timeBefore + 2), {
      timeout: 15_000,
      interval: 250,
    });
    expect(sourceBuffersCover(context.mediaSource.get(), video.currentTime)).toBe(true);

    if (decodedBefore !== undefined) expect(audioDecodedBytes(video)).toBeGreaterThan(decodedBefore);

    expect(state.errors.get() ?? []).toEqual([]);

    // And back to the carried default, which now refetches segments the video loader passed long ago.
    const timeBeforeReturn = video.currentTime;

    state.userAudioTrackSelection.set({ id: defaultId });
    await vi.waitFor(() => expect(state.selectedAudioTrackId.get()).toBe(defaultId), { timeout: 5_000 });
    await vi.waitFor(() => expect(video.currentTime).toBeGreaterThan(timeBeforeReturn + 2), {
      timeout: 15_000,
      interval: 250,
    });
    expect(sourceBuffersCover(context.mediaSource.get(), video.currentTime)).toBe(true);
    expect(state.errors.get() ?? []).toEqual([]);
    expect(state.bandwidthState.get()?.bytesSampled).toBeGreaterThan(0);

    fetchSpy.mockRestore();
    await engine.destroy();
  }, 90_000);

  it('plays the muxed audio of a single-audio TS video asset through the audio engine', async () => {
    const audio = document.createElement('audio');

    media = audio;
    audio.muted = true;
    document.body.append(audio);

    const engine = createTransmuxingAudioEngine();
    const { state } = engine;

    engine.context.mediaElement.set(audio);
    state.preload.set('auto');
    state.presentation.set({ url: MUX_TS_URL } as MaybeResolvedPresentation);

    await vi.waitFor(() => expect(audio.buffered.length).toBeGreaterThan(0), { timeout: 20_000, interval: 250 });
    expect(audio.buffered.start(0)).toBeLessThan(0.1);
    await vi.waitFor(() => expect(audio.readyState).toBeGreaterThanOrEqual(HTMLMediaElement.HAVE_FUTURE_DATA), {
      timeout: 10_000,
      interval: 250,
    });
    expect(audio.buffered.end(0)).toBeGreaterThan(4);
    expect(state.mediaContainerData.get()?.audio).toMatchObject({ timescale: 48000 });
    expect(state.errors.get() ?? []).toEqual([]);

    await engine.destroy();
  }, 60_000);

  it('plays an audio-only TS asset through the audio engine with the audio-only feature', async () => {
    const audio = document.createElement('audio');

    media = audio;
    audio.muted = true;
    document.body.append(audio);

    const engine = createTransmuxingAudioEngine();
    const { state, context } = engine;

    context.mediaElement.set(audio);
    state.preload.set('auto');
    state.presentation.set({ url: MUX_AUDIO_ONLY_TS_URL } as MaybeResolvedPresentation);

    await vi.waitFor(() => expect(audio.buffered.length).toBeGreaterThan(0), { timeout: 20_000, interval: 250 });
    expect(audio.buffered.start(0)).toBeLessThan(0.1);

    // Chromium's autoplay policy blocks `play()` on an `<audio>` element without a gesture (muted
    // `<video>` is exempt), so assert readiness of the transmuxed data rather than progress.
    await vi.waitFor(() => expect(audio.readyState).toBeGreaterThanOrEqual(HTMLMediaElement.HAVE_FUTURE_DATA), {
      timeout: 10_000,
      interval: 250,
    });
    expect(audio.buffered.end(0)).toBeGreaterThan(4);
    expect(state.mediaContainerData.get()?.audio).toMatchObject({ trackId: 2, timescale: 44100 });

    expect(state.errors.get() ?? []).toEqual([]);

    await engine.destroy();
  }, 60_000);
});
