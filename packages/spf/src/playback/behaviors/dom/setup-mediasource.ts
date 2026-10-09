import { listen } from '@videojs/utils/dom';

import { defineBehavior } from '../../../core/composition/define-behavior';
import type { Reactor } from '../../../core/reactors/create-machine-reactor';
import { createMachineReactor } from '../../../core/reactors/create-machine-reactor';
import { computed, type ReadonlySignal, type Signal, signal } from '../../../core/signals/primitives';
import { attachMediaSource, createMediaSource, waitForMediaSourceOpen } from '../../../media/dom/mse/mediasource-setup';
import { isResolvedPresentation, type MaybeResolvedPresentation } from '../../../media/types';

/** State shape required for MediaSource setup. */
export interface MediaSourceState {
  presentation?: MaybeResolvedPresentation;
}

/** Context shape for MediaSource setup. */
export interface MediaSourceContext {
  mediaElement?: HTMLMediaElement | undefined;
  mediaSource?: MediaSource;
}

/** Config for MediaSource setup. */
export interface MediaSourceSetupConfig {
  /**
   * Attach strategy — a composition-supplied implementation. Defaults to `attachMediaSource` (object URL on the `src`
   * attribute). Compositions that pair MSE with sibling `<source>` alternatives wire `attachMediaSourceAsSourceElement`
   * (e.g. the HLS engine, for `setupAirPlay`'s native fallback source).
   */
  attachMediaSource?: typeof attachMediaSource;
}

type MediaSourceFsmState = 'preconditions-unmet' | 'mediasource-attached';

function deriveState(
  presentation: MaybeResolvedPresentation | undefined,
  mediaElement: HTMLMediaElement | undefined,
  mediaSourceClosed: boolean
): MediaSourceFsmState {
  if (!mediaElement || !isResolvedPresentation(presentation)) return 'preconditions-unmet';

  // The current attachment was torn down (typically a UA-fired
  // `sourceclose`). The fact stands until the `'preconditions-unmet'`
  // effects consume it (see below); the reset then re-derives into a fresh
  // attach for the same source.
  if (mediaSourceClosed) return 'preconditions-unmet';

  return 'mediasource-attached';
}

