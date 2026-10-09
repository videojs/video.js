import { defineBehavior } from '../../core/composition/define-behavior';
import { createMachineReactor } from '../../core/reactors/create-machine-reactor';
import { computed, peek, type ReadonlySignal, type Signal } from '../../core/signals/primitives';
import { isResolvedPresentation, type MaybeResolvedPresentation } from '../../media/types';
import { getCdnId as defaultGetCdnId, type GetCdnId, getOrderedCdnIds } from '../../media/utils/cdn';

export interface DeriveCdnPriorityState {
  presentation?: MaybeResolvedPresentation;
  cdnPriority?: string[];
}

const samePriority = (a: string[] | undefined, b: string[]): boolean =>
  !!a && a.length === b.length && a.every((cdn, i) => cdn === b[i]);

/**
 * **Session-level CDN priority.** While a presentation is resolved, owns the `cdnPriority` signal: the distinct CDNs
 * the source is served from (origin of each track's URL), in manifest priority order — most-preferred first. Cleared on
 * src unload. The name mirrors HLS content steering's `PATHWAY-PRIORITY`.
 *
 * Redundant-stream sources (e.g. Mux's `?redundant_streams=true`) list the same content on multiple hosts, so the
 * candidate tracks already include one variant per CDN. This behavior publishes _which_ CDNs exist and their priority;
 * the `preferActiveCdn` scope rule in `track-switching` reads `cdnPriority` and narrows each type's candidates to the
 * first CDN with surviving tracks — so video / audio / text all resolve from one host (the shared list is the
 * per-presentation coherence guarantee).
 *
 * The "active" CDN is not stored — it's derived by the scope as the highest-priority entry in `cdnPriority` that still
 * has tracks after the constraints pre-pass. That makes failover a pure consequence of the (future) failed-CDN
 * constraint: when the primary's tracks are pruned during cooldown, the scope falls to the next CDN; when the primary
 * recovers, it snaps back. Content steering, when it lands, reorders `cdnPriority` (pathway priority as a sort key).
 *
 * Lifecycle: `'presentation-unresolved'` ↔ `'presentation-resolved'`, mirroring `setupTrackSwitching`. The resolved
 * state owns the signal; its entry-returned cleanup clears it on exit (canonical cleanup-binds-to-setup per
 * `reactors.md`).
 *
 * @example
 *   const reactor = deriveCdnPriority.setup({ state });
 */
export const deriveCdnPriority = defineBehavior({
  stateKeys: ['presentation', 'cdnPriority'],
  contextKeys: [],
  setup: ({
    state,
    config = {},
  }: {
    state: {
      presentation: ReadonlySignal<DeriveCdnPriorityState['presentation']>;
      cdnPriority: Signal<DeriveCdnPriorityState['cdnPriority']>;
    };
    config?: { getCdnId?: GetCdnId };
  }) => {
    const getCdnId = config.getCdnId ?? defaultGetCdnId;
    const derivedStateSignal = computed(() =>
      isResolvedPresentation(state.presentation.get())
        ? ('presentation-resolved' as const)
        : ('presentation-unresolved' as const)
    );

    return createMachineReactor({
      initial: 'presentation-unresolved',
      monitor: () => derivedStateSignal.get(),
      states: {
        'presentation-unresolved': {},
        'presentation-resolved': {
          // Cleanup-binds-to-setup: the CDN priority list is valid for exactly
          // 'presentation-resolved'. Clear fires on exit (src unload + destroy).
          entry: () => () => state.cdnPriority.set(undefined),
          effects: [
            () => {
              const presentation = state.presentation.get();
              if (!isResolvedPresentation(presentation)) return;

              const next = getOrderedCdnIds(presentation, getCdnId);

              // Skip the write when the CDN set is unchanged — a live reload swaps
              // in a new presentation object with the same hosts, and re-setting a
              // fresh array would re-fire the scope for an identical result.
              // `peek` reads without subscribing, so this never self-triggers.
              if (!samePriority(peek(state.cdnPriority), next)) state.cdnPriority.set(next);
            },
          ],
        },
      },
    });
  },
});
