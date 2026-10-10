/**
 * **Bridge MSE playback to AirPlay on WebKit.** MSE streams can't be handed to an AirPlay receiver directly. The
 * WebKit-recommended workaround is to append a fallback `<source type="application/x-mpegURL">` carrying the original
 * manifest URL: Safari exposes the AirPlay picker and, when a wireless target is selected, plays that native-HLS source
 * on the receiver. The session state (WebKit's wireless flag, falling edge debounced — see `REMOTE_INACTIVE_SETTLE_MS`)
 * is written straight to its policy consequences, declared here so the cause→policy mapping stays with the feature:
 *
 * - `state.loadingSuspended` — held while the session is live. Observed by the `loadXSegments` dispatchers (no fetching
 *   alongside the receiver) and by `setupMediaSource` (its post-close rebuild waits — attaching runs `element.load()`
 *   under the live receiver, which destroys a session still being established). The suspension this behavior holds
 *   doubles as its own session fact — same writer, same edges.
 * - `state.startPosition` — one-shot command: the position is captured from the element at the session's settled end
 *   (still receiver-mirrored) and written once the rebuild's `load()` resets the element (its `'emptied'`), so
 *   `applyStartPosition` applies it to the rebuilt source — never to the pre-rebuild element — and starts it where the
 *   receiver left off. The playing state rides the same snapshot but stays behavior-local: this behavior itself calls
 *   `play()` once the command has been _consumed_ — i.e. after the seek — when the receiver was playing at session end.
 *   The whole restore is bound to the presentation the session owned and retracted if that changes.
 *
 * A source change during a live session releases the hold rather than deferring until the session ends, so the rebuild
 * runs and WebKit switches the receiver to the newly-built AirPlay alternate. Measured, not contracted — see the effect
 * below. https://webkit.org/blog/15036/how-to-use-media-source-extensions-with-airplay/
 *
 * Single-positive-state reactor (`'preconditions-unmet'` ↔ `'airplay-capable'`): gated on a WebKit-AirPlay-capable
 * media element being in scope. The entry — gated on `context.mediaSource` — appends the fallback `<source>` (kept
 * current from `state.presentation`) and enables the AirPlay picker once the MediaSource is open, removing the source
 * the moment the MediaSource detaches so it never survives an MSE teardown. State-exit cleanup (author opt-out, detach,
 * source reset, behavior destroy) removes the source and restores the element's `disableRemotePlayback` default. No-op
 * on non-WebKit platforms (Chromium, Firefox) — `deriveState` never leaves `'preconditions-unmet'`.
 *
 * MMS and AirPlay want _opposite_ values of `disableRemotePlayback` on the same element, so it is **sequenced**:
 *
 * - **MMS needs `true` to open.** `setupMediaSource` sets `disableRemotePlayback = true` when it attaches a
 *   ManagedMediaSource — Safari won't fire `sourceopen` (and MSE playback never starts) otherwise.
 * - **AirPlay needs `false` to offer the picker.** Flipping to `false` _before_ the source opens would prevent
 *   `sourceopen`, so the flip is gated on `context.mediaSource` — which `setupMediaSource` publishes exactly once the
 *   MS is open. Re-fires per source (the slot clears + republishes on reset).
 * - **Author opt-out wins.** `state.disableRemotePlayback` is the author's intent, written only by the media adapter's
 *   IDL property; MMS/programmatic code touch the element's own `disableRemotePlayback` instead. A `true` there is
 *   unambiguously the author's choice to disable remote playback, so it holds the machine in `'preconditions-unmet'`
 *   and nothing is set up.
 */

import { isWebKitAirPlayCapable, listen, type WebKitVideoElement } from '@videojs/utils/dom';

import { defineBehavior } from '../../../core/composition/create-composition';
import type { Reactor } from '../../../core/reactors/create-machine-reactor';
import { createMachineReactor } from '../../../core/reactors/create-machine-reactor';
import { effect } from '../../../core/signals/effect';
import { computed, peek, type ReadonlySignal, type Signal } from '../../../core/signals/primitives';
import type { MaybeResolvedPresentation } from '../../../media/types';
import type { StartPositionState } from './apply-start-position';
import type { SegmentLoadingState } from './load-segments';

