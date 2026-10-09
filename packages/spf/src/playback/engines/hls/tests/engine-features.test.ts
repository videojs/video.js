import { describe, expect, it } from 'vite-plus/test';

import { flattenFeatures } from '../../../../core/composition/define-feature';
import * as hlsVideo from '../engine';
import * as hlsAudio from '../engine-audio-only';
import * as hlsBackgroundVideo from '../engine-background-video';

// Pins what each engine's feature list composes, so a change to a feature that adds or drops a signal from an engine is
// a visible test change.
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

  it('flattens to each engine’s behaviors', () => {
    for (const engine of [hlsVideo, hlsAudio, hlsBackgroundVideo]) {
      expect(flattenFeatures(engine.features).behaviors).toEqual(engine.behaviors);
    }
  });
});
