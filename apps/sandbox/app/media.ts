import {
  BACKGROUND_VIDEO_SRC,
  CLOUDFLARE_VIDEO_SRC,
  DASH_SOURCE_IDS,
  DEFAULT_BACKGROUND_SOURCE,
  DEFAULT_DASH_SOURCE,
  HLS_SOURCE_IDS,
  MUX_SOURCE_IDS,
  MUX_SPF_SOURCE_IDS,
  NON_DASH_SOURCE_IDS,
  type SandboxSource,
  SHAKA_SOURCE_IDS,
  SOURCE_IDS,
  type SourceId,
  SOURCES,
  SPF_HLS_SOURCE_IDS,
  SPOTIFY_AUDIO_SRC,
  TIKTOK_VIDEO_SRC,
  TWITCH_VIDEO_SRC,
  VIMEO_VIDEO_SRC,
  WISTIA_VIDEO_SRC,
  YOUTUBE_VIDEO_SRC,
} from './shared/sources';
import type { Platform } from './types';

/** The player a media mounts in. The live video and audio players take over when `live` is set and the source is. */
export type MediaPlayer = 'video' | 'audio' | 'background';

/**
 * One media engine the sandbox can demo: what it is called, where it mounts, and how the shell constrains the other
 * selections around it. The html and react platforms have a template per entry named `<platform>-<id>`; the CDN page
 * picks its bundles by the same id.
 */
export interface MediaDescriptor {
  readonly label: string;
  readonly player: MediaPlayer;
  /** The element the media renders as, which is also the name of its CDN bundle. */
  readonly tag: string;
  /** The live player and skin variants apply while the selected source is live. */
  readonly live?: true;
  /** Hands playback to a third-party player in a cross-origin frame, so the settings menu has nothing to attach to. */
  readonly embed?: true;
  /** One URL the media always plays, in place of the source picker. */
  readonly fixedSource?: string;
  /** Sources the picker offers. */
  readonly sources: readonly SourceId[];
  /** Sources the picker offers on the CDN page, which builds elements from attributes alone. */
  readonly cdnSources?: readonly SourceId[];
  /** Where the picker falls back when the current source is not offered. */
  readonly fallbackSource?: SourceId;
  /** Where the picker lands whenever this media is entered without an explicit source. */
  readonly entrySource?: SourceId;
  /** What the media will do with a source, when that is worth labelling for someone smoke-testing. */
  readonly outcome?: (source: SandboxSource) => string | undefined;
}

/**
 * Any HLS source, including formats the SPF engine can't play — reaching those failures on purpose is how the error
 * paths get smoke-tested. The empty-src entry carries no media, so it is offered wherever the media can render one.
 */
const SPF_MEDIA_SOURCE_IDS = SPF_HLS_SOURCE_IDS.filter(
  (id) => SOURCES[id].type === 'hls' || SOURCES[id].type === 'none'
);

/**
 * The plain HLS media are the SPF engine reached through `<hls-video>`: no TS transmux pipeline, so MPEG-TS is refused
 * on format. DRM it does license, from the same `source.drm` the Mux flavor reads — what varies is whether the browser
 * has a CDM for the key systems a source names. Derived from the pair rather than stored on the source, since every
 * source here plays fine under some other media.
 *
 * The video and audio-only variants answer differently, and a note promising the wrong outcome is worse than none — a
 * reviewer would file the difference as a bug:
 *
 * - **DRM.** Mux encrypts video renditions and leaves audio clear. The audio-only engine resolves only the audio
 *   rendition, so it never fetches an encrypted playlist and plays the source instead of refusing it. Only the
 *   unlicensed asset reaches these media; the licensable two are Mux-media only.
 * - **MPEG-TS.** Under audio-only, which specific failure depends on whether the source carries an audio rendition of its
 *   own or muxes audio into its video renditions — an absent type reports nothing and stalls silently rather than
 *   surfacing a verdict (see `internal/design/spf/features/errors.md`). Both mean nothing plays, so the note stops at
 *   that rather than naming a verdict that only appears for one of them.
 */