/**
 * How long WebKit's wireless flag must read _inactive_ before the session-driven `loadingSuspended` clears.
 *
 * Measured on Safari 26.4 (macOS): when an AirPlay session engages, Safari closes the ManagedMediaSource and — while
 * its pipeline switches to the native-HLS fallback source — transiently reports `webkitCurrentPlaybackTargetIsWireless
 * === false`, firing the changed event. Trusting an instantaneous inactive reading would release `setupMediaSource`'s
 * rebuild hold mid-handoff; its recovery `load()` then destroys the very session being established. Rising edges apply
 * immediately; only the falling edge waits out this settle window.
 */
const REMOTE_INACTIVE_SETTLE_MS = 1000;

/**
 * Author intent for the AirPlay/remote-playback picker, written by the media adapter's `disableRemotePlayback` IDL
 * property. `true` is an explicit opt-out: `setupAirPlay` reads it at attach and sets nothing up, leaving the element's
 * remote playback disabled. Distinct from the underlying media element's own `disableRemotePlayback`, which stays
 * programmatically managed (ManagedMediaSource / AirPlay). An external signal: the adapter writes it whether or not
 * `setupAirPlay` is composed.
 */
export interface DisableRemotePlaybackState {
  disableRemotePlayback?: boolean;
}

type AirPlayFsmState = 'preconditions-unmet' | 'airplay-capable';

function deriveState(
  mediaElement: HTMLMediaElement | undefined,
  authorDisabledRemotePlayback: boolean | undefined
): AirPlayFsmState {
  if (!mediaElement || !isWebKitAirPlayCapable(mediaElement)) return 'preconditions-unmet';

  if (authorDisabledRemotePlayback) return 'preconditions-unmet';

  return 'airplay-capable';
}

