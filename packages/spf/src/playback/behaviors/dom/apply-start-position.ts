/**
 * **Start playback of a source at a requested position.** `state.startPosition` is a one-shot command — "when the
 * current source can seek, start there" — the SPF analogue of hls.js's `startPosition` (and the primitive
 * `EXT-X-START`, resume-where-you-left-off, and MediaSource-recovery restore build on). Consumers (adapters,
 * `setupAirPlay`'s session-end snapshot) write it; this behavior is its sole consumer and clears it after applying, so
 * a stale position can never replay against a later source or rebuild.
 *
 * Single-positive-state reactor (`'preconditions-unmet'` ↔ `'position-pending'`): gated on `mediaElement + resolved
 * presentation + startPosition` defined. The entry applies the command in two steps:
 *
 * 1. **Seed `state.currentTime` immediately.** The segment loaders anchor their load window on `state.currentTime`;
 *    seeding points the _first_ fetches at the requested position instead of 0. Multi-writer with `trackCurrentTime`
 *    (ongoing DOM mirror) — legitimate: different decision domains (element-derived mirror vs one-shot command), and
 *    before HAVE_METADATA no `timeupdate`/`seeking` fires to overwrite the seed. Compose this behavior _after_
 *    `trackCurrentTime` so the seed lands after the mirror's attach-time sync.
 * 2. **Seek the element at metadata.** `element.currentTime = position` once `readyState >= HAVE_METADATA` (immediately if
 *    already there, else on `loadedmetadata`), then clear `startPosition` (consume). The element clamps the seek to its
 *    seekable range per spec, and the resulting `seeking` event flows back through `trackCurrentTime` — from here the
 *    ordinary seek path owns the position.
 *
 * Position only — playing/paused is deliberately out of scope. The media element load algorithm forces `paused = true`,
 * so a source that was playing before a rebuild comes back paused at the restored position; resume intent belongs to
 * whoever commands the start (e.g. `setupAirPlay` restores its session-end playing state itself).
 *
 * Deliberately NOT relying on the pre-metadata "default playback start position" write (setting `currentTime` at
 * HAVE_NOTHING): cross-browser MSE behavior there is inconsistent; the explicit `loadedmetadata` sequencing is
 * deterministic everywhere.
 *
 * State-exit cleanup (source reset, element detach, destroy) drops the pending `loadedmetadata` listener. An
 * _unapplied_ command survives a source reset — "start the source I'm loading at P" holds while the presentation routes
 * through unresolved — but is consumed the moment it applies.
 */

import { listen } from '@videojs/utils/dom';
import { isUndefined } from '@videojs/utils/predicate';

import { defineBehavior } from '../../../core/composition/define-behavior';
import type { Reactor } from '../../../core/reactors/create-machine-reactor';
import { createMachineReactor } from '../../../core/reactors/create-machine-reactor';
import { computed, type ReadonlySignal, type Signal } from '../../../core/signals/primitives';
import { isResolvedPresentation, type MaybeResolvedPresentation } from '../../../media/types';

export interface StartPositionState {
  presentation?: MaybeResolvedPresentation;
  /**
   * One-shot start-position command in presentation-timeline seconds. Written by consumers (adapter, recovery
   * snapshot); consumed (cleared) by `applyStartPosition` once the element seeks.
   */
  startPosition?: number;
  currentTime?: number;
}

export interface StartPositionContext {
  mediaElement?: HTMLMediaElement | undefined;
}

type StartPositionFsmState = 'preconditions-unmet' | 'position-pending';

function deriveState(
  presentation: MaybeResolvedPresentation | undefined,
  mediaElement: HTMLMediaElement | undefined,
  startPosition: number | undefined
): StartPositionFsmState {
  if (!mediaElement || !isResolvedPresentation(presentation)) return 'preconditions-unmet';

  if (isUndefined(startPosition)) return 'preconditions-unmet';

  return 'position-pending';
}

function applyStartPositionSetup({
  state,
  context,
}: {
  state: {
    presentation: ReadonlySignal<StartPositionState['presentation']>;
    startPosition: Signal<StartPositionState['startPosition']>;
    currentTime: Signal<StartPositionState['currentTime']>;
  };
  context: {
    mediaElement: ReadonlySignal<StartPositionContext['mediaElement']>;
  };
}): Reactor<StartPositionFsmState | 'destroying' | 'destroyed'> {
  const derivedStateSignal = computed(() =>
    deriveState(state.presentation.get(), context.mediaElement.get(), state.startPosition.get())
  );

  return createMachineReactor<StartPositionFsmState>({
    initial: 'preconditions-unmet',
    monitor: () => derivedStateSignal.get(),
    states: {
      'preconditions-unmet': {},

      'position-pending': {
        // entry body is auto-untracked. Consuming the command flips the
        // monitor back to 'preconditions-unmet'; the state-exit cleanup then
        // drops the (already-fired) listener.
        entry: () => {
          const mediaElement = context.mediaElement.get()!;
          const position = state.startPosition.get()!;

          // Step 1 — point the loaders' first load window at the position.
          state.currentTime.set(position);

          // Step 2 — seek once the element can honor it, then consume.
          const apply = () => {
            mediaElement.currentTime = position;
            state.startPosition.set(undefined);
          };

          if (mediaElement.readyState >= HTMLMediaElement.HAVE_METADATA) {
            apply();
            return;
          }

          return listen(mediaElement, 'loadedmetadata', apply, { once: true });
        },
      },
    },
  });
}

export const applyStartPosition = defineBehavior({
  stateKeys: ['presentation', 'startPosition', 'currentTime'],
  contextKeys: ['mediaElement'],
  setup: applyStartPositionSetup,
});
