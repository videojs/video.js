import { listen } from '@videojs/utils/dom';

import type { Behavior } from '../../../core/composition/define-behavior';
import { createMachineReactor, type Reactor } from '../../../core/reactors/create-machine-reactor';
import { computed, peek, type ReadonlySignal, type Signal } from '../../../core/signals/primitives';
import type { MaybeResolvedPresentation } from '../../../media/types';
import { getLiveEdge, type LiveEdge, type ResolveLiveLatency } from '../../primitives/live-window';

/**
 * Tolerance (seconds) around the window edges before the guard repositions, so boundary / floating-point noise doesn't
 * trigger a spurious seek.
 */
const REPOSITION_TOLERANCE = 0.1;

export interface SeekToLiveEdgeState {
  presentation?: MaybeResolvedPresentation;
  /**
   * One-shot start-position command in presentation-timeline seconds. Written here on entry into `live`; consumed
   * (cleared) by `applyStartPosition`.
   */
  startPosition?: number;
  selectedVideoTrackId?: string;
  selectedAudioTrackId?: string;
}

export interface SeekToLiveEdgeContext {
  mediaElement?: HTMLMediaElement | undefined;
}

export interface SeekToLiveEdgeConfig {
  /**
   * Resolve the target live latency (seconds the playhead should trail the live edge) for the timeline-bearing track.
   * Injected by the engine so the latency rule stays format-specific (HLS: `HOLD-BACK`, default 3× target duration;
   * DASH would read `suggestedPresentationDelay`) while this behavior stays neutral. Absent → `0` (seek straight to the
   * edge).
   */
  resolveLiveLatency?: ResolveLiveLatency;
}

type SeekToLiveEdgeFsmState = 'inactive' | 'live';

/**
 * `'live'` once the preconditions hold: a media element and a derivable live edge (whose placement is final by
 * construction — see `seekToLiveEdge`'s JSDoc). `'inactive'` otherwise.
 *
 * Deliberately narrow: every signal here can flip the reactor out of and back into `live`, re-firing `entry`. Neither
 * blinks mid-source — the edge can't, because `liveWindowForType` falls back to any resolved track of the type — so
 * `entry` fires once per source without a latch, and a live reload (same source, slid window) correctly doesn't
 * re-command.
 *
 * The flip side: the presentation _url_ is not part of this state, so replacing one already-resolved live presentation
 * with another would stay in `live` and never command a start position for the new source. Unreachable today — every
 * writer sets `{ url }` (unresolved) or `undefined` first, so a source change always transits `inactive`. Supporting a
 * seeded pre-resolved presentation (via `initialState`) that later changes would mean folding the url in here.
 */
function deriveState(mediaElement: HTMLMediaElement | undefined, edge: LiveEdge | null): SeekToLiveEdgeFsmState {
  return mediaElement && edge ? 'live' : 'inactive';
}

function seekToLiveEdgeSetup({
  state,
  context,
  config,
}: {
  state: {
    presentation: ReadonlySignal<SeekToLiveEdgeState['presentation']>;
    startPosition: Signal<SeekToLiveEdgeState['startPosition']>;
    selectedVideoTrackId?: ReadonlySignal<SeekToLiveEdgeState['selectedVideoTrackId']>;
    selectedAudioTrackId?: ReadonlySignal<SeekToLiveEdgeState['selectedAudioTrackId']>;
  };
  context: {
    mediaElement: ReadonlySignal<SeekToLiveEdgeContext['mediaElement']>;
  };
  config?: SeekToLiveEdgeConfig;
}): Reactor<SeekToLiveEdgeFsmState | 'destroying' | 'destroyed'> {
  const derivedStateSignal = computed(() => deriveState(context.mediaElement.get(), getLiveEdge({ state, config })));

  return createMachineReactor<SeekToLiveEdgeFsmState>({
    initial: 'inactive',
    monitor: () => derivedStateSignal.get(),
    states: {
      inactive: {},

      live: {
        // One-time-per-source start position so the loader dispatches an in-window
        // range and preload shows the right frame. The window-exit guard below is
        // the separate, continuous rule. Live-specific — a future DVR mode skips
        // even this first command (starts in place).
        entry: () => {
          // The monitor guarantees a media element + live edge while in `live`.
          const mediaElement = context.mediaElement.get()!;
          const { liveEdgeStart } = getLiveEdge({ state, config })!;
          // Never command backwards: seeding `state.currentTime` behind a playhead
          // already at/past the edge would drag the loaders back.
          if (mediaElement.currentTime >= liveEdgeStart) return;

          state.startPosition.set(liveEdgeStart);
        },

        // Window-exit guard. Repositions to the live edge when the playhead has
        // fallen behind the window start, while playing. Two triggers: this
        // effect's window-update re-fire (it reads the live edge, so each reload
        // re-runs it — catches a stall, where `timeupdate` is silent) and a
        // `play` listener for immediate reactivity on resume.
        effects: () => {
          // Read the live edge first — the only tracked dependency — so window
          // slides keep re-firing this effect even while paused. Bailing before
          // it (on paused) would drop the dependency and the effect would go
          // inert, missing the next slide. The monitor guarantees the edge while
          // in `live`; the media element is read untracked (the window update,
          // not element identity, is the re-fire trigger).
          const { start: windowStart, liveEdgeStart } = getLiveEdge({ state, config })!;
          const mediaElement = peek(context.mediaElement)!;
          const reposition = () => {
            // Don't yank a paused viewer. We deliberately DON'T bail on
            // `mediaElement.seeking`: a seek whose target sits behind the window
            // start can never complete (the data has slid out of the window and
            // been evicted), so `seeking` would stay true forever and strand the
            // playhead — the very stall this guard exists to rescue. The
            // `currentTime < windowStart` test is itself the precise
            // discriminator: an in-window DVR scrub-back lands at
            // `currentTime >= windowStart` and never trips it, so only a stuck
            // out-of-window seek is repositioned.
            if (mediaElement.paused) return;

            if (mediaElement.currentTime < windowStart - REPOSITION_TOLERANCE) {
              mediaElement.currentTime = liveEdgeStart;
            }
          };

          reposition();
          // `play` (not `playing`): a slid-past playhead is at an unseekable
          // position where `playing` would stall and never fire; `play` fires on
          // unpause regardless, so we snap before the stall.
          return listen(mediaElement, 'play', reposition);
        },
      },
    },
  });
}

