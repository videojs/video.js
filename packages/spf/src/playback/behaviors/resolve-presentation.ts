/**
 * **Resolve an unresolved presentation by fetching and parsing its manifest.**
 *
 * Reads `state.presentation`; when it holds `{ url }` (unresolved) and the preload / load-activation gate is met,
 * fetches the manifest, parses it via the **required** `config.parsePresentation`, and writes the resolved
 * `Presentation` back to the same slot. The behavior is format-neutral: the composing engine wires in its parser (e.g.
 * the HLS engine supplies the multivariant-playlist parser).
 *
 * Source-identity-driven, expressed as a 4-state machine:
 *
 *     'preconditions-unmet' → 'idle' → 'resolving' → 'resolved'
 *
 * - `'preconditions-unmet'`: no presentation, or presentation has no URL.
 * - `'idle'`: URL present, unresolved, gate unmet (blocking preload + no load-activation). Waits for the gate to open.
 * - `'resolving'`: URL present, unresolved, gate met. A presentation-tracking effect starts the fetch and returns the
 *   AbortController — the reactor calls `.abort()` on presentation replacement or state exit, so source change /
 *   gate-close / destroy all cancel cleanly. Late results commit only while the input presentation is still current.
 * - `'resolved'`: `state.presentation` holds a resolved `Presentation`.
 *
 * Gate semantics: `state.preload` (or `config.defaultPreload`, default `'metadata'`, when state.preload is unset)
 * blocks resolution when its value is `'none'` (see `isBlockingPreload` in `media/utils/preload`).
 * `state.loadActivated` is an override — true bypasses the preload gate entirely.
 *
 * Multi-writer with the engine adapter, which writes the initial unresolved `{ url }` to `state.presentation` from src
 * input. Different domains (config-input vs. derived state via fetch) — legitimate multi-writer.
 */
import { defineBehavior } from '../../core/composition/create-composition';
import type { Reactor } from '../../core/reactors/create-machine-reactor';
import { createMachineReactor } from '../../core/reactors/create-machine-reactor';
import { computed, type ReadonlySignal, type Signal } from '../../core/signals/primitives';
import { isResolvedPresentation, type MaybeResolvedPresentation, type Presentation } from '../../media/types';
import { DEFAULT_PRELOAD, isBlockingPreload, type StandardPreload } from '../../media/utils/preload';
import { credentialsFetch, type RequestCredentialsPolicy } from '../../network/credentials-fetch';
import { fetchResolvable as defaultFetchResolvable, getResponseText } from '../../network/fetch';

export interface PresentationState {
  presentation?: MaybeResolvedPresentation;
  preload?: 'auto' | 'metadata' | 'none' | undefined;
  /** True once a preload-overriding event has fired for the current source — enables resolution regardless of preload. */
  loadActivated?: boolean;
}

export type ParsePresentation = (text: string, presentation: MaybeResolvedPresentation) => Presentation;

export interface ResolvePresentationConfig {
  /**
   * Parses a manifest body into a resolved `Presentation`. **Required** — the behavior is format-neutral and the
   * composing engine supplies its own parser (HLS, DASH, etc.).
   */
  parsePresentation: ParsePresentation;
  /**
   * Fallback used when `state.preload` is unset (undefined / empty) for the resolution-gate decision. Defaults to
   * `'metadata'`, matching `syncPreload`'s own `defaultPreload`.
   */
  defaultPreload?: StandardPreload;
  /** The `credentials` mode the manifest request is made with; absent → the platform default. */
  requestCredentials?: RequestCredentialsPolicy;
}

export type ResolvePresentationState = 'preconditions-unmet' | 'idle' | 'resolving' | 'resolved';

function deriveState(
  presentation: MaybeResolvedPresentation | undefined,
  preload: PresentationState['preload'],
  loadActivated: boolean | undefined,
  defaultPreload: StandardPreload
): ResolvePresentationState {
  if (!presentation?.url) return 'preconditions-unmet';

  if (isResolvedPresentation(presentation)) return 'resolved';

  const gateOpen = !!loadActivated || !isBlockingPreload(preload, defaultPreload);

  return gateOpen ? 'resolving' : 'idle';
}

function resolvePresentationSetup({
  state,
  config,
}: {
  state: {
    presentation: Signal<PresentationState['presentation']>;
    preload: ReadonlySignal<PresentationState['preload']>;
    loadActivated: ReadonlySignal<PresentationState['loadActivated']>;
  };
  config: ResolvePresentationConfig;
}): Reactor<ResolvePresentationState | 'destroying' | 'destroyed'> {
  const { parsePresentation } = config;
  const defaultPreload: StandardPreload = config.defaultPreload ?? DEFAULT_PRELOAD;
  const fetchResolvable = credentialsFetch(defaultFetchResolvable, config.requestCredentials);

  const derivedStateSignal = computed(() =>
    deriveState(state.presentation.get(), state.preload.get(), state.loadActivated.get(), defaultPreload)
  );

  return createMachineReactor<ResolvePresentationState>({
    initial: 'preconditions-unmet',
    monitor: () => derivedStateSignal.get(),
    states: {
      'preconditions-unmet': {},
      idle: {},
      resolving: {
        effects: () => {
          const presentation = state.presentation.get();
          // Disposed effects reorder the shared watcher, so this can run before
          // the monitor leaves the state; never fetch a cleared or resolved one.
          if (!presentation?.url || isResolvedPresentation(presentation)) return;

          const ac = new AbortController();

          fetchResolvable(presentation, { signal: ac.signal })
            .then((response) => getResponseText(response))
            .then((text) => {
              if (ac.signal.aborted || state.presentation.get() !== presentation) return;

              const parsed = parsePresentation(text, presentation);

              state.presentation.set(parsed);
            })
            .catch((error) => {
              if (error instanceof Error && error.name === 'AbortError') return;

              // TODO(error-management): route to a state-error slot once one exists.
              console.error('[resolvePresentation] manifest fetch/parse failed:', error);
            });

          return ac;
        },
      },
      resolved: {},
    },
  });
}

export const resolvePresentation = defineBehavior({
  stateKeys: ['presentation', 'preload', 'loadActivated'],
  contextKeys: [],
  setup: resolvePresentationSetup,
});
