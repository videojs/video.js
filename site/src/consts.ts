import cdnPackage from '../../packages/cdn/package.json' with { type: 'json' };
import htmlPackage from '../../packages/html/package.json' with { type: 'json' };
// The Vite config reaches this module while discovering the workspace task graph, before package builds run.
import { INSTALLATION_DEMO_SOURCES } from '../../packages/installation/src/defaults.ts';

// Always https://videojs.org. Unlike Astro.site, which varies per deploy
// (e.g. deploy preview URLs), this is stable for canonical URLs and other
// references that must always point to production.
export const PRODUCTION_URL = new URL('https://videojs.org');
// Pre-release docs host (branch deploy of `main`). Keep references centralized
// here so the hostname can move without touching components.
export const PRERELEASE_URL = new URL('https://main.videojs.org');
export const SITE_TITLE = 'Video.js';
export const SEO_SUFFIX = 'Open Source Video Player';
/** Month (`YYYY-MM`) of the first Video.js 10 blog post; earlier posts document Video.js 1 through 8. */
export const FIRST_V10_BLOG_MONTH = '2026-03';
export const SITE_DESCRIPTION = `The open-source video player for React and HTML. Lightweight, accessible components built for performance and streaming.`;
export const GITHUB_REPO_URL = 'https://github.com/videojs/v10/';
export const DISCORD_INVITE_URL = 'https://discord.gg/JBqHh485uF';
export const MUX_URL = 'https://www.mux.com?utm_source=videojs&utm_campaign=vjs10';
export const MUX_SUPPORT_URL = 'https://www.mux.com/sales-contact?form=sales&utm_source=videojs&utm_campaign=vjs10';
export const THEME_KEY = 'vjs-site-theme';
export const ACCENT_KEY = 'vjs-site-accent';
export const TONE_KEY = 'vjs-site-tone';

/**
 * Page background per resolved theme and dark tone, written to the `theme-color` meta tag for browser chrome.
 * `ThemeInit.astro` runs before the stylesheet is available, so these cannot be read from CSS at that point; keep them
 * in step with `--color-faded-black` and the `data-tone="deep"` override in `styles/globals.css`.
 */
export const THEME_COLORS = {
  light: '#ebe4c1',
  soft: '#1e1d1d',
  deep: '#151414',
} as const;
export const BANNER_DISMISS_KEY = 'vjs-legacy-banner-dismissed';
export const BLOG_PAGE_SIZE = 10;
export const CDN_URL_BASE = `https://cdn.jsdelivr.net/npm`;
export const VJS10_VERSION = htmlPackage.version;
export const VJS10_CDN_BASE = `${CDN_URL_BASE}/@videojs/cdn@${cdnPackage.version}`;
export const VJS10_CDN_ARCHIVE_VERSION = cdnPackage.version;

export function isPrereleaseSite(siteUrl: URL | undefined): boolean {
  return siteUrl?.origin === PRERELEASE_URL.origin;
}

/** A streaming video source used by demos and examples throughout the site. */
interface StreamingVideoSource {
  id: string;
  hls: string;
}

interface VideoSource extends StreamingVideoSource {
  mp4: string;
  poster: string;
}

export const VJS8_DEMO_VIDEO: VideoSource = {
  id: 'lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4',
  hls: 'https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4.m3u8',
  mp4: 'https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/highest.mp4',
  poster: 'https://image.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/thumbnail.webp',
};

export const VJS10_DEMO_VIDEO: VideoSource = {
  id: 'BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM',
  hls: INSTALLATION_DEMO_SOURCES.videoHls,
  mp4: INSTALLATION_DEMO_SOURCES.videoMp4,
  poster: 'https://image.mux.com/BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM/thumbnail.webp',
};
export const VJS10_DEMO_AUDIO = INSTALLATION_DEMO_SOURCES.audio;

export const VJS10_MULTI_AUDIO_DEMO_VIDEO: StreamingVideoSource = {
  id: 's41JYeqIpBMBzE4OzxDyGR2yrp2hD1CQ6gJN9SlVGDQ',
  hls: 'https://stream.mux.com/s41JYeqIpBMBzE4OzxDyGR2yrp2hD1CQ6gJN9SlVGDQ.m3u8',
};

// A continuously-running live stream, so the live presets' demo snippets show a
// player that actually reports live-edge state. Matches the `hls-live` source in
// the sandbox.
export const VJS10_DEMO_LIVE: StreamingVideoSource = {
  id: 'v69RSHhFelSm4701snP22dYz2jICy4E4FUyk02rW4gxRM',
  hls: INSTALLATION_DEMO_SOURCES.live,
};

export const VJS10_DEMO_BACKGROUND_VIDEO_MP4 =
  'https://stream.mux.com/601n4w1fq88NJiVpzvrQQeQfNnnjjfKMIN7dCGAEarTs/highest.mp4';
export const VJS10_DEMO_BACKGROUND_VIDEO_POSTER =
  'https://image.mux.com/601n4w1fq88NJiVpzvrQQeQfNnnjjfKMIN7dCGAEarTs/thumbnail.webp';
export const VJS10_DEMO_POSTER = `https://image.mux.com/${VJS10_DEMO_VIDEO.id}/thumbnail.jpg`;
export const VJS10_DEMO_STORYBOARD = `https://image.mux.com/${VJS10_DEMO_VIDEO.id}/storyboard.jpg`;
export const VJS10_DEMO_STORYBOARD_VTT = `https://image.mux.com/${VJS10_DEMO_VIDEO.id}/storyboard.vtt`;

// Standalone third-party samples for source types that aren't the shared Mux
// asset above: Mux doesn't serve DASH, and Vimeo is a hosting service. The DASH
// value matches the sample used by the site's DASH reference demo.
export const VJS10_DEMO_DASH = INSTALLATION_DEMO_SOURCES.dash;
export const VJS10_DEMO_VIMEO = INSTALLATION_DEMO_SOURCES.vimeo;
export const VJS10_DEMO_WISTIA = 'https://wesleyluyten.wistia.com/medias/oifkgmxnkb';
export const VJS10_DEMO_YOUTUBE = INSTALLATION_DEMO_SOURCES.youtube;
export const VJS10_DEMO_CLOUDFLARE = INSTALLATION_DEMO_SOURCES.cloudflare;
// An episode rather than a track: Spotify plays episodes in full for a
// signed-out listener, where a track is a 30 second preview.
export const VJS10_DEMO_SPOTIFY = INSTALLATION_DEMO_SOURCES.spotify;
export const VJS10_DEMO_TIKTOK = INSTALLATION_DEMO_SOURCES.tiktok;
// A VOD rather than a channel: a channel embed only plays while its streamer
// is live, so it would show an offline banner most of the time.
export const VJS10_DEMO_TWITCH = INSTALLATION_DEMO_SOURCES.twitch;