/**
 * Keep the playhead in the live window, via a two-state reactor gated on the preconditions for "we know where live is":
 *
 * - **`inactive`** — no media element, or no live edge (`getLiveEdge` is `null`: VOD, ended, or unresolved). Idle.
 * - **`live`** — preconditions met. `entry` commands `state.startPosition` once to the target live latency behind the
 *   edge (clamped to the window start) so playback begins near the edge and the loader dispatches an in-window range;
 *   `effects` runs the window-exit guard.
 *
 * A derivable live edge is itself the establishment gate: segment placement is settled at parse time — the reference
 * track's local placement _is_ the presentation timeline, and every other track's first parse is held until the anchor
 * is stamped (`resolve-track`'s gate + `establishStartMediaTime`) — so any window derived from resolved segments is
 * already final, with no separate anchor signal to wait on (see
 * `internal/design/spf/live-presentation-timeline-model.md`).
 *
 * The two pieces split along the axis a future DVR / EVENT mode will care about: the **one-time start position**
 * (`entry`) is the _live-specific_ behavior — start near the edge on load; a DVR mode makes it conditional (start in
 * place). The **window-exit guard** (`effects`) is the _general windowed-live_ behavior — applies to sliding-window
 * live, DVR, and EVENT alike. Because the command is an `entry`, it fires once per entry into `live`; a source change
 * exits to `inactive`, so the next source re-commands (no closure latch to reset). The guard stays a direct seek — it
 * is recurring, while `startPosition` is a self-clearing one-shot.
 *
 * Window-exit guard: while playing (not paused), reposition to the live edge when the playhead has fallen behind the
 * window start — including when a seek to a now-evicted position has stranded the playhead (such a seek can never
 * settle, so we rescue rather than wait on it). Two triggers: the **window-update re-fire** (the guard reads the live
 * edge, so each reload / slide re-runs it — this catches a stall, where `timeupdate` stops but the playlist keeps
 * reloading) and a **`play` listener** for immediate reactivity on resume, since the reload interval can be seconds.
 * `play`, not `playing`: after a long pause the playhead sits behind the window at an unseekable position, where the
 * browser stalls and `playing` never fires; `play` fires on the paused→false transition regardless, so we snap before
 * the stall. In-window pause / DVR scrub-back are left untouched.
 *
 * The latency comes from the injected `resolveLiveLatency` seam (HLS: `HOLD-BACK`), so this behavior carries no
 * delivery-format specifics. `applyStartPosition` performs the seek, gated on `loadedmetadata` — which implies an open
 * MediaSource and hence a declared seekable range (a seek outside `seekable` is clamped) — so this behavior needs no
 * MediaSource precondition of its own.
 *
 * Manual `Behavior<>` literal (like `calculatePresentationDuration`): declares only `presentation` + `startPosition` in
 * stateKeys while reading `selectedVideoTrackId` / `selectedAudioTrackId` defensively (contributed by the switch*
 * behaviors), so it composes without a stateKeys/type conflict.
 */
export const seekToLiveEdge: Behavior<
  {
    presentation: ReadonlySignal<SeekToLiveEdgeState['presentation']>;
    startPosition: Signal<SeekToLiveEdgeState['startPosition']>;
  },
  { mediaElement: ReadonlySignal<SeekToLiveEdgeContext['mediaElement']> },
  SeekToLiveEdgeConfig
> = {
  stateKeys: ['presentation', 'startPosition'],
  contextKeys: ['mediaElement'],
  setup: seekToLiveEdgeSetup,
};
