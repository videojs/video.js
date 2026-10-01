import { findTrackElement, listen } from '@videojs/utils/dom';

import { createTransitionActor } from '../../../core/actors/create-transition-actor';
import type { Cue } from '../../../media/types';
import type { AddCuesMessage, CueSegmentMeta } from '../../primitives/text-track-messages';
import type { ClearMessage, TextTracksActor, TextTracksActorContext, TextTracksActorMessage } from '../text-tracks';

// Re-export the host-agnostic types so existing dom-side consumers can keep
// importing from this module.
export type {
  AddCuesMessage,
  ClearMessage,
  CueSegmentMeta,
  TextTracksActor,
  TextTracksActorContext,
  TextTracksActorMessage,
};

// =============================================================================
// Helpers
// =============================================================================

function isDuplicateCue(cue: VTTCue, existing: Cue[]): boolean {
  return existing.some((r) => r.startTime === cue.startTime && r.endTime === cue.endTime && r.text === cue.text);
}

// =============================================================================
// Implementation
// =============================================================================

/** TextTrack actor: wraps all text tracks on a media element, owns cue operations. */
export function createTextTracksActor(mediaElement: HTMLMediaElement): TextTracksActor<VTTCue> {
  const pending = new Set<() => void>();
  const clearPending = (): void => {
    for (const cleanup of pending) cleanup();
  };

  const initialContext: TextTracksActorContext = { loaded: {}, segments: {} };
  const actor: TextTracksActor<VTTCue> = createTransitionActor(initialContext, (context, message) => {
    if (message.type === 'clear') {
      clearPending();

      // Reset the cue + segment cache. DOM cleanup is the caller's job —
      // by the time we get here, `syncTextTracks` has already removed
      // the `<track>` children (and their cues) via
      // `removeAllSubtitlesTracksFromMedia`.
      return { loaded: {}, segments: {} };
    }

    // NOTE: Currently assumes cues are applied to a non-disabled TextTrack. Discuss different approaches here, including:
    // - Making the message responsible for auto-selection of the textTrack (changes logic in sync-text-tracks)
    // - Silent gating/console warning + early bail
    // - throwing a domain-specific error
    // - accepting as is (which would result in errors, but also "shouldn't ever happen" unless a bug is introduced)
    // (CJP)
    const { meta, cues } = message;
    const { trackId, id: segmentId, startTime, duration } = meta;
    const textTrack = Array.from(mediaElement.textTracks).find((t) => t.id === trackId);
    if (!textTrack) return context;

    const el = findTrackElement(mediaElement, textTrack);

    if (el && el.readyState < HTMLTrackElement.LOADED) {
      // Even a srcless slot clears native cues during its initial load. Wait
      // for settlement before inserting cues or recording the segment as loaded.
      const settle = (): void => {
        cleanup();

        if (el.parentNode !== mediaElement) return;

        actor.send(message);
      };

      const unlistenLoad = listen(el, 'load', settle);
      const unlistenError = listen(el, 'error', settle);
      const cleanup = (): void => {
        unlistenLoad();
        unlistenError();
        pending.delete(cleanup);
      };

      pending.add(cleanup);
      return context;
    }

    const existingCues = context.loaded[trackId] ?? [];
    const existingSegments = context.segments[trackId] ?? [];
    const prunedCues = cues.filter((cue) => !isDuplicateCue(cue, existingCues));
    const segmentAlreadyLoaded = existingSegments.some((s) => s.id === segmentId);
    if (prunedCues.length === 0 && segmentAlreadyLoaded) return context;

    for (const cue of prunedCues) textTrack.addCue(cue);

    return {
      ...context,
      loaded: {
        ...context.loaded,
        [trackId]: [...existingCues, ...prunedCues],
      },
      segments: segmentAlreadyLoaded
        ? context.segments
        : {
            ...context.segments,
            [trackId]: [...existingSegments, { id: segmentId, startTime, duration }],
          },
    };
  });

  return {
    ...actor,
    destroy(): void {
      clearPending();
      actor.destroy();
    },
  };
}
