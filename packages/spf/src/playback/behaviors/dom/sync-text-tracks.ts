/**
 * **Own the text-track slots on the host media element, mirroring the SPF model.** When a presentation is resolved and
 * a media element is available, allocate one slot in `mediaElement.textTracks` per model text track — via creating
 * `<track>` children, since that's the only spec mechanism for adding _and_ removing entries to `textTracks` (no
 * `removeTextTrack` API exists). Once slots are provisioned, mirror the resolved `selectedTextTrackId` into their
 * `mode`s (one-way: state → DOM), and propagate user-initiated DOM `change` events back to `userTextTrackSelection` —
 * the standing _intent_ (a language-based partial, or `'off'`) that `switchTextTrack` resolves into
 * `selectedTextTrackId`. So non-SPF consumers (host-page captions buttons, browser native UI, video.js store) drive
 * selection by expressing intent, not by writing the resolved id.
 *
 * Single-positive-state reactor (`'preconditions-unmet'` ↔ `'sync-active'`): an element-bound effect allocates the
 * slots, applies the initial selection, attaches the `change` listener, and opens a brief Chromium settling-window
 * guard, with paired cleanup on element replacement or state exit. A separate effect mirrors subsequent
 * `selectedTextTrackId` changes into `mode`s without reallocating the slots.
 *
 * State-exit cleanup also sends a `'clear'` message to the `TextTracksActor` so its cue+segment cache (keyed by
 * trackId) is dropped alongside the DOM `<track>` slots. The actor itself is owned by `setupTextTrackActors` and bound
 * to mediaElement, not presentation, so it survives source resets; clearing its context here keeps the cache consistent
 * with the DOM. Without this, a subsequent presentation reusing a trackId would have `getSegmentsToLoad` treat its
 * segments as already-buffered and skip loading them.
 *
 * Single-writer separation: `selectedTextTrackId` is the resolved _output_ owned solely by `switchTextTrack`; this
 * behavior only reads it (to mirror modes). The write path here is `userTextTrackSelection` — the user-intent _input_ —
 * so DOM action and the resolver never contend for one slot. The intent isn't cleared on source unload (it's a standing
 * preference, like `userAudioTrackSelection`); `'off'` is written when the user disables all tracks via native UI.
 *
 * Echo guard: `selectedTextTrackId` is exactly the id this behavior last drove into the DOM, so a `change` event still
 * showing it is our own echo (or a resolver-driven correction — e.g. the picked track's CDN failed and the resolver
 * disabled it) and is ignored, never written back as a spurious user action. Only a showing id that _differs_ from the
 * resolved id is a real user pick. The settling-window guard additionally swallows Chromium's init-time auto-selection
 * before the resolved selection has settled.
 */

import { listen } from '@videojs/utils/dom';

import { defineBehavior } from '../../../core/composition/create-composition';
import type { Reactor } from '../../../core/reactors/create-machine-reactor';
import { createMachineReactor } from '../../../core/reactors/create-machine-reactor';
import { computed, peek, type ReadonlySignal, type Signal } from '../../../core/signals/primitives';
import { syncTextTrackModes } from '../../../media/dom/text/text-track-slots';
import type { MaybeResolvedPresentation, PartiallyResolvedTextTrack, TextTrack } from '../../../media/types';
import { getTracksByType } from '../../../media/utils/tracks';
import type { TextTracksActor } from '../../actors/text-tracks';

type SyncTextTracksFsmState = 'preconditions-unmet' | 'sync-active';

export interface SyncTextTracksConfig {
  /**
   * Create and append SPF-owned `<track>` slots on `mediaElement`, one per model text track. Implementation tags each
   * element so the read/remove helpers can scope to SPF-owned slots. **Required** — the behavior is DOM-binding-neutral
   * and the composing engine supplies the integration.
   */
  addSubtitlesTracksToMedia: (
    mediaElement: HTMLMediaElement,
    modelTextTracks: readonly (PartiallyResolvedTextTrack | TextTrack)[]
  ) => void;
  /**
   * Return the SPF-owned subtitle/caption `TextTrack` currently in `'showing'` mode, or `undefined` if none. Used by
   * the DOM `change` bridge to mirror native-UI selection back into `selectedTextTrackId`.
   */
  getShowingSubtitlesTrackFromMedia: (mediaElement: HTMLMediaElement) => globalThis.TextTrack | undefined;
  /**
   * Remove every SPF-owned `<track>` child from `mediaElement`. Called on element replacement or state exit (source
   * unload, behavior destroy) to evict slots.
   */
  removeAllSubtitlesTracksFromMedia: (mediaElement: HTMLMediaElement) => void;
}

function deriveState(
  presentation: MaybeResolvedPresentation | undefined,
  mediaElement: HTMLMediaElement | undefined
): SyncTextTracksFsmState {
  if (!mediaElement || !presentation) return 'preconditions-unmet';

  return getTracksByType(presentation, 'text').length > 0 ? 'sync-active' : 'preconditions-unmet';
}

/**
 * Map the DOM-showing track back to standing user intent. No showing track is an explicit `'off'`. Otherwise prefer a
 * language-based partial (so the pick persists across source changes); fall back to `{ id }` for a track without a
 * language (precise within a source, just not portable).
 */
function deriveTextTrackIntent(
  showingId: string | undefined,
  modelTextTracks: readonly (PartiallyResolvedTextTrack | TextTrack)[]
): Partial<TextTrack> | 'off' {
  if (!showingId) return 'off';

  const language = modelTextTracks.find((track) => track.id === showingId)?.language;

  return language ? { language } : { id: showingId };
}

