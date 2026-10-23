import {
  CLOUDFLARE_VIDEO_SRC,
  getPosterSrc,
  SOURCES,
  TIKTOK_VIDEO_SRC,
  TWITCH_VIDEO_SRC,
  VIMEO_VIDEO_SRC,
  WISTIA_VIDEO_SRC,
} from './sources';

// YouTube thumbnails follow the video id, so they need no request to look up. Other embeds need an oEmbed call.
function youTubePoster(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
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

/** One source per media `LazyVideo` resolves to, grouped for the lazy-video sandboxes. */
export const LAZY_VIDEO_SOURCE_GROUPS: readonly LazySourceGroup[] = [
  {
    label: 'Files and streams',
    sources: [
      {
        label: 'MP4',
        src: SOURCES['mp4-1'].url!,
        poster: 'https://image.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/thumbnail.webp',
      },
      // Not a Mux host, so it resolves as plain HLS: native on Safari, hls.js elsewhere.
      { label: 'HLS', src: SOURCES['hls-mixed-codec'].url! },
      { label: 'Mux', src: SOURCES['hls-1'].url!, poster: getPosterSrc('hls-1') },
      // The same Big Buck Bunny as the YouTube source, so its thumbnail fits.
      { label: 'DASH', src: SOURCES['dash-1'].url!, poster: youTubePoster('aqz-KE-bpKQ') },
    ],
  },
  {
    label: 'Embeds',
    sources: [
      { label: 'YouTube', src: SOURCES['youtube-1'].url!, poster: youTubePoster('aqz-KE-bpKQ') },
      { label: 'Vimeo', src: VIMEO_VIDEO_SRC },
      { label: 'Wistia', src: WISTIA_VIDEO_SRC },
      { label: 'Cloudflare', src: CLOUDFLARE_VIDEO_SRC },
      { label: 'TikTok', src: TIKTOK_VIDEO_SRC },
      { label: 'Twitch', src: TWITCH_VIDEO_SRC },
      // player.js is a protocol any host can speak, so the `playerjs` parameter marks the embed as one. The Mux Player
      // embed plays the same asset as `hls-1`, so its poster fits.
      { label: 'Player.js', src: `${SOURCES['playerjs-mux'].url!}?playerjs`, poster: getPosterSrc('hls-1') },
    ],
  },
];

export const LAZY_VIDEO_SOURCES: readonly LazySource[] = LAZY_VIDEO_SOURCE_GROUPS.flatMap(({ sources }) => sources);

/** A source's name in the page URL, such as `dash` or `player-js`. */
function lazySourceId({ label }: LazySource): string {
  return label.toLowerCase().replace(/[^a-z\d]+/g, '-');
}

/** The source `?source=` names, or the first one. */
export function getUrlLazySource(): LazySource {
  const id = new URLSearchParams(location.search).get('source');

  return LAZY_VIDEO_SOURCES.find((source) => lazySourceId(source) === id) ?? LAZY_VIDEO_SOURCES[0]!;
}

/** Whether `?light` is in the page URL. */
export function getUrlLight(): boolean {
  return new URLSearchParams(location.search).has('light');
}

/** Keeps the source and light mode in the page URL, so a reload or a shared link opens the same state. */
export function setUrlLazyState({ src, light }: { src?: string; light?: boolean }): void {
  const url = new URL(location.href);
  const source = src === undefined ? undefined : LAZY_VIDEO_SOURCES.find((option) => option.src === src);

  if (source) url.searchParams.set('source', lazySourceId(source));

  if (light === true) url.searchParams.set('light', '');
  else if (light === false) url.searchParams.delete('light');

  history.replaceState(null, '', url);
}

/** Tailwind classes the HTML and React lazy-video sandboxes share, so the two pages look the same. */
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
  lightStatus: 'text-xs text-muted-foreground',
  facade:
    'sandbox-video-frame group relative grid w-full cursor-pointer place-items-center overflow-hidden bg-black outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
  facadeImage: 'absolute inset-0 size-full object-cover',
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
  },
  stats: 'grid gap-3 sm:grid-cols-3',
  stat: 'grid content-start gap-1',
  statLabel: 'text-xs font-medium tracking-wide text-muted-foreground uppercase',
  statValue: 'text-2xl font-semibold tracking-tight tabular-nums',
  statCode: 'font-mono text-lg font-semibold',
  statDetail: 'text-xs text-muted-foreground tabular-nums',
} as const;
