/**
 * Parse a VTT segment using browser's native parser.
 *
 * Creates a dummy video element with a track element to leverage the browser's optimized VTT parsing. Returns parsed
 * VTTCue objects.
 */

type ParserCrossOrigin = 'anonymous' | 'use-credentials';

// One dummy video per CORS mode, reused across all parsing. The browser reads
// the parent video's `crossorigin` when it fetches a `<track>`, so sharing one
// video and flipping the attribute would race concurrent loads.
const dummyVideos = new Map<ParserCrossOrigin, HTMLVideoElement>();

function ensureDummyVideo(crossOrigin: ParserCrossOrigin): HTMLVideoElement {
  let video = dummyVideos.get(crossOrigin);

  if (!video) {
    video = document.createElement('video');
    video.muted = true;
    video.preload = 'none';
    video.style.display = 'none';
    video.crossOrigin = crossOrigin;
    dummyVideos.set(crossOrigin, video);
  }

  return video;
}

/**
 * Load and parse one VTT segment. `credentials: 'include'` fetches it in `use-credentials` CORS mode, so cookie-gated
 * cross-origin subtitles load like the rest of the stream; any other mode fetches it `anonymous`.
 */
export function resolveVttSegment(
  url: string,
  { credentials }: { credentials?: RequestCredentials | undefined } = {}
): Promise<VTTCue[]> {
  const video = ensureDummyVideo(credentials === 'include' ? 'use-credentials' : 'anonymous');
  const track = document.createElement('track');

  track.kind = 'subtitles';

  return new Promise((resolve, reject) => {
    const onLoad = (): void => {
      const cues: VTTCue[] = [];
      const textTrack = track.track;

      if (textTrack.cues) {
        for (let i = 0; i < textTrack.cues.length; i++) {
          const cue = textTrack.cues[i];

          if (cue) {
            cues.push(cue as VTTCue);
          }
        }
      }

      cleanup();
      resolve(cues);
    };

    const onError = (): void => {
      cleanup();
      reject(new Error(`Failed to load VTT segment: ${url}`));
    };

    const cleanup = (): void => {
      track.removeEventListener('load', onLoad);
      track.removeEventListener('error', onError);
      video.removeChild(track);
    };

    track.addEventListener('load', onLoad);
    track.addEventListener('error', onError);
    video.appendChild(track);
    // Force the browser to load and parse THIS track's resource by activating
    // it explicitly. Relying on `default = true` only works for the first track
    // appended to the reused dummy video: the media element's automatic
    // text-track selection runs once, so on Firefox every subsequent `<track>`
    // stays inactive, its resource is never fetched, and `load` never fires —
    // stranding all cues past the first segment. Setting `mode = 'hidden'`
    // (active but not rendered — this video is never shown) loads each segment
    // on every browser.
    track.track.mode = 'hidden';
    track.src = url;
  });
}

export function destroyVttResolver(): void {
  dummyVideos.clear();
}
