import embedPayloads from './embed-payloads.json';
import type { EmbedPayload } from './script-bytes';
import {
  CLOUDFLARE_VIDEO_SRC,
  getPosterSrc,
  SOURCES,
  SPOTIFY_AUDIO_SRC,
  TIKTOK_VIDEO_SRC,
  TWITCH_VIDEO_SRC,
  VIMEO_VIDEO_SRC,
  WISTIA_VIDEO_SRC,
} from './sources';

// YouTube thumbnails follow the video id, so they need no request to look up. Other embeds need an oEmbed call.
// `maxresdefault` is the 720p 16:9 frame; `hqdefault` and `sddefault` are 4:3 with black bars. YouTube only makes it
// for HD uploads, and not every video has a WebP copy under `vi_webp`; the video used here has both.
function youTubePoster(id: string): string {
  return `https://i.ytimg.com/vi_webp/${id}/maxresdefault.webp`;
}

// A stand-in for a source with no thumbnail of its own, so switching to it still changes the poster. The seed keeps
// the same image across reloads.
function randomPoster(seed: string): string {
  return `https://picsum.photos/seed/${seed}/1280/720.webp`;
}

interface LazySource {
  label: string;
  src: string;
  /** Shown by light mode before the media loads. Sources without one show a plain frame. */
  poster?: string | undefined;
}

interface LazySourceGroup {
  label: string;
  sources: readonly LazySource[];
}

/** The frameworks the lazy media sandbox renders `LazyVideo` and `LazyAudio` with. */
export const LAZY_FRAMEWORKS = ['html', 'react'] as const;

export type LazyFramework = (typeof LAZY_FRAMEWORKS)[number];

/** Whether the sandbox renders `LazyVideo` or `LazyAudio`. */
export const LAZY_KINDS = ['video', 'audio'] as const;

export type LazyKind = (typeof LAZY_KINDS)[number];

/** One source per media `LazyVideo` resolves to. */
const LAZY_VIDEO_SOURCE_GROUPS: readonly LazySourceGroup[] = [
  {
    label: 'Files and streams',
    sources: [
      {
        label: 'MP4',
        src: SOURCES['mp4-1'].url!,
        poster: 'https://image.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/thumbnail.webp',
      },
      // Not a Mux host, so it resolves as plain HLS: native on Safari, hls.js elsewhere.
      // Apple publishes no poster for bipbop.
      { label: 'HLS', src: SOURCES['hls-mixed-codec'].url!, poster: randomPoster('hls') },
      { label: 'Mux', src: SOURCES['hls-1'].url!, poster: getPosterSrc('hls-1') },
      // The same Big Buck Bunny as the YouTube source, so its thumbnail fits.
      { label: 'DASH', src: SOURCES['dash-1'].url!, poster: youTubePoster('aqz-KE-bpKQ') },
    ],
  },
  {
    label: 'Embeds',
    sources: [
      { label: 'YouTube', src: SOURCES['youtube-1'].url!, poster: youTubePoster('aqz-KE-bpKQ') },
      // Looked up once from each service's oEmbed or thumbnail API. TikTok's thumbnails are signed URLs that expire,
      // so it gets a stand-in.
      {
        label: 'Vimeo',
        src: VIMEO_VIDEO_SRC,
        poster:
          'https://i.vimeocdn.com/video/452001751-8216e0571c251a09d7a8387550942d89f7f86f6398f8ed886e639b0dd50d3c90-d_1280x720',
      },
      {
        label: 'Wistia',
        src: WISTIA_VIDEO_SRC,
        poster:
          'https://embed-ssl.wistia.com/deliveries/4ec6635c197ba892b7539207b00c7bdf.jpg?image_crop_resized=1280x720',
      },
      {
        label: 'Cloudflare',
        src: CLOUDFLARE_VIDEO_SRC,
        poster: 'https://videodelivery.net/bfbd585059e33391d67b0f1d15fe6ea4/thumbnails/thumbnail.jpg?height=720',
      },
      { label: 'TikTok', src: TIKTOK_VIDEO_SRC, poster: randomPoster('tiktok') },
      {
        label: 'Twitch',
        src: TWITCH_VIDEO_SRC,
        poster:
          'https://static-cdn.jtvnw.net/cf_vods/d2nvs31859zcd8/twitch/106400740/f2979575-fa80-4ad9-9665-a074d510a03a/thumb/index-0000000000-1280x720.jpg',
      },
      // player.js is a protocol any host can speak, so the `playerjs` parameter marks the embed as one. The Mux Player
      // embed plays the same asset as `hls-1`, so its poster fits.
      { label: 'Player.js', src: `${SOURCES['playerjs-mux'].url!}?playerjs`, poster: getPosterSrc('hls-1') },
    ],
  },
];