function syncTextTracksSetup({
  state,
  context,
  config,
}: {
  state: {
    presentation: ReadonlySignal<MaybeResolvedPresentation | undefined>;
    // Read-only here: the resolved output owned by `switchTextTrack`, mirrored
    // into DOM modes and used as the echo-guard reference.
    selectedTextTrackId: ReadonlySignal<string | undefined>;
    // The write path: standing user intent the DOM bridge feeds.
    userTextTrackSelection: Signal<Partial<TextTrack> | 'off' | undefined>;
  };
  context: {
    mediaElement: ReadonlySignal<HTMLMediaElement | undefined>;
    textTracksActor: ReadonlySignal<TextTracksActor<VTTCue> | undefined>;
  };
  config: SyncTextTracksConfig;
}): Reactor<SyncTextTracksFsmState | 'destroying' | 'destroyed'> {
  const { addSubtitlesTracksToMedia, getShowingSubtitlesTrackFromMedia, removeAllSubtitlesTracksFromMedia } = config;

  const derivedStateSignal = computed(() => deriveState(state.presentation.get(), context.mediaElement.get()));

  return createMachineReactor<SyncTextTracksFsmState>({
    initial: 'preconditions-unmet',
    monitor: () => derivedStateSignal.get(),
    states: {
      'preconditions-unmet': {},

      'sync-active': {
        effects: [
          // Track element identity so replacement detaches and evicts the old
          // slots before provisioning the new element. Presentation updates
          // and selection changes must not reallocate slots within this state.
          () => {
            const mediaElement = context.mediaElement.get();
            const presentation = peek(state.presentation);
            // Disposed effects reorder the shared watcher, so this can run before
            // the monitor leaves the state; recheck the inputs it tracks.
            if (!mediaElement || !presentation) return;

            // SAFETY: getTracksByType filters selection sets to text tracks;
            // its declared return type is the wider track union.
            const modelTextTracks = getTracksByType(presentation, 'text') as readonly (
              | PartiallyResolvedTextTrack
              | TextTrack
            )[];

            addSubtitlesTracksToMedia(mediaElement, modelTextTracks);
            // Apply our selection synchronously so the change-event tasks
            // these mode writes queue land in the macrotask queue *before*
            // the settling-close `setTimeout(0)` queued below. This keeps
            // the settling window open long enough to swallow Chromium's
            // own auto-selection task (also scheduled in the next tick after
            // `<track>` insertion); if the order flipped, our handler would
            // treat Chromium's auto-pick as a user action. The separate
            // effect below handles subsequent `selectedTextTrackId` changes.
            syncTextTrackModes(mediaElement.textTracks, peek(state.selectedTextTrackId));

            // Chromium re-applies its own selection across the next task tick
            // after `<track>` insertion (default-track auto-pick, language
            // preference). During this window, the `change` event may fire
            // with browser-chosen modes that don't reflect a real user action;
            // re-apply our modes silently rather than writing them back.
            let inSettlingWindow = true;
            const settlingTimeout = setTimeout(() => {
              inSettlingWindow = false;
            }, 0);

            const onChange = (): void => {
              if (inSettlingWindow) {
                syncTextTrackModes(mediaElement.textTracks, state.selectedTextTrackId.get());
                return;
              }

              const showingTrack = getShowingSubtitlesTrackFromMedia(mediaElement);
              // `showingTrack.id` matches the SPF id we set when the slot was
              // allocated. Empty-string ids fall through to `undefined`.
              const showingId = showingTrack?.id || undefined;
              // Echo guard: selectedTextTrackId is the id we last drove into the
              // DOM (mirror / resolver correction). A change still showing it is our
              // own echo — ignore it rather than write spurious intent.
              if (showingId === state.selectedTextTrackId.get()) return;

              // Genuine user action → write intent (resolved into selectedTextTrackId
              // by switchTextTrack), not the resolved id.
              state.userTextTrackSelection.set(deriveTextTrackIntent(showingId, modelTextTracks));
            };

            const unlisten = listen(mediaElement.textTracks, 'change', onChange);

            return () => {
              unlisten();
              clearTimeout(settlingTimeout);
              removeAllSubtitlesTracksFromMedia(mediaElement);
              // Clear the TextTracksActor's cue+segment cache, which is
              // keyed by trackId. If we don't, a subsequent presentation
              // reusing a trackId would have `getSegmentsToLoad` treat its
              // segments as already-buffered. The DOM cleanup above
              // already evicted the live cues; this drops the cache that
              // tracked them. The actor itself is owned by
              // `setupTextTrackActors` (mediaElement-bound lifecycle), so
              // we send rather than destroy.
              peek(context.textTracksActor)?.send({ type: 'clear' });
            };
          },

          // The lifecycle effect applies the initial selection on element
          // replacement; this effect only mirrors subsequent selection changes.
          () => {
            const mediaElement = peek(context.mediaElement)!;

            syncTextTrackModes(mediaElement.textTracks, state.selectedTextTrackId.get());
          },
        ],
      },
    },
  });
}

export const syncTextTracks = defineBehavior({
  stateKeys: ['presentation', 'selectedTextTrackId', 'userTextTrackSelection'],
  contextKeys: ['mediaElement', 'textTracksActor'],
  setup: syncTextTracksSetup,
});