function setupAirPlaySetup({
  state,
  context,
}: {
  state: {
    presentation: ReadonlySignal<MaybeResolvedPresentation | undefined>;
    disableRemotePlayback: ReadonlySignal<boolean | undefined>;
    loadingSuspended: Signal<SegmentLoadingState['loadingSuspended']>;
    startPosition: Signal<StartPositionState['startPosition']>;
  };
  context: {
    mediaElement: ReadonlySignal<HTMLMediaElement | undefined>;
    mediaSource: ReadonlySignal<MediaSource | undefined>;
  };
}): Reactor<AirPlayFsmState | 'destroying' | 'destroyed'> {
  const derivedStateSignal = computed(() => deriveState(context.mediaElement.get(), state.disableRemotePlayback.get()));

  return createMachineReactor<AirPlayFsmState>({
    initial: 'preconditions-unmet',
    monitor: () => derivedStateSignal.get(),
    states: {
      'preconditions-unmet': {},

      'airplay-capable': {
        entry: () => {
          const mediaElement = context.mediaElement.get() as WebKitVideoElement;

          // WebKit's wireless flag is the only session signal. The standard
          // Remote Playback API's `remote.state` is deliberately not consulted:
          // it doesn't track AirPlay sessions reliably on WebKit (same reason
          // `remotePlaybackFeature` in @videojs/core skips it), and a stale
          // `'connected'` would pin `loadingSuspended` on — stranding the
          // rebuild in a way the settle window below can't recover from.
          const isSessionActive = () => !!mediaElement.webkitCurrentPlaybackTargetIsWireless;

          let settleTimer: ReturnType<typeof setTimeout> | undefined;
          // Session-end restore. The position/playing snapshot is taken at the
          // settled falling edge (the element still mirrors the receiver) but
          // acted on only at the element's next `'emptied'` — once the
          // rebuild's `load()` has reset the element. Writing it earlier would
          // hand `applyStartPosition` a command against the pre-rebuild element
          // (readyState still >= HAVE_METADATA), which it would apply and
          // consume before the rebuilt source exists.
          //
          // The restore is bound to the presentation the session owned, and
          // that identity is re-checked at *every* async hop — settle timer,
          // `'emptied'`, and the outstanding-command effect below. Checking at
          // only one hop leaves the others open: a source change inside the
          // settle window, or between `'emptied'` and the element becoming
          // seekable, would otherwise strand the old session's position (and an
          // unrequested `play()`) on the new source.
          let sessionPresentationUrl: string | undefined;
          let pendingRestore:
            | { position: number; wasPlaying: boolean; presentationUrl: string | undefined }
            | undefined;
          /** Presentation an already-written `state.startPosition` belongs to. */
          let restoreOwnerUrl: string | undefined;
          let resumeWhenRestored = false;

          const sync = () => {
            if (isSessionActive()) {
              clearTimeout(settleTimer);
              settleTimer = undefined;

              // Rising edge — the presentation the receiver is taking over.
              if (!peek(state.loadingSuspended)) sessionPresentationUrl = peek(state.presentation)?.url;

              state.loadingSuspended.set(true);
            } else if (peek(state.loadingSuspended)) {
              // Falling edge: don't trust an instantaneous inactive reading —
              // re-check once the flag has settled.
              settleTimer ??= setTimeout(() => {
                settleTimer = undefined;
                const stillActive = isSessionActive();

                if (!stillActive) {
                  const ownerUrl = sessionPresentationUrl;

                  sessionPresentationUrl = undefined;

                  // Snapshot only while the session's own presentation is still
                  // current. `currentTime` here belongs to that presentation —
                  // during a session `setupMediaSource` has already torn down,
                  // so a source change inside this window resets neither the
                  // element nor its position, and pairing that position with the
                  // incoming URL would smuggle it onto the new source.
                  if (peek(state.presentation)?.url === ownerUrl) {
                    pendingRestore = {
                      position: mediaElement.currentTime,
                      wasPlaying: !mediaElement.paused,
                      presentationUrl: ownerUrl,
                    };
                  }
                }

                state.loadingSuspended.set(stillActive);
              }, REMOTE_INACTIVE_SETTLE_MS);
            } else {
              state.loadingSuspended.set(false);
            }
          };
          const listenerCleanup = new AbortController();

          listen(mediaElement, 'webkitcurrentplaybacktargetiswirelesschanged', sync, {
            signal: listenerCleanup.signal,
          });
          listen(
            mediaElement,
            'emptied',
            () => {
              if (!pendingRestore) return;

              const { position, wasPlaying, presentationUrl } = pendingRestore;

              pendingRestore = undefined;

              if (peek(state.presentation)?.url !== presentationUrl) return;

              state.startPosition.set(position);
              restoreOwnerUrl = presentationUrl;
              resumeWhenRestored = wasPlaying;
            },
            { signal: listenerCleanup.signal }
          );

          // A source change during a live session releases the hold, letting the
          // rebuild run instead of waiting for the session to end.
          //
          // Doing nothing is not a neutral choice — it silently defers the
          // change. `<source>` children are only consulted while resource
          // selection runs, so the effect below rewriting the fallback's `src`
          // does nothing to what the receiver is already playing, and the
          // rebuild is held by `loadingSuspended`, so the receiver stays on the
          // outgoing stream until the user disengages.
          //
          // Releasing the hold lets the rebuild proceed, and the receiver ends
          // up on the new stream — measured on Safari 26.4. Note where the
          // handover actually happens, because it is not the rebuild's `load()`:
          // clearing the hold also makes the source effect below see an inactive
          // session with no `context.mediaSource`, so it drops the fallback, and
          // the rebuild's resource selection runs with the MSE source alone. The
          // switch comes afterwards, when that effect re-creates the fallback
          // against the new presentation once the MediaSource opens and WebKit
          // moves the live session onto the newly-appeared alternate.
          //
          // That leaves a window where an active session has no compatible
          // alternate on the element, and it survives it. Holding the fallback
          // across the rebuild instead would close the window and make the
          // handover selection-driven, but it swaps a measured path for an
          // argued one — don't without a device pass.
          //
          // Measured, not contracted: this is under-specified territory, so
          // nothing here depends on the handover succeeding. If a UA drops the
          // session instead, the falling edge runs its ordinary course; the
          // restore is suppressed either way because the snapshot is bound to
          // the presentation the session owned.
          //
          // Note this is *not* an attempt to end the session. Setting
          // `disableRemotePlayback = true` was tried: the Remote Playback API
          // requires it to disconnect (spec §5.3.2) but WebKit does not honor
          // that for AirPlay — the session survived, measured on Safari 26.4.
          // Deliberately not written here, so that behavior can't silently flip
          // to "receiver drops" if WebKit ever implements the disconnect.
          const disposeSourceChangeEnd = effect(() => {
            const url = state.presentation.get()?.url;
            // `loadingSuspended` is this behavior's own session fact; peeked so
            // clearing it below doesn't re-trigger.
            if (!peek(state.loadingSuspended) || url === sessionPresentationUrl) return;

            sessionPresentationUrl = undefined;
            clearTimeout(settleTimer);
            settleTimer = undefined;
            state.loadingSuspended.set(false);
          });

          // Watches an outstanding restore command to its end. Two outcomes:
          //
          // - **Consumed** (`startPosition` back to `undefined`): the element is
          //   at the restored position, so resuming is safe. Keying the resume
          //   off consumption rather than off `'loadedmetadata'` orders it after
          //   `applyStartPosition`'s seek — arming a listener for the same event
          //   would put `play()` ahead of the seek, since this behavior registers
          //   synchronously while `applyStartPosition` only reaches its state a
          //   microtask later. The rebuild's load algorithm forced `paused =
          //   true`; a rejection here (autoplay policy) degrades to
          //   paused-at-position. Requires a `startPosition` consumer in the
          //   composition (`applyStartPosition`) — without one the position is
          //   never restored either, so resuming would be wrong anyway.
          // - **Superseded** (presentation changed): retract the command and
          //   disarm, so neither the seek nor the resume reaches the new source.
          const disposeRestoreWatch = effect(() => {
            const url = state.presentation.get()?.url;
            const position = state.startPosition.get();

            if (!restoreOwnerUrl) return;

            if (url !== restoreOwnerUrl) {
              restoreOwnerUrl = undefined;
              resumeWhenRestored = false;

              if (position !== undefined) state.startPosition.set(undefined);

              return;
            }

            if (position !== undefined) return;

            restoreOwnerUrl = undefined;

            if (!resumeWhenRestored) return;

            resumeWhenRestored = false;
            mediaElement.play().catch((err) => {
              console.warn('[setupAirPlay] session-end resume play() rejected — staying paused:', err);
            });
          });

          // This effect combines:
          // - adding a native HLS fallback source when the mediaSource is
          //   attached / removing it when it's detached — UNLESS a session is
          //   live: during an AirPlay session the engine detaches its dead
          //   MediaSource (see setupMediaSource's sourceclose recovery) while
          //   the receiver is playing exactly this fallback source, so it
          //   must survive until the session's falling edge (the rebuild's
          //   republish then adopts it again).
          // - keeping this sourceEl's src in sync with the current presentation.
          // The created source is also cleaned on state exit.
          // The dependence on context.mediaSource means the source is appended
          // only after the MMS has been attached and opened (therefore we can
          // flip disableRemotePlayback). Being in this state also implies
          // that the author has not disabled remote playback.
          let sourceEl: HTMLSourceElement | null = null;
          const disposeSource = effect(() => {
            const hasMediaSource = !!context.mediaSource.get();
            const sessionActive = !!state.loadingSuspended.get();
            const url = state.presentation.get()?.url ?? '';

            if (!hasMediaSource && !sessionActive) {
              sourceEl?.remove();
              sourceEl = null;
            } else if (hasMediaSource && (!sourceEl || sourceEl.parentNode !== mediaElement)) {
              sourceEl = document.createElement('source');
              sourceEl.type = 'application/x-mpegURL';
              mediaElement.append(sourceEl);
              mediaElement.disableRemotePlayback = false;
            }

            if (sourceEl) sourceEl.src = url;
          });

          // AirPlay may already be active at (re)attach.
          sync();

          return () => {
            disposeSource();
            disposeSourceChangeEnd();
            disposeRestoreWatch();
            listenerCleanup.abort();
            clearTimeout(settleTimer);
            sourceEl?.remove();
            sourceEl = null;
            // Undo the picker enable: hand the element back to its MMS-default
            // `disableRemotePlayback = true`.
            mediaElement.disableRemotePlayback = true;
            // Don't strand the engine held/suspended if we tear down
            // mid-session (author opt-out, detach, destroy).
            state.loadingSuspended.set(false);

            // Nor leave a restore command behind for the next source to apply.
            if (restoreOwnerUrl) {
              restoreOwnerUrl = undefined;
              resumeWhenRestored = false;

              if (peek(state.startPosition) !== undefined) state.startPosition.set(undefined);
            }
          };
        },
      },
    },
  });
}

export const setupAirPlay = defineBehavior({
  stateKeys: ['presentation', 'disableRemotePlayback', 'loadingSuspended', 'startPosition'],
  contextKeys: ['mediaElement', 'mediaSource'],
  setup: setupAirPlaySetup,
});
