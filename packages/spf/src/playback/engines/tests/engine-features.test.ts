import { describe, expect, it } from 'vite-plus/test';

import { flattenFeatures } from '../../../core/composition/define-feature';
import * as hlsAudio from '../hls-audio';
import * as hlsAudioMpegTs from '../hls-audio-mpeg-ts';
import * as hlsBackgroundVideo from '../hls-background-video';
import * as hlsBackgroundVideoMpegTs from '../hls-background-video-mpeg-ts';
import * as hlsVideo from '../hls-video';
import * as hlsVideoMpegTs from '../hls-video-mpeg-ts';

// Pins what each engine's feature list composes, so a change to a feature that adds or drops a signal from an engine is
// a visible test change.
/** The engine-module shape the MPEG-TS comparison reads. */
interface EngineModule {
  features: readonly unknown[];
  behaviors: readonly unknown[];
  createEngine(): { state: object; context: object; destroy(): unknown };
}

describe('features', () => {
  it('composes the video engine’s state and context keys', () => {
    const engine = hlsVideo.createEngine();

    expect(Object.keys(engine.state).sort()).toEqual([
      'bandwidthState',
      'cdnPriority',
      'currentTime',
      'disableRemotePlayback',
      'errors',
      'failedCdns',
      'loadActivated',
      'loadingSuspended',
      'mediaContainerData',
      'negotiatedKeySystem',
      'playerResolution',
      'preload',
      'presentation',
      'segmentLoadingBlocked',
      'selectedAudioTrackId',
      'selectedTextTrackId',
      'selectedVideoTrackId',
      'startPosition',
      'userAudioTrackSelection',
      'userTextTrackSelection',
      'userVideoTrackSelection',
    ]);
    expect(Object.keys(engine.context).sort()).toEqual([
      'audioBufferActor',
      'audioSegmentLoaderActor',
      'mediaElement',
      'mediaKeys',
      'mediaSource',
      'textTrackSegmentLoaderActor',
      'textTracksActor',
      'videoBufferActor',
      'videoSegmentLoaderActor',
    ]);
    engine.destroy();
  });

  it('composes the audio-only engine’s state and context keys', () => {
    const engine = hlsAudio.createEngine();

    expect(Object.keys(engine.state).sort()).toEqual([
      'cdnPriority',
      'currentTime',
      'disableRemotePlayback',
      'errors',
      'failedCdns',
      'loadActivated',
      'loadingSuspended',
      'mediaContainerData',
      'preload',
      'presentation',
      'selectedAudioTrackId',
      'startPosition',
      'userAudioTrackSelection',
    ]);
    expect(Object.keys(engine.context).sort()).toEqual([
      'audioBufferActor',
      'audioSegmentLoaderActor',
      'mediaElement',
      'mediaSource',
    ]);
    engine.destroy();
  });

  it('composes the background-video engine’s state and context keys', () => {
    const engine = hlsBackgroundVideo.createEngine();

    expect(Object.keys(engine.state).sort()).toEqual([
      'bandwidthState',
      'currentTime',
      'errors',
      'loadActivated',
      'mediaContainerData',
      'preload',
      'presentation',
      'screenResolution',
      'selectedVideoTrackId',
    ]);
    expect(Object.keys(engine.context).sort()).toEqual([
      'mediaElement',
      'mediaSource',
      'videoBufferActor',
      'videoSegmentLoaderActor',
    ]);
    engine.destroy();
  });

  it.each([
    ['video', hlsVideo, hlsVideoMpegTs],
    ['audio-only', hlsAudio, hlsAudioMpegTs],
    ['background-video', hlsBackgroundVideo, hlsBackgroundVideoMpegTs],
  ] as const)('composes the MPEG-TS %s engine as its base engine plus the transmux feature', (_name, ...pair) => {
    // Widened: each module's `createEngine` is generic over its own config, and a union of them isn't callable.
    const [base, mpegTs] = pair as unknown as [EngineModule, EngineModule];

    expect(mpegTs.features.slice(0, base.features.length)).toEqual(base.features);
    expect(mpegTs.features.length).toBe(base.features.length + 1);
    expect(mpegTs.behaviors).toEqual(base.behaviors);

    const engine = mpegTs.createEngine();
    const baseEngine = base.createEngine();

    expect(Object.keys(engine.state).sort()).toEqual(Object.keys(baseEngine.state).sort());
    expect(Object.keys(engine.context).sort()).toEqual(Object.keys(baseEngine.context).sort());
    engine.destroy();
    baseEngine.destroy();
  });

  it('flattens to each engine’s behaviors', () => {
    for (const engine of [hlsVideo, hlsAudio, hlsBackgroundVideo]) {
      expect(flattenFeatures(engine.features).behaviors).toEqual(engine.behaviors);
    }
  });
});
