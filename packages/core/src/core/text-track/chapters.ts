import type { MediaTextCue } from '@videojs/media';
import { isNumber, isObject, isString, isUndefined } from '@videojs/utils/predicate';

import type { TextCueInit } from './app';
import { defineTextTrack, type TextTrackDefinition } from './definition';

/**
 * An image for a chapter, such as its artwork or a thumbnail.
 *
 * @experimental
 */
export interface ChapterImage {
  url: string;
  width?: number | undefined;
  height?: number | undefined;
}

/**
 * What a chapter can carry beyond its title, from Apple HLS, Podcasting 2.0, or JSON-LD chapters. The cue's `text`
 * holds the title shown.
 *
 * @experimental
 */
export interface ChapterCueValue {
  description?: string | undefined;
  url?: string | undefined;
  images?: ChapterImage[] | undefined;
  /** Titles by language, when the source has several. */
  titles?: Record<string, string> | undefined;
}

/**
 * Every chapters track, with cue values typed as {@link ChapterCueValue}.
 *
 * ```ts
 * const [chapter] = getActiveTextCues(player.store, chaptersTrack);
 * const image = chapter?.value?.images?.[0]?.url;
 * ```
 *
 * @experimental
 */
export const chaptersTrack: TextTrackDefinition<MediaTextCue<ChapterCueValue>> = defineTextTrack<ChapterCueValue>({
  kind: 'chapters',
});

/**
 * Chapters from a [Podcasting 2.0 JSON chapters](https://github.com/Podcastindex-org/podcast-namespace) file, given its
 * text or its parsed JSON, so it also reads a track's `src` as its `format`. Chapters marked `toc: false` are left out,
 * since they aren't meant to be shown.
 *
 * ```ts
 * player.store.addTextTrack({ kind: 'chapters', src: '/chapters.json', format: podcastChapters });
 * ```
 *
 * @experimental
 */
export function podcastChapters(file: unknown): TextCueInit<ChapterCueValue>[] {
  const json: unknown = isString(file) ? JSON.parse(file) : file;
  const chapters = isObject(json) && 'chapters' in json && Array.isArray(json.chapters) ? json.chapters : [];

  return chapters.filter(isRecord).flatMap((chapter) => {
    if (!isNumber(chapter.startTime) || chapter.toc === false) return [];

    return [
      {
        startTime: chapter.startTime,
        endTime: isNumber(chapter.endTime) ? chapter.endTime : undefined,
        text: isString(chapter.title) ? chapter.title : '',
        value: compact({
          url: isString(chapter.url) ? chapter.url : undefined,
          images: isString(chapter.img) ? [{ url: chapter.img }] : undefined,
        }),
      },
    ];
  });
}

/**
 * Chapters from an Apple HLS chapters file, the JSON an `EXT-X-SESSION-DATA` tag with
 * `DATA-ID="com.apple.hls.chapters"` points to, given its text or its parsed JSON. Each cue shows the chapter's first
 * title, and keeps every title by language.
 *
 * @experimental
 */
export function appleHlsChapters(file: unknown): TextCueInit<ChapterCueValue>[] {
  const json: unknown = isString(file) ? JSON.parse(file) : file;
  const chapters = Array.isArray(json) ? json : [];

  return chapters.filter(isRecord).flatMap((chapter) => {
    const startTime = chapter['start-time'];
    if (!isNumber(startTime)) return [];

    const duration = chapter.duration;
    const titles = (Array.isArray(chapter.titles) ? chapter.titles : []).filter(isRecord);
    const images = (Array.isArray(chapter.images) ? chapter.images : []).filter(isRecord);

    return [
      {
        startTime,
        endTime: isNumber(duration) ? startTime + duration : undefined,
        text: titles.map(({ title }) => title).find(isString) ?? '',
        value: compact({
          titles: titles.length
            ? Object.fromEntries(
                titles.flatMap(({ language, title }) =>
                  isString(title) ? [[isString(language) ? language : 'und', title]] : []
                )
              )
            : undefined,
          images: images.length
            ? images.flatMap((image) =>
                isString(image.url)
                  ? [
                      compact({
                        url: image.url,
                        width: isNumber(image['pixel-width']) ? image['pixel-width'] : undefined,
                        height: isNumber(image['pixel-height']) ? image['pixel-height'] : undefined,
                      }),
                    ]
                  : []
              )
            : undefined,
        }),
      },
    ];
  });
}

/**
 * Chapters from JSON-LD, as text or parsed: a schema.org `VideoObject` whose `hasPart` lists `Clip`s, a list of
 * `Clip`s, or one `Clip`. These are the clips Google shows as key moments.
 *
 * ```ts
 * player.store.addTextTrack({ kind: 'chapters', cues: jsonLdChapters(videoObject) });
 * ```
 *
 * @experimental
 */
export function jsonLdChapters(file: unknown): TextCueInit<ChapterCueValue>[] {
  const json: unknown = isString(file) ? JSON.parse(file) : file;
  const clips = isRecord(json) && 'hasPart' in json ? json.hasPart : json;

  return (Array.isArray(clips) ? clips : [clips]).filter(isRecord).flatMap((clip) => {
    const startTime = toSeconds(clip.startOffset);
    if (startTime === undefined) return [];

    const thumbnail = Array.isArray(clip.thumbnailUrl) ? clip.thumbnailUrl[0] : clip.thumbnailUrl;

    return [
      {
        startTime,
        endTime: toSeconds(clip.endOffset),
        text: isString(clip.name) ? clip.name : '',
        value: compact({
          description: isString(clip.description) ? clip.description : undefined,
          url: isString(clip.url) ? clip.url : undefined,
          images: isString(thumbnail) ? [{ url: thumbnail }] : undefined,
        }),
      },
    ];
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return isObject(value) && !Array.isArray(value);
}

/** Schema.org offsets are numbers of seconds, sometimes written as strings. */
function toSeconds(value: unknown): number | undefined {
  const seconds = isString(value) ? Number(value) : value;

  return isNumber(seconds) && Number.isFinite(seconds) ? seconds : undefined;
}

/** The object without its `undefined` fields, so values stay plain JSON. */
function compact<Value extends object>(value: Value): Value {
  return Object.fromEntries(Object.entries(value).filter(([, field]) => !isUndefined(field))) as Value;
}