/** One source per media `LazyAudio` resolves to. */
const LAZY_AUDIO_SOURCE_GROUPS: readonly LazySourceGroup[] = [
  {
    label: 'Files and streams',
    sources: [
      // The installation snippet's audio demo.
      { label: 'M4A', src: 'https://stream.mux.com/BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM/audio.m4a' },
      // Not a Mux host, so it resolves as plain HLS: native on Safari, the SPF engine elsewhere.
      { label: 'HLS', src: SOURCES['hls-mixed-codec'].url! },
      { label: 'Mux', src: SOURCES['hls-audio-only-cmaf'].url! },
    ],
  },
  {
    label: 'Embeds',
    sources: [
      { label: 'Spotify', src: SPOTIFY_AUDIO_SRC },
      { label: 'SoundCloud', src: SOURCES['soundcloud-track'].url! },
    ],
  },
];

export const LAZY_SOURCE_GROUPS = {
  video: LAZY_VIDEO_SOURCE_GROUPS,
  audio: LAZY_AUDIO_SOURCE_GROUPS,
} satisfies Record<LazyKind, readonly LazySourceGroup[]>;

const LAZY_SOURCES = {
  video: LAZY_VIDEO_SOURCE_GROUPS.flatMap(({ sources }) => sources),
  audio: LAZY_AUDIO_SOURCE_GROUPS.flatMap(({ sources }) => sources),
} satisfies Record<LazyKind, readonly LazySource[]>;

/** The source playing `src`, if the sandbox offers one. */
export function findLazySource(kind: LazyKind, src: string): LazySource | undefined {
  return LAZY_SOURCES[kind].find((source) => source.src === src);
}

/** A source's name in the page URL, such as `dash` or `player-js`. */
function lazySourceId({ label }: LazySource): string {
  return label.toLowerCase().replace(/[^a-z\d]+/g, '-');
}

/** The source `?source=` names among those for `kind`, or the first one. */
export function getUrlLazySource(kind: LazyKind): LazySource {
  const id = new URLSearchParams(location.search).get('source');
  const sources = LAZY_SOURCES[kind];

  return sources.find((source) => lazySourceId(source) === id) ?? sources[0]!;
}

/** The `?framework=` value, or `html`. */
export function getUrlFramework(): LazyFramework {
  const value = new URLSearchParams(location.search).get('framework');

  return LAZY_FRAMEWORKS.find((framework) => framework === value) ?? 'html';
}

/** The `?kind=` value, or `video`. */
export function getUrlKind(): LazyKind {
  const value = new URLSearchParams(location.search).get('kind');

  return LAZY_KINDS.find((kind) => kind === value) ?? 'video';
}

/** When `embed-payloads.json` was measured, for the breakdown's caption. */
export const EMBED_PAYLOADS_MEASURED_AT = embedPayloads.measuredAt;

/**
 * What the embed for `src` downloads from its service, as measured by `pnpm --dir apps/e2e measure-embed-payloads`, or
 * `undefined` for a source that isn't an embed.
 */
