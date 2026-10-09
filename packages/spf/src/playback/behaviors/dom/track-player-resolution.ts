import { type ElementSize, observeElementSize, observeRenderedSize } from '@videojs/utils/dom';
import { shallowEqual } from '@videojs/utils/object';

import { defineBehavior } from '../../../core/composition/define-behavior';
import { effect } from '../../../core/signals/effect';
import type { ReadonlySignal, Signal } from '../../../core/signals/primitives';
import { type Resolution, scaleResolution } from '../../../media/primitives/resolution';

/** A player element's rendered pixel dimensions. */
export type PlayerResolution = Resolution;

export interface PlayerResolutionState {
  /**
   * The player element's rendered pixel dimensions, or `undefined` where there is nothing to measure. Written by
   * `trackPlayerResolution`, read by the `playerResolutionCap` selection rule — which treats `undefined` as "don't
   * cap".
   */
  playerResolution?: PlayerResolution;
}

export interface PlayerResolutionContext {
  mediaElement?: HTMLMediaElement | undefined;
}

export interface TrackPlayerResolutionConfig {
  /**
   * Whether to cap renditions to the player's rendered size at all. `false` measures nothing, which leaves
   * `state.playerResolution` unset and the cap inert. Defaults to `true`.
   *
   * Named for the policy rather than the measurement because it is the public switch for the feature — the same one
   * hls.js spells `capLevelToPlayerSize` and the Mux Video element spells `cap-rendition-to-player-size`.
   */
  capRenditionToPlayerSize?: boolean;
  /**
   * Whether the reading is scaled into device pixels. Defaults to `true` — see
   * `ScreenResolutionOptions.useDevicePixelRatio` in `media/dom/screen.ts`, including its note on page zoom being
   * folded into the ratio outside WebKit.
   */
  useDevicePixelRatio?: boolean;
}

function trackPlayerResolutionSetup({
  state,
  context,
  config = {},
}: {
  state: { playerResolution: Signal<PlayerResolutionState['playerResolution']> };
  context: { mediaElement: ReadonlySignal<PlayerResolutionContext['mediaElement']> };
  config?: TrackPlayerResolutionConfig;
}): () => void {
  const { capRenditionToPlayerSize = true, useDevicePixelRatio = true } = config;

  return effect(() => {
    const mediaElement = context.mediaElement.get();
    // Clear before (re-)observing so the previous element's measurement can't
    // stand while the new one's first observation is in flight.
    let current: PlayerResolution | undefined;

    state.playerResolution.set(current);

    if (!capRenditionToPlayerSize || !mediaElement) return;

    // Compared rather than written straight through, since the slot holds an
    // object and would otherwise notify on identity alone: a resize that rounds
    // to the same device pixels is not a change worth re-running selection for.
    // Same reason `watchScreenResolution` compares its readings.
    const write = (size: ElementSize & { scale?: number }) => {
      const next = scaleResolution(size, size.scale);
      if (shallowEqual(current, next)) return;

      current = next;
      state.playerResolution.set(next);
    };

    return useDevicePixelRatio ? observeRenderedSize(mediaElement, write) : observeElementSize(mediaElement, write);
  });
}

/**
 * Mirror the player element's rendered pixel dimensions into reactive state, so a rendition cap can narrow candidates
 * to what the element can actually show without reading the DOM at pick time — which would make the picker impure, and
 * would never re-pick when the element resized.
 *
 * The player-element half of the caps in `internal/design/spf/features/rendition-selection-caps.md`, and the tighter
 * half: a small embed on a large display is capped by its own box rather than by the screen behind it
 * (`trackScreenResolution`).
 *
 * Reported as a width and a height in device pixels — the same units, and for the same reason, as `media/dom/screen`'s
 * reading: the cap compares against real track dimensions, and a `"720p"`-style tier only describes a track once you
 * assume its aspect ratio.
 *
 * `undefined` where there is nothing to measure — no element attached, or one that isn't being rendered (detached,
 * `display: none`, not yet laid out) — which is the value the cap reads as "don't cap".
 *
 * Track the player element's rendered resolution in `state.playerResolution`.
 *
 * @example
 *   const cleanup = trackPlayerResolution.setup({ state, context });
 */
export const trackPlayerResolution = defineBehavior({
  stateKeys: ['playerResolution'],
  contextKeys: ['mediaElement'],
  setup: trackPlayerResolutionSetup,
});
