import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { createComposition } from '../../../core/composition/create-composition';
import { flattenFeatures } from '../../../core/composition/define-feature';
import type { MaybeResolvedPresentation } from '../../../media/types';
import { mpegTsTransmuxFeature } from '../../features/mpeg-ts-transmux';
import * as hlsAudio from '../hls-audio';
import * as hlsVideo from '../hls-video';

// Spike harness against public Mux assets packaged as MPEG-TS. Network-dependent — the
// fixture question is open; see `.agents/plans/spf-mpeg-ts-transmux-spike.md`.
// Muxed H.264 + AAC, non-zero PTS from 10s.
const MUX_TS_URL = 'https://stream.mux.com/a4nOgmxGWg6gULfcBbAa00gXyfcwPnAFldF8RdsNyk8M.m3u8';
// Multi-audio: the default English audio is muxed into the video TS and declared as a URI-less
// `EXT-X-MEDIA`; Spanish / commentary are audio-only TS renditions of their own.
const MUX_MULTI_AUDIO_TS_URL = 'https://stream.mux.com/Sc89iWAyNkhJ3P1rQ02nrEdCFTnfT01CZ2KmaEcxXfB008.m3u8';
// Audio-only TS asset (one `mp4a.40.2` variant, no `EXT-X-MEDIA`).
const MUX_AUDIO_ONLY_TS_URL = 'https://stream.mux.com/3zd01ukbq5UaSPrfGnZ2eYBcMXuf3Uc5Rc5XINRcHA00g.m3u8';

/** The video engine's features plus the transmux feature, composed the way the compose guide describes. */
function createTransmuxingVideoEngine() {
  const { behaviors, defaultConfig, initialState } = flattenFeatures([...hlsVideo.features, mpegTsTransmuxFeature]);

  return createComposition(behaviors, { defaultConfig, initialState });
}

function createTransmuxingAudioEngine() {
  const { behaviors, defaultConfig, initialState } = flattenFeatures([...hlsAudio.features, mpegTsTransmuxFeature]);

  return createComposition(behaviors, { defaultConfig, initialState });
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

describe('mpegTsTransmuxFeature (real Mux TS sources, end to end)', () => {
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

  it('plays the multi-audio shape: video drops its muxed audio, an audio-only TS alternate plays beside it', async () => {
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
    state.presentation.set({ url: MUX_MULTI_AUDIO_TS_URL } as MaybeResolvedPresentation);

    await vi.waitFor(() => expect(state.selectedAudioTrackId.get()).toBeDefined(), { timeout: 10_000 });
    void video.play().catch(() => {});
    await vi.waitFor(() => expect(video.getVideoPlaybackQuality().totalVideoFrames).toBeGreaterThan(10), {
      timeout: 15_000,
      interval: 250,
    });

    expect(context.mediaSource.get()?.sourceBuffers.length).toBe(2);
    expect(state.mediaContainerData.get()?.audio?.trackId).toBe(2);
    expect(state.errors.get() ?? []).toEqual([]);

    await engine.destroy();
  }, 60_000);

  it('plays an audio-only TS asset through the audio engine', async () => {
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
