import { listen } from '@videojs/utils/dom';

import { defineBehavior } from '../../../core/composition/define-behavior';
import type { Reactor } from '../../../core/reactors/create-machine-reactor';
import { createMachineReactor } from '../../../core/reactors/create-machine-reactor';
import { computed, type ReadonlySignal, type Signal } from '../../../core/signals/primitives';
import type { MaybeResolvedPresentation } from '../../../media/types';

/** State shape for load-trigger tracking. */
export interface LoadTriggersState {
  /**
   * Sticky-true per source. Flips to `true` the first time an event occurs that should switch loading behavior from
   * preload-based to standard load (currently DOM `play` / `seeking`). Reset to `false` on source change.
   *
   * Read by `resolvePresentation` and `loadVideoSegments` / `loadAudioSegments` to mirror native `HTMLMediaElement`
   * preload semantics — only meaningful when `preload !== 'auto'`, which already loads fully regardless.
   */
  loadActivated?: boolean;
  /** Current presentation — URL is used to detect source changes. */
  presentation?: MaybeResolvedPresentation;
}

/** Context shape for load-trigger tracking. */
export interface LoadTriggersContext {
  mediaElement?: HTMLMediaElement | undefined;
}

type LoadTriggersFsmState = 'preconditions-unmet' | 'monitoring' | 'load-active';

/**
 * Slot-driven FSM. The slot `loadActivated` is the canonical externally- observable state; `deriveState` reads it (and
 * the preconditions) to derive the local FSM state. The slot is _both_ the state and the data — no separate internal
 * bookkeeping.
 *
 *     'preconditions-unmet' ⟷ 'monitoring' ⟷ 'load-active'
 *
 *     preconditions-unmet → monitoring        element + URL appear
 *     monitoring          → load-active       slot flips true (listener fires
 *                                             or external write)
 *     load-active         → monitoring        within-state cleanup resets slot
 *                                             (URL or element identity change)
 *     any                 → preconditions-unmet  element or URL → undefined
 *
 *     any state → destroying → destroyed       on destroy()
 */
function deriveState(
  presentation: MaybeResolvedPresentation | undefined,
  mediaElement: HTMLMediaElement | undefined,
  loadActivated: boolean | undefined
): LoadTriggersFsmState {
  if (!mediaElement || !presentation?.url) return 'preconditions-unmet';

  if (loadActivated) return 'load-active';

  return 'monitoring';
}

/**
 * Track preload-overriding events per source.
 *
 * Writes `state.loadActivated = true` the first time a `play` or `seeking` event fires on the attached media element
 * for the current source — or immediately on entry if the element is already committed to loading (`el.autoplay`,
 * `!el.paused`, or `el.seeking`), covering autoplay, native-controls, and direct-DOM-`play()` scenarios.
 *
 * Sticky-true _within a source identity_: subsequent play/pause/seek cycles don't flip back. Source identity =
 * (mediaElement, presentation URL). Either changing — including direct in-place swap with no `undefined` intermediate —
 * resets the slot to `false`.
 *
 * Multi-writer with `hls/adapter.ts:play()` (which writes `true` directly on programmatic play) is intentional —
 * different domains. The adapter records programmatic intent; this behavior is the DOM-side observer. Pre-existing
 * `true` writes are honored because `deriveState` reads the slot — a `true` value routes directly to `'load-active'`
 * without entering `'monitoring'`.
 *
 * @example
 *   const reactor = trackLoadTriggers.setup({ state, context });
 *   // later:
 *   reactor.destroy();
 */
function trackLoadTriggersSetup({
  state,
  context,
}: {
  state: {
    loadActivated: Signal<LoadTriggersState['loadActivated']>;
    presentation: ReadonlySignal<LoadTriggersState['presentation']>;
  };
  context: { mediaElement: ReadonlySignal<LoadTriggersContext['mediaElement']> };
}): Reactor<LoadTriggersFsmState | 'destroying' | 'destroyed'> {
  const derivedStateSignal = computed(() =>
    deriveState(state.presentation.get(), context.mediaElement.get(), state.loadActivated.get())
  );
  // Sparse-firing source-URL signal. Emits whenever `presentation?.url`
  // resolves to a different value — covering both URL string changes
  // (url_a → url_b) and transitions where the URL becomes defined or
  // undefined (presentation set, cleared, or replaced without a URL
  // field). Does NOT emit when `state.presentation` is rewritten with
  // the same URL: manifest parsing, duration calc, track resolution,
  // and other enrichment paths re-write the presentation object
  // frequently — tracking raw `state.presentation` here would spuriously
  // reset the 'load-active' slot.
  const urlSignal = computed(() => state.presentation.get()?.url);

  return createMachineReactor<LoadTriggersFsmState>({
    initial: 'preconditions-unmet',
    monitor: () => derivedStateSignal.get(),
    states: {
      'preconditions-unmet': {},

      monitoring: {
        // effects (not entry) so element-identity change within this state
        // re-fires and re-attaches listeners to the new element. The monitor
        // guarantees mediaElement is truthy while we're in this state.
        effects: () => {
          const el = context.mediaElement.get()!;

          const setLoadActivated = () => state.loadActivated.set(true);

          if (el.autoplay || !el.paused || el.seeking) {
            setLoadActivated();
            return;
          }

          const cleanupPlay = listen(el, 'play', setLoadActivated);
          const cleanupSeeking = listen(el, 'seeking', setLoadActivated);

          return () => {
            cleanupPlay();
            cleanupSeeking();
          };
        },
      },

      'load-active': {
        // effects-based cleanup (not entry) because the cleanup must fire on
        // BOTH state exit AND within-state identity change (url_a → url_b,
        // element_a → element_b — both truthy, no state transition).
        // Re-firing tracked reads → cleanup writes loadActivated=false →
        // deriveState (which reads loadActivated) returns 'monitoring' →
        // state transitions → fresh listeners attached for the new source.
        effects: () => {
          context.mediaElement.get();
          urlSignal.get();
          return () => state.loadActivated.set(false);
        },
      },
    },
  });
}

export const trackLoadTriggers = defineBehavior({
  stateKeys: ['loadActivated', 'presentation'],
  contextKeys: ['mediaElement'],
  setup: trackLoadTriggersSetup,
});
