import { listen } from '@videojs/utils/dom';

import { defineBehavior } from '../../../core/composition/define-behavior';
import { effect } from '../../../core/signals/effect';
import type { ReadonlySignal, Signal } from '../../../core/signals/primitives';

export interface PlaybackRateState {
  playbackRate?: number;
}

export interface PlaybackRateContext {
  mediaElement?: HTMLMediaElement | undefined;
}

export interface TrackPlaybackRateConfig {
  /**
   * Value written to `state.playbackRate` when no media element is attached. Defaults to `1` — the HTMLMediaElement
   * spec default.
   */
  defaultPlaybackRate?: number;
}

function trackPlaybackRateSetup({
  state,
  context,
  config,
}: {
  state: { playbackRate: Signal<PlaybackRateState['playbackRate']> };
  context: { mediaElement: ReadonlySignal<PlaybackRateContext['mediaElement']> };
  config?: TrackPlaybackRateConfig;
}): () => void {
  const defaultPlaybackRate = config?.defaultPlaybackRate ?? 1;

  return effect(() => {
    const mediaElement = context.mediaElement.get();

    if (!mediaElement) {
      state.playbackRate.set(defaultPlaybackRate);
      return;
    }

    const sync = () => state.playbackRate.set(mediaElement.playbackRate);

    sync();

    return listen(mediaElement, 'ratechange', sync);
  });
}

/**
 * Mirror `mediaElement.playbackRate` into reactive state. On each `ratechange` event, write the new value to
 * `state.playbackRate`. Also syncs immediately when a media element becomes available so consumers don't wait for the
 * first event.
 *
 * When no media element is attached, writes `config.defaultPlaybackRate` (default-default `1`, matching the
 * HTMLMediaElement spec) so consumers always see the rate a freshly attached element would have. Read-only mirror; does
 * not push `state.playbackRate` back to the element.
 */
export const trackPlaybackRate = defineBehavior({
  stateKeys: ['playbackRate'],
  contextKeys: ['mediaElement'],
  setup: trackPlaybackRateSetup,
});