function setupMediaSourceSetup({
  state,
  context,
  config = {},
}: {
  state: {
    presentation: ReadonlySignal<MediaSourceState['presentation']>;
  };
  context: {
    mediaElement: ReadonlySignal<MediaSourceContext['mediaElement']>;
    mediaSource: Signal<MediaSourceContext['mediaSource']>;
  };
  config?: MediaSourceSetupConfig;
}): Reactor<MediaSourceFsmState | 'destroying' | 'destroyed'> {
  const attach = config.attachMediaSource ?? attachMediaSource;
  // `loadingSuspended` is observed, never declared: the slot exists only in
  // compositions where a feature behavior (e.g. `setupAirPlay`) declares and
  // writes it, so it lives behind a cast rather than in the typed param
  // above — an optional param key would force declaring it in `stateKeys`,
  // which is what materializes a slot. Shape redefined locally (canonical:
  // `SegmentLoadingState['loadingSuspended']`) to avoid a load-segments
  // module dependency.
  const loadingSuspended = (state as { loadingSuspended?: ReadonlySignal<boolean | undefined> }).loadingSuspended;

  // Close-fact for the currently-owned MediaSource, flipped by the
  // entry's shared teardown. Consumed in `'preconditions-unmet'`.
  const mediaSourceClosed = signal(false);

  const derivedStateSignal = computed(() =>
    deriveState(state.presentation.get(), context.mediaElement.get(), mediaSourceClosed.get())
  );

  return createMachineReactor<MediaSourceFsmState>({
    initial: 'preconditions-unmet',
    monitor: () => derivedStateSignal.get(),
    states: {
      'preconditions-unmet': {
        // Consume a recorded close once new loading work may initiate — the
        // reset re-derives into `'mediasource-attached'`, rebuilding a fresh
        // MediaSource for the same source. While an observed
        // `loadingSuspended` holds, the fact stands and the rebuild waits:
        // attaching runs `element.load()`, which is exactly the loading work
        // the suspension forbids. Consuming only from this state means a
        // suspension can never tear down an existing attachment — there is
        // no code path from `loadingSuspended` to an exit.
        effects: () => {
          // `mediaSourceClosed` is tracked, not peeked: a new state's effects
          // can run BEFORE the old state's exit cleanup (effects run in
          // states-declaration order), so a teardown's fact-write can land
          // after this effect's entry run — tracking re-fires the consume.
          // Not suspended = slot absent (no writer composed) or value falsy.
          if (mediaSourceClosed.get() && !loadingSuspended?.get()) mediaSourceClosed.set(false);
        },
      },

      'mediasource-attached': {
        // entry body is auto-untracked. deriveState handles source resets via
        // the resolver's resolved/unresolved transitions; this entry creates
        // and attaches the MediaSource, awaits `'open'`, publishes on
        // context, and binds detach + slot clear to state exit + destroy.
        entry: () => {
          const mediaElement = context.mediaElement.get()!;
          const controller = new AbortController();

          const mediaSource = createMediaSource({ preferManaged: true });
          // Sync attach: the returned `detach` closes over the element +
          // object-URL captured at this moment, so state-exit cleanup tears
          // down exactly this attachment regardless of how the wait below
          // resolves.
          const { detach } = attach(mediaSource, mediaElement);

          // One complete teardown, shared by both triggers (the sourceclose
          // listener below and the state-exit cleanup) — whichever fires
          // first does the work; a re-run is harmless. Order matters:
          //
          // 1. Abort first — kills the open-wait and the listener, so a late
          //    publish can't race the slot clear.
          // 2. Clear the slot, which stops the downstream MSE pipeline and
          //    dirties the effects of behaviors owning sibling `<source>`
          //    children (`setupAirPlay`'s native-HLS fallback), queueing their
          //    removal pass. Kept ahead of the detach so that queueing is
          //    explicit: the `mediaSourceClosed` write above happens to queue
          //    the same pass today, but depending on it would couple this to
          //    an unrelated write.
          // 3. Detach with `deferReset`, which queues detach's `load()` reset
          //    behind that pass. A synchronous reset would run resource
          //    selection while the fallback is still in the DOM and commit the
          //    element to the outgoing manifest — starting native HLS playback
          //    of the source being torn down. Removing our own `<source>`
          //    doesn't re-run selection on its own, so nothing starts in the
          //    gap. The ownership guard re-checks at fire time, so a re-attach
          //    landing in between suppresses the reset.
          const teardown = () => {
            mediaSourceClosed.set(true);
            controller.abort();
            context.mediaSource.set(undefined);
            detach({ deferReset: true });
          };

          // Sourceclose recovery: the UA closing this MediaSource (AirPlay
          // handoff, MMS eviction) tears the attachment down synchronously —
          // detach skips
          // its `load()` reset for a closed MediaSource (see
          // `attachMediaSource`), leaving the element as the session or
          // eviction left it.
          listen(mediaSource, 'sourceclose', teardown, { signal: controller.signal });

          const publishWhenOpen = async () => {
            await waitForMediaSourceOpen(mediaSource, controller.signal);

            if (controller.signal.aborted) return;

            // `waitForMediaSourceOpen` resolves on any readyState transition
            // out of `'closed'`; if we landed in `'ended'` / `'closed'`
            // instead of `'open'`, the attach window is gone and we leave
            // the slot unpublished. The session is dead within this source
            // either way — publishing wouldn't help because
            // `setupVideoBufferActors` / `setupAudioBufferActors` calls
            // `addSourceBuffer` which throws on non-open. The next
            // source-reset re-enters this state with a fresh MediaSource
            // and recovers. Warn so the case is at least diagnosable; in
            // practice it requires the MediaSource to close/end before its
            // very first `sourceopen`, which a freshly attached MS
            // shouldn't do.
            if (mediaSource.readyState !== 'open') {
              console.warn(
                `[setupMediaSource] MediaSource transitioned to '${mediaSource.readyState}' before first 'sourceopen' — slot left unpublished; recoverable on next source reset.`
              );
              return;
            }

            context.mediaSource.set(mediaSource);
          };

          publishWhenOpen().catch((err) => console.error('[setupMediaSource] failed to publish MediaSource:', err));

          // State-exit cleanup — fires on source unload, element detach, or
          // behavior destroy; a harmless re-run after a `sourceclose`
          // already tore down.
          return teardown;
        },
      },
    },
  });
}

