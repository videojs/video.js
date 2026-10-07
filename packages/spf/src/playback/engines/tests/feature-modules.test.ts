import { describe, expect, it } from 'vite-plus/test';

import * as airplay from '../features/airplay';
import * as airplayFairplay from '../features/airplay-fairplay';
import * as audio from '../features/audio';
import * as backgroundVideo from '../features/background-video';
import * as calculateDuration from '../features/calculate-duration';
import * as chapters from '../features/chapters';
import * as currentTime from '../features/current-time';
import * as drm from '../features/drm';
import * as endStallRecovery from '../features/end-stall-recovery';
import * as error from '../features/error';
import * as hlsLoading from '../features/hls-loading';
import * as initialLoad from '../features/initial-load';
import * as live from '../features/live';
import * as mediaSource from '../features/media-source';
import * as monitorPlayerSize from '../features/monitor-player-size';
import * as multiCdn from '../features/multi-cdn';
import * as shiftTextTimestamps from '../features/shift-text-timestamps';
import * as shiftTimestamps from '../features/shift-timestamps';
import * as startPosition from '../features/start-position';
import * as textTracks from '../features/text-tracks';
import * as video from '../features/video';

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