function spfOutcome(audioOnly: boolean) {
  return (source: SandboxSource): string | undefined => {
    if (source.drm) {
      // A source naming license servers is licensable here now that `<hls-video>`
      // takes a structured source; whether it plays is then the browser's CDM.
      if (!source.source?.drm) return 'expects protected error';

      return audioOnly ? 'plays if its audio is clear' : 'plays where the browser has the CDM';
    }

    if (source.subType && source.subType !== 'mp4') {
      return audioOnly ? 'expects no playback' : 'expects unsupported-format error';
    }

    return undefined;
  };
}

/**
 * The background media are the same engine again, error surface included: `collectErrors` is composed, the one-shot
 * selection carries capability constraints, and the adapter promotes the first fatal condition. Nothing reaches the
 * media element even so — MPEG-TS and encryption both leave `HTMLMediaElement.error` null, measured on Chromium and
 * WebKit — so that promoted condition is the only signal there is. Kept apart from the plain HLS note because this
 * composition's fatal set is wider: it is video-only, so an absent video type is fatal here too.
 */
function backgroundOutcome(source: SandboxSource): string | undefined {
  if (source.drm) return 'expects protected error';

  if (source.subType && source.subType !== 'mp4') return 'expects unsupported-format error';

  return undefined;
}

const MEDIA_MAP = {
  video: { label: 'Video', player: 'video', tag: 'video', sources: NON_DASH_SOURCE_IDS },
  // `<mux-video>` is the only media that turns a Mux DRM token into license URLs; the HLS media take license servers
  // through `source.drm`, whichever path they play. The CDN page builds elements from attributes alone, so neither
  // reaches it.
  'hlsjs-video': {
    label: 'HLS Video (hls.js)',
    player: 'video',
    tag: 'hlsjs-video',
    live: true,
    sources: HLS_SOURCE_IDS,
    cdnSources: NON_DASH_SOURCE_IDS,
  },
  'native-hls-video': {
    label: 'Native HLS Video',
    player: 'video',
    tag: 'native-hls-video',
    live: true,
    sources: HLS_SOURCE_IDS,
    cdnSources: NON_DASH_SOURCE_IDS,
  },
  'mux-video': {
    label: 'Mux Video',
    player: 'video',
    tag: 'mux-video',
    live: true,
    sources: MUX_SOURCE_IDS,
    cdnSources: NON_DASH_SOURCE_IDS,
  },
  'mux-video-spf': {
    label: 'Mux Video (SPF)',
    player: 'video',
    tag: 'mux-video',
    live: true,
    sources: MUX_SPF_SOURCE_IDS,
    cdnSources: SPF_HLS_SOURCE_IDS,
  },
  'mux-audio': {
    label: 'Mux Audio',
    player: 'audio',
    tag: 'mux-audio',
    live: true,
    sources: MUX_SOURCE_IDS,
    cdnSources: NON_DASH_SOURCE_IDS,
  },
  'mux-audio-spf': {
    label: 'Mux Audio (SPF)',
    player: 'audio',
    tag: 'mux-audio',
    live: true,
    sources: MUX_SPF_SOURCE_IDS,
    cdnSources: SPF_HLS_SOURCE_IDS,
  },
  'hls-video': {
    label: 'HLS Video',
    player: 'video',
    tag: 'hls-video',
    live: true,
    sources: SPF_MEDIA_SOURCE_IDS,
    outcome: spfOutcome(false),
  },
  'hls-audio': {
    label: 'HLS Audio',
    player: 'audio',
    tag: 'hls-audio',
    live: true,
    sources: SPF_MEDIA_SOURCE_IDS,
    outcome: spfOutcome(true),
  },
  'dash-video': {
    label: 'DASH Video',
    player: 'video',
    tag: 'dash-video',
    sources: DASH_SOURCE_IDS,
    fallbackSource: DEFAULT_DASH_SOURCE,
  },
  // Shaka plays DASH and HLS from the same element, so it is the one media offered both.
  'shaka-video': { label: 'Shaka Video', player: 'video', tag: 'shaka-video', sources: SHAKA_SOURCE_IDS },
  audio: { label: 'Audio', player: 'audio', tag: 'audio', sources: SOURCE_IDS },
  // `<background-video>` hands a progressive MP4 to the browser, so its source stays fixed. The SPF-backed pair stream
  // whatever manifest they are pointed at, and land on the 4K ladder when entered rather than inheriting the global
  // default, which is MPEG-TS and so a failure case for that engine rather than a demo of it.
  'background-video': {
    label: 'Background Video',
    player: 'background',
    tag: 'background-video',
    fixedSource: BACKGROUND_VIDEO_SRC,
    sources: NON_DASH_SOURCE_IDS,
  },
  'hls-background-video': {
    label: 'HLS Background Video (SPF)',
    player: 'background',
    tag: 'hls-background-video',
    sources: SPF_MEDIA_SOURCE_IDS,
    entrySource: DEFAULT_BACKGROUND_SOURCE,
    outcome: backgroundOutcome,
  },
  'mux-background-video': {
    label: 'Mux Background Video (SPF)',
    player: 'background',
    tag: 'mux-background-video',
    sources: SPF_MEDIA_SOURCE_IDS,
    entrySource: DEFAULT_BACKGROUND_SOURCE,
    outcome: backgroundOutcome,
  },
  // Each embed renders one provider page URL rather than the picker's list.
  'vimeo-video': {
    label: 'Vimeo Video',
    player: 'video',
    tag: 'vimeo-video',
    embed: true,
    fixedSource: VIMEO_VIDEO_SRC,
    sources: NON_DASH_SOURCE_IDS,
  },
  'youtube-video': {
    label: 'YouTube Video',
    player: 'video',
    tag: 'youtube-video',
    embed: true,
    fixedSource: YOUTUBE_VIDEO_SRC,
    sources: NON_DASH_SOURCE_IDS,
  },
  'cloudflare-video': {
    label: 'Cloudflare Stream Video',
    player: 'video',
    tag: 'cloudflare-video',
    embed: true,
    fixedSource: CLOUDFLARE_VIDEO_SRC,
    sources: NON_DASH_SOURCE_IDS,
  },
  'spotify-audio': {
    label: 'Spotify Audio',
    player: 'audio',
    tag: 'spotify-audio',
    embed: true,
    fixedSource: SPOTIFY_AUDIO_SRC,
    sources: NON_DASH_SOURCE_IDS,
  },
  'tiktok-video': {
    label: 'TikTok Video',
    player: 'video',
    tag: 'tiktok-video',
    embed: true,
    fixedSource: TIKTOK_VIDEO_SRC,
    sources: NON_DASH_SOURCE_IDS,
  },
  'twitch-video': {
    label: 'Twitch Video',
    player: 'video',
    tag: 'twitch-video',
    embed: true,
    fixedSource: TWITCH_VIDEO_SRC,
    sources: NON_DASH_SOURCE_IDS,
  },
  'wistia-video': {
    label: 'Wistia Video',
    player: 'video',
    tag: 'wistia-video',
    embed: true,
    fixedSource: WISTIA_VIDEO_SRC,
    sources: NON_DASH_SOURCE_IDS,
  },
} satisfies Record<string, MediaDescriptor>;