export function getEmbedPayload(kind: LazyKind, src: string): EmbedPayload | undefined {
  const source = findLazySource(kind, src);
  const embeds: Partial<Record<string, { scripts: number; total: number }>> = embedPayloads.embeds;
  const payload = source && embeds[lazySourceId(source)];

  return source && payload ? { label: source.label, scripts: payload.scripts, total: payload.total } : undefined;
}

/**
 * Calls `onChange` with whether an embed has started downloading from its service, and again whenever that changes. An
 * embed that waits for play under `preload="none"` renders its frame with no `src` until then. Without a frame, such as
 * Wistia's player element, the embed downloads as soon as it renders.
 */
export function observeEmbedFetching(
  frame: HTMLIFrameElement | null,
  onChange: (fetching: boolean) => void
): () => void {
  if (!frame) {
    onChange(true);
    return () => {};
  }

  const report = () => onChange(!!frame.getAttribute('src'));
  const observer = new MutationObserver(report);

  observer.observe(frame, { attributes: true, attributeFilter: ['src'] });
  report();

  return () => observer.disconnect();
}

/** Whether `?light` is in the page URL. */
export function getUrlLight(): boolean {
  return new URLSearchParams(location.search).has('light');
}

/** Whether `?autoplay` is in the page URL. */
export function getUrlAutoplay(): boolean {
  return new URLSearchParams(location.search).has('autoplay');
}

/** Whether `?muted` is in the page URL. */
export function getUrlMuted(): boolean {
  return new URLSearchParams(location.search).has('muted');
}

/** The `preload` values the lazy media sandbox offers. `none` is what lazy media plays when none is given. */
export const LAZY_PRELOADS = ['none', 'metadata', 'auto'] as const;

export type LazyPreload = (typeof LAZY_PRELOADS)[number];

function isLazyPreload(value: string | null): value is LazyPreload {
  return LAZY_PRELOADS.some((preload) => preload === value);
}

/** The `?preload=` value, or `none` when it is absent or not one lazy media takes. */
export function getUrlPreload(): LazyPreload {
  const value = new URLSearchParams(location.search).get('preload');

  return isLazyPreload(value) ? value : 'none';
}

interface LazyUrlState {
  framework?: LazyFramework | undefined;
  /** A new kind clears the source, since each kind offers its own. */
  kind?: LazyKind | undefined;
  src?: string;
  light?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  preload?: LazyPreload;
}

/** Keeps the source and the page's toggles in the page URL, so a reload or a shared link opens the same state. */
export function setUrlLazyState({ framework, kind, src, light, autoplay, muted, preload }: LazyUrlState): void {
  const url = new URL(location.href);
  const source = src === undefined ? undefined : findLazySource(getUrlKind(), src);

  // `html` and `video` are the defaults, so they leave the URL clean.
  if (framework === 'html') url.searchParams.delete('framework');
  else if (framework) url.searchParams.set('framework', framework);

  if (kind) {
    url.searchParams.delete('source');

    if (kind === 'video') url.searchParams.delete('kind');
    else url.searchParams.set('kind', kind);
  }

  if (source) url.searchParams.set('source', lazySourceId(source));

  if (light === true) url.searchParams.set('light', '');
  else if (light === false) url.searchParams.delete('light');

  if (autoplay === true) url.searchParams.set('autoplay', '');
  else if (autoplay === false) url.searchParams.delete('autoplay');

  if (muted === true) url.searchParams.set('muted', '');
  else if (muted === false) url.searchParams.delete('muted');

  // `none` is the default, so it leaves the URL clean.
  if (preload === 'none') url.searchParams.delete('preload');
  else if (preload) url.searchParams.set('preload', preload);

  history.replaceState(null, '', url);
}

/** What a lazy media player module mounts with. */
export interface LazyPlayerOptions {
  src: string;
  poster: string | undefined;
  autoplay: boolean;
  /** Start muted, which browsers require before most autoplay. */
  muted: boolean;
  /** `none` is left off, so the page shows what lazy media does by default. */
  preload: LazyPreload;
  /** Receives a description of the resolved media, or `null` while there's none. */
  onResolved: (description: string | null) => void;
  /** Receives whether the resolved media's embed has started downloading from its service. */
  onEmbedFetching: (fetching: boolean) => void;
  /** Called once playback starts. */
  onStarted: () => void;
}

