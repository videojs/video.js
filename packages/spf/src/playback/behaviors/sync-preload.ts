/**
 * **Bidirectional sync between `state.preload` and `mediaElement.preload`.**
 *
 * Two effects:
 *
 * - **Read (DOM → state)** — on `context.mediaElement` swap or `state.presentation.url` change, copies the media
 *   element's _authored_ preload into `state.preload` if it's a W3C value and `state.preload` isn't holding an extended
 *   (non-W3C) value. Author intent only: on a DOM element the `preload` IDL property reports a browser-dependent UA
 *   default even when no attribute was set (`'metadata'` Chromium, `'auto'` WebKit), so the property is consulted only
 *   when the element carries a `preload` content attribute — a UA default is never a source. When the element has no
 *   authored W3C opinion and `state.preload` is undefined, backfills from `config.defaultPreload` (default-default
 *   `'metadata'`) so `state.preload` is never undefined in steady state.
 * - **Write (state → DOM)** — on `state.preload` change or `context.mediaElement` swap, writes `state.preload` back to
 *   `mediaElement.preload` if the value is W3C.
 *
 * Extended values (e.g. `'canplay'`) written externally to `state.preload` are sticky: read won't overwrite them, write
 * won't push them to the DOM. All writes are deduped to break echo loops and avoid spurious re-triggers downstream
 * (notably `resolvePresentation`, which reads `state.preload`).
 */
import { defineBehavior } from '../../core/composition/define-behavior';
import { effect } from '../../core/signals/effect';
import { computed, peek, type ReadonlySignal, type Signal } from '../../core/signals/primitives';
import type { MediaElementLike } from '../../media/types';
import { DEFAULT_PRELOAD, isStandardPreload, type StandardPreload } from '../../media/utils/preload';
import type { PresentationState } from './resolve-presentation';

export interface SyncPreloadConfig {
  /**
   * Backfill applied to `state.preload` when neither the host element nor external code has supplied a W3C value.
   * Defaults to `'metadata'`.
   */
  defaultPreload?: StandardPreload;
}

type State = Pick<PresentationState, 'preload' | 'presentation'>;

function syncPreloadSetup({
  state,
  context,
  config,
}: {
  state: {
    preload: Signal<State['preload']>;
    presentation: ReadonlySignal<State['presentation']>;
  };
  context: { mediaElement: ReadonlySignal<MediaElementLike | undefined> };
  config?: SyncPreloadConfig;
}): () => void {
  const defaultPreload: StandardPreload = config?.defaultPreload ?? DEFAULT_PRELOAD;
  const presentationUrl = computed(() => state.presentation.get()?.url);

  // Read must be registered before write: effects re-run in registration
  // order (see core/signals/effect.ts → runPending). On a shared-signal
  // change (e.g. `context.mediaElement` swap), read fires first and gets to
  // claim `state.preload`, giving "most-recent-wins on attach" — a freshly
  // mounted <video> with a W3C `preload` attribute overrides whatever
  // `state.preload` previously held. Swap the order or split these into
  // separate behaviors and the "most-recent-wins on attach" test pins the
  // regression.
  const cleanupRead = effect(() => {
    presentationUrl.get();
    const mediaElement = context.mediaElement.get();
    // peek (not get): external writes to state.preload shouldn't re-trigger
    // this effect, only mediaElement / presentation-url changes should.
    const current = peek(state.preload);
    // Extended sticky: leave non-W3C values (e.g. 'canplay') alone.
    if (current !== undefined && !isStandardPreload(current)) return;

    // Author intent only: a DOM element's `preload` property reports a UA
    // default when no attribute was authored (the shadow <video> under an SPF
    // Media never carries one), so gate the property read on attribute
    // presence. An element without attribute reflection has no UA defaults —
    // its property is authored by construction.
    const authoredPreload =
      mediaElement && (!mediaElement.hasAttribute || mediaElement.hasAttribute('preload'))
        ? mediaElement.preload
        : undefined;

    const target: StandardPreload | undefined = isStandardPreload(authoredPreload)
      ? authoredPreload
      : current === undefined
        ? defaultPreload
        : undefined;
    if (target === undefined || target === current) return;

    state.preload.set(target);
  });

  const cleanupWrite = effect(() => {
    const next = state.preload.get();
    const mediaElement = context.mediaElement.get();
    if (!mediaElement) return;

    if (!isStandardPreload(next)) return;

    if (mediaElement.preload === next) return;

    mediaElement.preload = next;
  });

  return () => {
    cleanupRead();
    cleanupWrite();
  };
}

export const syncPreload = defineBehavior({
  stateKeys: ['preload', 'presentation'],
  contextKeys: ['mediaElement'],
  setup: syncPreloadSetup,
});
