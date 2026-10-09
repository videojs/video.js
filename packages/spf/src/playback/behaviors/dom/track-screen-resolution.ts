/**
 * Mirror the screen's pixel dimensions into reactive state, so a rendition cap can narrow candidates to what the screen
 * can actually show without reading the environment at pick time — which would make the picker impure, and would never
 * re-pick when the screen changed.
 *
 * Populated at setup rather than on the first change: `watchScreenResolution` reports its starting value, so nothing
 * downstream waits on a screen that may never move. `undefined` where there is no screen to read, which is the value a
 * cap reads as "no cap" — see `getScreenResolution` on why that beats a zero.
 *
 * Reads no other slot, and has no source-identity reset: the screen is independent of the presentation, so a new `src`
 * doesn't invalidate the reading.
 */
import { defineBehavior } from '../../../core/composition/define-behavior';
import type { Signal } from '../../../core/signals/primitives';
import { type ScreenResolution, watchScreenResolution } from '../../../media/dom/screen';

export interface ScreenResolutionState {
  screenResolution?: ScreenResolution;
}

export interface TrackScreenResolutionConfig {
  /**
   * Whether the reading is scaled into device pixels. Defaults to `true` — see
   * `ScreenResolutionOptions.useDevicePixelRatio`, including its note on page zoom being folded into the ratio outside
   * WebKit.
   */
  useDevicePixelRatio?: boolean;
}

function trackScreenResolutionSetup({
  state,
  config,
}: {
  state: { screenResolution: Signal<ScreenResolutionState['screenResolution']> };
  config?: TrackScreenResolutionConfig;
}): () => void {
  const useDevicePixelRatio = config?.useDevicePixelRatio ?? true;

  // No `effect` wrapper, unlike its `track*` siblings: they re-subscribe when
  // `context.mediaElement` changes, and this behavior has no reactive dependency
  // to re-run on. The watcher's own teardown is the whole cleanup.
  return watchScreenResolution((resolution) => state.screenResolution.set(resolution), { useDevicePixelRatio });
}

export const trackScreenResolution = defineBehavior({
  stateKeys: ['screenResolution'],
  contextKeys: [],
  setup: trackScreenResolutionSetup,
});
