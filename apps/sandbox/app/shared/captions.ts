import type { MediaLike } from './media-element';

/** How many subtitle tracks the page adds to a video: none, one, or two, which is what fills a captions menu. */
export const CAPTIONS_MODES = ['none', 'single', 'multiple'] as const;
export type CaptionsMode = (typeof CAPTIONS_MODES)[number];

const CAPTIONS_SRC = new URL('./captions.vtt?no-inline', import.meta.url).href;

const TRACKS = [
  { label: 'English', lang: 'en' },
  { label: 'Spanish', lang: 'es' },
] as const;

export function captionTracks(mode: CaptionsMode): readonly { readonly label: string; readonly lang: string }[] {
  if (mode === 'none') return [];

  return mode === 'single' ? TRACKS.slice(0, 1) : TRACKS;
}

/**
 * Add the sandbox's subtitle tracks to a media component, replacing the ones a previous render added. A media component
 * reads its tracks when it upgrades, so markup should receive them while still inert; see `findMediaTag`.
 */
export function applyCaptionTracks(media: MediaLike | Element, mode: CaptionsMode): void {
  for (const stale of media.querySelectorAll('track[data-sandbox-captions]')) stale.remove();

  for (const { label, lang } of captionTracks(mode)) {
    const track = document.createElement('track');

    track.kind = 'subtitles';
    track.label = label;
    track.srclang = lang;
    track.src = CAPTIONS_SRC;
    track.dataset.sandboxCaptions = '';
    media.append(track);
  }
}
