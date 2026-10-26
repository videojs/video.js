/** One section of a title on its single timeline. LibriVox calls these sections; listeners call them chapters. */
export interface AudiobookChapter {
  index: number;
  title: string;
  /** Media time, in seconds. */
  start: number;
  end: number;
  /** Who reads it. Collaborative LibriVox titles change reader every chapter. */
  readers: readonly string[];
}

/** A public-domain title, stitched into one Mux audio asset so every chapter sits on one clock. */
export interface Audiobook {
  /** Stable key for progress and bookmarks: `librivox:<id>`. */
  id: string;
  title: string;
  authors: readonly string[];
  readers: readonly string[];
  year: string;
  description: string;
  /** Cover art, from the archive.org item. */
  cover: string;
  /** Mux public playback ID of the stitched asset. */
  playbackId: string;
  /** Seconds, from the stitched file. */
  duration: number;
  chapters: readonly AudiobookChapter[];
  links: {
    librivox: string;
    archive: string;
    text: string;
  };
}

/** The archive.org item thumbnail: smaller than the cover, but served from a path that never 500s. */
export function audiobookCoverFallback(book: Pick<Audiobook, 'links'>): string {
  return `https://archive.org/services/img/${book.links.archive.split('/details/')[1] ?? ''}`;
}

/** The HLS source for a title. Mux serves the same stream to every platform. */
export function audiobookSrc(book: Pick<Audiobook, 'playbackId'>): string {
  return `https://stream.mux.com/${book.playbackId}.m3u8`;
}

/** Mux audio-only static rendition, for a "download for offline" affordance. */
export function audiobookDownloadUrl(book: Pick<Audiobook, 'playbackId'>): string {
  return `https://stream.mux.com/${book.playbackId}/audio.m4a`;
}

function vttTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = (seconds % 60).toFixed(3).padStart(6, '0');

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${rest}`;
}

/**
 * The chapters as a WebVTT chapters document, the form a `<track kind="chapters">` takes and the form a Mux chapters
 * text track takes. The player reads chapters off the media, so the book never has to be threaded into the store.
 */
export function audiobookChaptersVtt(book: Pick<Audiobook, 'chapters'>): string {
  const cues = book.chapters.map(
    (chapter) => `${chapter.index + 1}\n${vttTime(chapter.start)} --> ${vttTime(chapter.end)}\n${chapter.title}\n`
  );

  return `WEBVTT\n\n${cues.join('\n')}`;
}

/** Which chapter holds a media time; the last one past the end. */
export function chapterAt(chapters: readonly AudiobookChapter[], time: number): AudiobookChapter | undefined {
  let found: AudiobookChapter | undefined;

  for (const chapter of chapters) {
    if (chapter.start <= time) found = chapter;
    else break;
  }

  return found;
}
