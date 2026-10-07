import { describe, expect, it } from 'vite-plus/test';

import * as airplay from '../hls/features/airplay';
import * as airplayFairplay from '../hls/features/airplay-fairplay';
import * as audio from '../hls/features/audio';
import * as backgroundVideo from '../hls/features/background-video';
import * as calculateDuration from '../hls/features/calculate-duration';
import * as chapters from '../hls/features/chapters';
import * as currentTime from '../hls/features/current-time';
import * as drm from '../hls/features/drm';
import * as endStallRecovery from '../hls/features/end-stall-recovery';
import * as error from '../hls/features/error';
import * as hlsLoading from '../hls/features/hls-loading';
import * as initialLoad from '../hls/features/initial-load';
import * as live from '../hls/features/live';
import * as mediaSource from '../hls/features/media-source';
import * as monitorPlayerSize from '../hls/features/monitor-player-size';
import * as multiCdn from '../hls/features/multi-cdn';
import * as shiftTextTimestamps from '../hls/features/shift-text-timestamps';
import * as shiftTimestamps from '../hls/features/shift-timestamps';
import * as startPosition from '../hls/features/start-position';
import * as textTracks from '../hls/features/text-tracks';
import * as video from '../hls/features/video';

// Every feature module exports its parts under the same names, and the feature object is built from exactly those
// parts, so a composer can reach them either way.
const modules = [
  ['airplay', airplay],
  ['airplay-fairplay', airplayFairplay],
  ['audio', audio],
  ['background-video', backgroundVideo],
  ['calculate-duration', calculateDuration],
  ['chapters', chapters],
  ['current-time', currentTime],
  ['drm', drm],
  ['end-stall-recovery', endStallRecovery],
  ['error', error],
  ['hls-loading', hlsLoading],
  ['initial-load', initialLoad],
  ['live', live],
  ['media-source', mediaSource],
  ['monitor-player-size', monitorPlayerSize],
  ['multi-cdn', multiCdn],
  ['shift-text-timestamps', shiftTextTimestamps],
  ['shift-timestamps', shiftTimestamps],
  ['start-position', startPosition],
  ['text-tracks', textTracks],
  ['video', video],
] as const;

describe('feature modules', () => {
  it.each(modules)('%s builds its feature from its exported parts', (_name, module) => {
    const feature = Object.values(module).find(
      (value) => value !== module.behaviors && typeof value === 'object' && 'behaviors' in value
    );

    expect(feature).toBeDefined();
    expect(feature!.behaviors).toBe(module.behaviors);
    expect(feature!.defaultConfig).toBe(module.defaultConfig);
    expect(feature!.initialState).toBe(module.initialState);
  });
});
