/**
 * **CDN failover cooldown.** The expiry half of multi-CDN failover. Fetch sites own the _trip_: on a failed fetch they
 * add the failing CDN (origin) to the `failedCdns` state signal directly. This behavior owns the _expiry_: while a
 * presentation is resolved, it watches `failedCdns` and, for each CDN that appears, schedules a timer to remove it once
 * its cooldown lapses. `track-switching`'s `excludeFailedCdns` constraint prunes a failed CDN's tracks and the
 * active-CDN scope falls to the next one — and back, once the cooldown removes it here.
 *
 * Lifecycle is per-source: timers + `failedCdns` are cleared on exit (a new source starts with a clean slate). Policy
 * (cooldown) is engine config. This is the minimal `network-resilience` slice — a single failure trips a CDN, since
 * transient blips are the retry layer's job (it sits below the fetch sites, so anything that reaches `failedCdns` is
 * already terminal).
 */

import { defineBehavior } from '../../core/composition/create-composition';
import { createMachineReactor } from '../../core/reactors/create-machine-reactor';
import { computed, type ReadonlySignal, type Signal, update } from '../../core/signals/primitives';
import { isResolvedPresentation, type MaybeResolvedPresentation } from '../../media/types';

/** Failover policy: how long a CDN stays excluded after a failed fetch trips it. Supplied via engine config. */
export interface FailoverMonitorConfig {
  /** How long a tripped CDN stays excluded, in milliseconds. */
  cooldownMs: number;
}

const DEFAULT_FAILOVER_MONITOR_CONFIG: FailoverMonitorConfig = {
  // 5 minutes — a CDN outage is an infrastructure problem that outlasts a
  // transient blip, so re-probing it sooner mostly re-trips. Matches the
  // prevailing prior-art default (ExoPlayer's location exclusion, hls.js's
  // content-steering penalty box).
  cooldownMs: 300_000,
};

export interface SetupFailoverMonitorState {
  presentation?: MaybeResolvedPresentation;
  failedCdns?: string[];
}

export interface SetupFailoverMonitorConfig {
  /** Failover policy (cooldown); defaults to `DEFAULT_FAILOVER_MONITOR_CONFIG`. */
  failover?: Partial<FailoverMonitorConfig>;
}

/**
 * Expire failed CDNs from `failedCdns` once their cooldown lapses, for the resolved source.
 *
 * @example
 *   const reactor = setupFailoverMonitor.setup({ state });
 */
export const setupFailoverMonitor = defineBehavior({
  stateKeys: ['presentation', 'failedCdns'],
  contextKeys: [],
  setup: ({
    state,
    config = {},
  }: {
    state: {
      presentation: ReadonlySignal<SetupFailoverMonitorState['presentation']>;
      failedCdns: Signal<SetupFailoverMonitorState['failedCdns']>;
    };
    config?: SetupFailoverMonitorConfig;
  }) => {
    const cooldownMs = config.failover?.cooldownMs ?? DEFAULT_FAILOVER_MONITOR_CONFIG.cooldownMs;
    // CDN id → its pending cooldown-removal timer. Shared by the `effects`
    // scheduler (adds a timer per newly-failed CDN) and the exit cleanup
    // (clears them). Per-source: emptied on exit, so it re-enters clean.
    const timers = new Map<string, ReturnType<typeof setTimeout>>();
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
          // Cleanup-binds-to-setup: on exit (src unload + destroy) clear the
          // pending timers and reset `failedCdns` for the next source.
          entry: () => () => {
            timers.forEach((timer) => clearTimeout(timer));
            timers.clear();
            state.failedCdns.set(undefined);
          },
          effects: [
            () => {
              const failed = state.failedCdns.get() ?? [];

              failed.forEach((cdn) => {
                // Idempotent: a CDN already counting down keeps its original
                // deadline (re-failing it mid-cooldown doesn't extend it).
                if (timers.has(cdn)) return;

                const timer = setTimeout(() => {
                  timers.delete(cdn);
                  update(state.failedCdns, (current) => current?.filter((c) => c !== cdn));
                }, cooldownMs);

                timers.set(cdn, timer);
              });
            },
          ],
        },
      },
    });
  },
});