/** A mounted lazy media player. */
export interface LazyPlayer {
  /** Change the source in place, as an app changing `src` does. */
  setSource(src: string, poster: string | undefined): void;
  destroy(): void;
}

/**
 * Mounts a player with `LazyVideo` or `LazyAudio` into `stage`. One module per framework and kind, so the page loads
 * only the code that combination ships.
 */
export type MountLazyPlayer = (stage: HTMLElement, options: LazyPlayerOptions) => LazyPlayer;

/** Tailwind classes for the lazy media sandbox. */
export const LAZY_DEMO_CLASSES = {
  header: 'grid gap-1',
  title: 'text-2xl font-semibold tracking-tight',
  lede: 'text-sm text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-foreground',
  card: 'rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm',
  groups: 'grid gap-4',
  groupLabel: 'mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase',
  buttons: 'flex flex-wrap gap-2',
  button:
    'inline-flex h-8 cursor-pointer items-center rounded-md border border-input bg-background px-3 text-sm font-medium transition-colors outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/90',
  src: 'mt-4 truncate border-t border-border pt-3 font-mono text-xs text-muted-foreground',
  light: 'mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border pb-3',
  lightToggle: 'inline-flex cursor-pointer items-center gap-2 text-sm font-medium',
  select:
    'h-7 cursor-pointer rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
  lightStatus: 'text-xs text-muted-foreground',
  facade:
    'sandbox-video-frame group relative grid w-full cursor-pointer place-items-center overflow-hidden bg-black outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
  facadeImage: 'absolute inset-0 size-full object-cover',
  placeholder: 'sandbox-video-frame relative w-full overflow-hidden bg-black',
  audioFrame: 'mx-auto w-full max-w-xl',
  audioFacade:
    'mx-auto flex h-14 w-full max-w-xl cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-3 text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
  audioFacadePlay: 'grid size-9 place-items-center rounded-full bg-primary text-primary-foreground',
  audioPlaceholder: 'mx-auto h-14 w-full max-w-xl rounded-xl border border-border bg-card',
  segmented: 'inline-flex rounded-md border border-input p-0.5',
  segment:
    'h-7 cursor-pointer rounded px-3 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary/90',
  facadePlay:
    'relative grid size-16 place-items-center rounded-full bg-black/60 text-white transition-transform group-hover:scale-110',
  facadeIcon: 'size-8 fill-current',
  breakdownHeader: 'mb-3 flex flex-wrap items-baseline justify-between gap-2',
  breakdownBar: 'flex h-2.5 overflow-hidden rounded-full bg-muted',
  breakdownGroups: 'mt-4 grid gap-4 sm:grid-cols-2',
  breakdownGroup: 'flex items-center gap-2 text-sm font-medium',
  breakdownSwatch: 'size-2.5 shrink-0 rounded-full',
  breakdownSize: 'ms-auto tabular-nums',
  breakdownPackages: 'mt-1 grid gap-0.5 ps-4.5 text-xs text-muted-foreground',
  breakdownPackage: 'flex justify-between gap-2 [&>span:first-child]:truncate [&>span:first-child]:font-mono',
  groupColor: {
    videojs: 'bg-primary',
    dependencies: 'bg-sky-500',
    react: 'bg-violet-400',
    sandbox: 'bg-muted-foreground/40',
    embed: 'bg-amber-500',
  },
  stats: 'grid gap-3 sm:grid-cols-3',
  stat: 'grid content-start gap-1',
  statLabel: 'text-xs font-medium tracking-wide text-muted-foreground uppercase',
  statValue: 'text-2xl font-semibold tracking-tight tabular-nums',
  statCode: 'font-mono text-lg font-semibold',
  statDetail: 'text-xs text-muted-foreground tabular-nums',
} as const;
