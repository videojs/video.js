import { isAbortError } from '@videojs/utils/predicate';

import { fetchResolvable, getResponseText } from '../../../network/fetch';
import { type Chapter, type HlsJsonChapters, parseHlsJsonChapters } from '../../hls/parse-json-chapters';
import {
  type AddChaptersTracksOptions,
  addChaptersTracksToMedia,
  removeAllChaptersTracksFromMedia,
} from './chapters-tracks';

/**
 * Fetch and parse one Apple JSON chapters document. Chapters are optional and playback never depends on them, so a
 * document that won't load or won't parse is warned about and yields none.
 */
async function fetchHlsJsonChapters(url: string, signal: AbortSignal): Promise<Chapter[]> {
  try {
    const response = await fetchResolvable({ url }, { signal });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

    // The tag's contract is an Apple JSON chapters document; the parser is
    // written for that shape, and anything else lands in the catch below.
    const document: HlsJsonChapters = JSON.parse(await getResponseText(response));

    // Image URLs resolve against where the document was served from, past redirects.
    return parseHlsJsonChapters(document, response.url || url);
  } catch (error) {
    if (!signal.aborted && !isAbortError(error)) {
      console.warn(`[loadChaptersTracks] Failed to load the chapters document at ${url}`, error);
    }

    return [];
  }
}

/**
 * Load the Apple JSON chapters document at `url` onto `mediaElement` as hidden `<track kind="chapters">` elements, one
 * per title language, via {@link addChaptersTracksToMedia}. Shared by SPF's `loadChapters` behavior and the hls.js and
 * native HLS adapters, so every HLS path produces the same tracks.
 *
 * Aborting `signal` cancels a request in flight and removes the tracks loaded so far. Callers own deduplication — load
 * again only for a different document or element.
 */
export function loadChaptersTracks(
  mediaElement: HTMLMediaElement,
  url: string,
  signal: AbortSignal,
  options: AddChaptersTracksOptions = {}
): void {
  if (signal.aborted) return;

  signal.addEventListener('abort', () => removeAllChaptersTracksFromMedia(mediaElement), { once: true });

  void fetchHlsJsonChapters(url, signal).then((chapters) => {
    // A document that settled before the abort still must not load onto an
    // element that has since been cleaned up.
    if (signal.aborted) return;

    addChaptersTracksToMedia(mediaElement, chapters, options);
  });
}
