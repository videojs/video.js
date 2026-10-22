import {
  CLOUDFLARE_VIDEO_SRC,
  SOURCES,
  TIKTOK_VIDEO_SRC,
  TWITCH_VIDEO_SRC,
  VIMEO_VIDEO_SRC,
  WISTIA_VIDEO_SRC,
} from './sources';

/** One source per media `LazyVideo` resolves to, plus one it can't, for the lazy-video sandboxes. */
export const LAZY_VIDEO_SOURCES = [
  { label: 'MP4', src: SOURCES['mp4-1'].url! },
  // Not a Mux host, so it resolves as plain HLS: native on Safari, hls.js elsewhere.
  { label: 'HLS', src: SOURCES['hls-mixed-codec'].url! },
  { label: 'Mux', src: SOURCES['hls-1'].url! },
  { label: 'DASH', src: SOURCES['dash-1'].url! },
  { label: 'YouTube', src: SOURCES['youtube-1'].url! },
  { label: 'Vimeo', src: VIMEO_VIDEO_SRC },
  { label: 'Wistia', src: WISTIA_VIDEO_SRC },
  { label: 'Cloudflare', src: CLOUDFLARE_VIDEO_SRC },
  { label: 'TikTok', src: TIKTOK_VIDEO_SRC },
  { label: 'Twitch', src: TWITCH_VIDEO_SRC },
  // player.js speaks for many providers with no host to recognize them by.
  { label: 'Unsupported (Streamable)', src: 'https://streamable.com/e/moo' },
] as const;