export type MediaId = keyof typeof MEDIA_MAP;

// Annotated rather than `as const`, so indexing by a `MediaId` yields the one descriptor shape.
export const MEDIA: Record<MediaId, MediaDescriptor> = MEDIA_MAP;

/** Menu order. */
export const MEDIA_IDS = Object.keys(MEDIA_MAP) as MediaId[];

export function isMediaId(value: string | null | undefined): value is MediaId {
  return value != null && Object.hasOwn(MEDIA_MAP, value);
}

/** The sources the picker offers for a media on a platform. */
export function mediaSources(media: MediaId, platform: Platform): readonly SourceId[] {
  const { sources, cdnSources } = MEDIA[media];

  return platform === 'cdn' ? (cdnSources ?? sources) : sources;
}

/**
 * The CDN bundles ship CSS skins only, the background skin is one element with no variants, and an embed's provider
 * frame has nothing for a Tailwind skin to style.
 */
export function hasTailwindSkin(media: MediaId, platform: Platform): boolean {
  const { embed, player } = MEDIA[media];

  return platform !== 'cdn' && player !== 'background' && embed !== true;
}

/** The background skin is one element with no default or neutral variant to choose between. */
export function hasSkinChoice(media: MediaId): boolean {
  return MEDIA[media].player !== 'background';
}
