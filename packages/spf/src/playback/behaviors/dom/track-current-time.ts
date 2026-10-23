/**
 * Mirror `mediaElement.currentTime` into reactive state. Listens for:
 *
 * - `timeupdate` — fires during playback (~4 Hz)
 * - `seeking` — fires when a seek begins; per spec, `currentTime` is already at the new position when this event
 *   dispatches, so buffer management can react immediately rather than waiting for `timeupdate`, which does not fire
 *   while paused.
 * - `emptied` — fires when the resource selection algorithm tears down the current media (e.g. a new `src` is set on the
 *   same element). Re-syncs so downstream state doesn't retain the stale playback position from the previous source
 *   when the engine is reused across src changes.
 *
 * Also syncs immediately when a media element becomes available.
 *
 * When no media element is attached, writes `config.defaultCurrentTime` (default-default `0`, matching the
 * HTMLMediaElement spec) so consumers always see a defined position. Read-only mirror; does not push
 * `state.currentTime` back to the element.
 */
import { listen } from '@videojs/utils/dom';

import { defineBehavior } from '../../../core/composition/define-behavior';
import { effect } from '../../../core/signals/effect';
import type { ReadonlySignal, Signal } from '../../../core/signals/primitives';

export interface CurrentTimeState {
  currentTime?: number;
}

export interface CurrentTimeContext {
  mediaElement?: HTMLMediaElement | undefined;
}

export interface TrackCurrentTimeConfig {
  /**
   * Value written to `state.currentTime` when no media element is attached. Defaults to `0` — the HTMLMediaElement spec
   * default.
   */
  defaultCurrentTime?: number;
}

function trackCurrentTimeSetup({
  state,
  context,
  config,
}: {
  state: { currentTime: Signal<CurrentTimeState['currentTime']> };
  context: { mediaElement: ReadonlySignal<CurrentTimeContext['mediaElement']> };
  config?: TrackCurrentTimeConfig;
}): () => void {
  const defaultCurrentTime = config?.defaultCurrentTime ?? 0;

  return effect(() => {
    const mediaElement = context.mediaElement.get();

    if (!mediaElement) {
      state.currentTime.set(defaultCurrentTime);
      return;
    }

    const sync = () => state.currentTime.set(mediaElement.currentTime);

    sync();

    const removeEmptied = listen(mediaElement, 'emptied', sync);
    const removeTimeupdate = listen(mediaElement, 'timeupdate', sync);
    const removeSeeking = listen(mediaElement, 'seeking', sync);

    return () => {
      removeEmptied();
      removeTimeupdate();
      removeSeeking();
    };
  });
}

export const trackCurrentTime = defineBehavior({
  stateKeys: ['currentTime'],
  contextKeys: ['mediaElement'],
  setup: trackCurrentTimeSetup,
});
