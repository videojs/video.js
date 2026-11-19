import { isCaptionOrSubtitleTrack } from '@videojs/utils/dom';

import type { PartiallyResolvedTextTrack, TextTrack } from '../../types';

/**
 * SPF-owned `<track>` selector. Each slot created by `addSubtitlesTracksToMedia` carries this attribute so reads and
 * removals can filter SPF-owned tracks from host-page-owned ones.
 */
const SPF_TRACK_SELECTOR = 'track[data-src-track]';

/**
 * Allocate text-track slots on `mediaElement` for each model track by creating and appending `<track>` children. Marks
 * each element with `data-src-track` so it can be distinguished from `<track>` children the host page added directly —
 * used by `getShowingSubtitlesTrackFromMedia` and `removeAllSubtitlesTracksFromMedia` to scope their reads/removals to
 * SPF-owned slots. The spec has no `removeTextTrack` API, so creating `<track>` elements is the only mechanism for
 * adding _and_ removing entries to `mediaElement.textTracks`.
 */
export function addSubtitlesTracksToMedia(
  mediaElement: HTMLMediaElement,
  modelTextTracks: readonly (PartiallyResolvedTextTrack | TextTrack)[]
): void {
  for (const modelTrack of modelTextTracks) {
    const el = document.createElement('track');

    el.id = modelTrack.id;
    el.kind = modelTrack.kind;
    el.label = modelTrack.label;
    el.toggleAttribute('data-src-track', true);

    if (modelTrack.language) el.srclang = modelTrack.language;

    // Deliberately NOT propagating `modelTrack.default` to the `default`
    // attribute: that makes the browser auto-activate the slot on insertion,
    // which fires a `change` that `syncTextTracks` records as user intent —
    // auto-enabling captions past SPF's opt-in policy (`enableDefaultTrack`
    // governs DEFAULT=YES handling in `switchTextTrack`, not the browser). SPF
    // owns selection; these slots are containers, so they carry no selection hint.
    mediaElement.appendChild(el);
  }
}

/**
 * Return the SPF-owned subtitle/caption `TextTrack` currently in `'showing'` mode, or `undefined` if none. Restricts
 * the search to slots created by `addSubtitlesTracksToMedia` (via the `data-src-track` selector) so a showing track
 * that the host page added directly is ignored — SPF selection only mirrors tracks it owns.
 */
export function getShowingSubtitlesTrackFromMedia(mediaElement: HTMLMediaElement): globalThis.TextTrack | undefined {
  const elements = mediaElement.querySelectorAll<HTMLTrackElement>(SPF_TRACK_SELECTOR);

  for (const el of elements) {
    const track = el.track;
    if (track.mode === 'showing' && isCaptionOrSubtitleTrack(track)) return track;
  }

  return undefined;
}

/**
 * Remove every SPF-owned `<track>` child from `mediaElement` (those tagged with `data-src-track` by
 * `addSubtitlesTracksToMedia`). `<track>` elements the host page added directly are left in place.
 */
export function removeAllSubtitlesTracksFromMedia(mediaElement: HTMLMediaElement): void {
  const elements = mediaElement.querySelectorAll<HTMLTrackElement>(SPF_TRACK_SELECTOR);

  for (const el of elements) {
    el.remove();
  }
}

/**
 * Make the media element render the cues of a track that just became the showing one.
 *
 * SPF slots have no `src`, so their load fails. WebKit only hands a re-enabled track's cues back to the media element
 * when its `<track>` loaded, so a slot turned off and on again keeps its cues but renders none — and because the cues
 * are still cached as loaded, seeking back into their range never restores them. Adding a cue the track already holds
 * is a no-op in WebKit, so each cue is removed before it is added back.
 */
export function refreshTextTrackCues(track: globalThis.TextTrack): void {
  for (const cue of Array.from(track.cues ?? [])) {
    track.removeCue(cue);
    track.addCue(cue);
  }
}

/**
 * Apply a selection to a `TextTrackList` by setting each subtitle/caption track's `mode` to `'showing'` if its `id`
 * matches `selectedId` and `'disabled'` otherwise. Tracks of other kinds (chapters, metadata, descriptions) are left
 * untouched — they may be owned by the host page.
 */
export function syncTextTrackModes(textTracks: TextTrackList, selectedId: string | undefined): void {
  for (let i = 0; i < textTracks.length; i++) {
    const track = textTracks[i]!;
    if (!isCaptionOrSubtitleTrack(track)) continue;

    track.mode = track.id === selectedId ? 'showing' : 'disabled';
  }
}
