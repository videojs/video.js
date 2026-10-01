/**
 * **Project Apple JSON chapters onto the host media element.** When the resolved presentation carries an
 * `#EXT-X-SESSION-DATA` entry for `com.apple.hls.chapters`, fetch the document it points at, parse it, and add one
 * hidden `<track kind="chapters">` per title language — cues and all — to `mediaElement`. The element is the store:
 * there is no chapters state signal, exactly as subtitle cues live on their DOM tracks and nowhere else. Consumers
 * (video.js's textTrack feature, a host page) read the first chapters track's `cues` the way they would an authored
 * `<track>`.
 *
 * Single-positive-state reactor (`'preconditions-unmet'` ↔ `'loading'`), gated on a media element, a resolved
 * presentation, and a chapters entry with a URI. An element-bound effect fetches and projects; the returned cleanup
 * aborts an in-flight fetch and removes the tracks on element replacement or state exit (source unload, destroy). The
 * document leaves the last chapter open; it is written with `OPEN_CHAPTER_END` and never amended — a consumer that
 * wants it to end where the media ends clamps to the media duration on read (video.js's textTrack feature does), so
 * nothing here waits for, or chases, a duration.
 *
 * Failures are never fatal: a document that won't load or won't parse is warned about and projects nothing. An entry
 * carrying its data inline as `VALUE` is skipped — chapters are a document, not a string. Exactly one document is
 * assumed: Apple carries every language inside it, so the first entry with a URI is the one read.
 *
 * The tracks carry `data-src-chapters-track`, distinct from the subtitle tracks' tag, so neither cleanup removes the
 * other's. A `<track kind="chapters">` the host page authored precedes these in `textTracks` (tree order), so a page
 * that supplies its own chapters keeps them. On a Mux source this document is the same one the Mux adapter reads for
 * the asset title; the request is cacheable, and each side stays ignorant of the other.
 */

import { isAbortError } from '@videojs/utils/predicate';

import { defineBehavior } from '../../../core/composition/create-composition';
import type { Reactor } from '../../../core/reactors/create-machine-reactor';
import { createMachineReactor } from '../../../core/reactors/create-machine-reactor';
import { computed, peek, type ReadonlySignal } from '../../../core/signals/primitives';
import { addChaptersTracksToMedia, removeAllChaptersTracksFromMedia } from '../../../media/dom/text/chapters-tracks';
import {
  APPLE_HLS_CHAPTERS_DATA_ID,
  type Chapter,
  type HlsJsonChapters,
  parseHlsJsonChapters,
} from '../../../media/hls/parse-json-chapters';
import type { TextSelectionConfig } from '../../../media/primitives/select-tracks';
import { getSessionData, isResolvedPresentation, type MaybeResolvedPresentation } from '../../../media/types';
import { fetchResolvableText } from '../../../network/fetch';

type LoadChaptersFsmState = 'preconditions-unmet' | 'loading';

/** The chapters track for `preferredSubtitleLanguage` leads, when the document titles chapters in it. */
export type LoadChaptersConfig = Pick<TextSelectionConfig, 'preferredSubtitleLanguage'>;

function deriveState(
  presentation: MaybeResolvedPresentation | undefined,
  mediaElement: HTMLMediaElement | undefined
): LoadChaptersFsmState {
  if (!mediaElement || !isResolvedPresentation(presentation)) return 'preconditions-unmet';

  return findChaptersDocument(presentation) === undefined ? 'preconditions-unmet' : 'loading';
}

/** The URI of the chapters document — the first `com.apple.hls.chapters` entry that points at one. */
function findChaptersDocument(presentation: MaybeResolvedPresentation): string | undefined {
  return getSessionData(presentation, APPLE_HLS_CHAPTERS_DATA_ID).find((entry) => entry.uri !== undefined)?.uri;
}

/** Fetch and parse one chapters document; a failure other than our own abort is warned about and yields nothing. */
async function loadChaptersDocument(uri: string, signal: AbortSignal): Promise<Chapter[]> {
  try {
    const text = await fetchResolvableText({ url: uri }, { signal });
    // The tag's contract is an Apple JSON chapters document; the parser is
    // written for that shape, and anything else lands in the catch below.
    const document: HlsJsonChapters = JSON.parse(text);

    return parseHlsJsonChapters(document, uri);
  } catch (error) {
    if (!isAbortError(error)) console.warn(`[loadChapters] Failed to load the chapters document at ${uri}`, error);

    return [];
  }
}

function loadChaptersSetup({
  state,
  context,
  config,
}: {
  state: { presentation: ReadonlySignal<MaybeResolvedPresentation | undefined> };
  context: { mediaElement: ReadonlySignal<HTMLMediaElement | undefined> };
  config: LoadChaptersConfig;
}): Reactor<LoadChaptersFsmState | 'destroying' | 'destroyed'> {
  const derivedStateSignal = computed(() => deriveState(state.presentation.get(), context.mediaElement.get()));

  return createMachineReactor<LoadChaptersFsmState>({
    initial: 'preconditions-unmet',
    monitor: () => derivedStateSignal.get(),
    states: {
      'preconditions-unmet': {},

      loading: {
        // Track element identity to abort and remove the old projection on
        // replacement. Presentation updates within this state must not refetch.
        effects: () => {
          const mediaElement = context.mediaElement.get();
          const presentation = peek(state.presentation);
          const uri = presentation && findChaptersDocument(presentation);
          // Disposed effects reorder the shared watcher, so this can run before
          // the monitor leaves the state; recheck the inputs it reads.
          if (!mediaElement || !uri) return;

          const controller = new AbortController();

          void loadChaptersDocument(uri, controller.signal).then((chapters) => {
            // A document that settled before the abort still must not project
            // onto a media element the state has since left.
            if (controller.signal.aborted) return;

            addChaptersTracksToMedia(mediaElement, chapters, { preferredLanguage: config.preferredSubtitleLanguage });
          });

          return () => {
            controller.abort();
            removeAllChaptersTracksFromMedia(mediaElement);
          };
        },
      },
    },
  });
}

export const loadChapters = defineBehavior({
  stateKeys: ['presentation'],
  contextKeys: ['mediaElement'],
  setup: loadChaptersSetup,
});