/**
 * **Own the MediaSource lifecycle for the current source.** When a resolved presentation and a mediaElement are both in
 * scope, creates a MediaSource, attaches it to the element, waits for `'open'`, and publishes it on
 * `context.mediaSource`. On source change or behavior destroy, detaches the MediaSource and clears the slot so the next
 * source starts fresh.
 *
 * Single-positive-state reactor (`'preconditions-unmet'` ↔ `'mediasource-attached'`): state derivation gates on
 * `mediaElement + isResolvedPresentation`. Riding the resolver's resolved/unresolved lifecycle makes direct URL
 * replacement structural — `resolvePresentation` routes the presentation back through unresolved on URL change, which
 * drives this reactor through `'preconditions-unmet'` so the entry's state-exit cleanup detaches the old MediaSource
 * before the new one is built.
 *
 * The entry resolves preconditions in sequence before publishing:
 *
 * 1. **Create + attach** — `createMediaSource` + `attachMediaSource` run synchronously on entry. The `detach` closure
 *    returned by `attachMediaSource` is captured for state-exit cleanup, so the cleanup is always bound to its setup
 *    even if the wait below is aborted.
 * 2. **Wait for `'open'`** — `waitForMediaSourceOpen` defers until the first `sourceopen` event (or any readyState
 *    transition out of `'closed'`).
 * 3. **Publish on `'open'`** — re-check `readyState === 'open'` after the await (covers `'ended'` / `'closed'` race)
 *    before writing to `context.mediaSource`. Downstream `setupVideoBufferActors` / `setupAudioBufferActors` call
 *    `addSourceBuffer` directly, which throws on non-open, so publish-only-when-open is the load-bearing contract.
 *
 * State-exit cleanup aborts the in-flight wait, detaches the MediaSource, and clears `context.mediaSource`. Order:
 * abort first (prevents a late publish racing the slot clear), then detach, then clear.
 *
 * # Sourceclose recovery
 *
 * The behavior owns one **unclosed** MediaSource per source identity. The UA can close the attached MediaSource out
 * from under the engine (Safari on an AirPlay handoff — see `setupAirPlay` — or a ManagedMediaSource evicted under
 * memory pressure), and a closed MediaSource can never reopen. The `sourceclose` listener tears the attachment down
 * synchronously; every teardown records a local close-fact, which holds the machine out until the fact is consumed —
 * then the re-derive comes back in with a fresh MediaSource for the _same_ source. Cause-agnostic. Consumption honors
 * an observed `loadingSuspended` (attaching runs `element.load()` — new loading work, e.g. resource selection under an
 * active AirPlay receiver), and happens only while the machine is out, so a suspension can never tear down an existing
 * attachment.
 *
 * Sole writer of `context.mediaSource`; other MSE behaviors (`setupVideoBufferActors`, `setupAudioBufferActors`,
 * `updateMediaSourceDuration`, `endOfStream`, `loadVideoSegments`) only read.
 */
export const setupMediaSource = defineBehavior({
  stateKeys: ['presentation'],
  contextKeys: ['mediaElement', 'mediaSource'],
  setup: setupMediaSourceSetup,
});
