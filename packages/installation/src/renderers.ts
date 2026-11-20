import { INSTALLATION_DEMO_SOURCES } from './defaults';

export interface InstallationRendererDefinition {
  readonly label: string;
  readonly article: 'a' | 'an';
  readonly adapterPackage: `@videojs/${string}` | null;
  readonly mediaSubpath: string | null;
  readonly htmlTag: string;
  readonly reactComponent: string;
  readonly defaultSource: string;
  readonly playsInline: boolean;
  readonly preset: boolean;
  /** Selects Mux Data by default. Its Mux playback source lets Mux Data work without an environment key. */
  readonly muxData: boolean;
  /** Plays through a `<video>` or `<audio>` element, which Mux Data needs to monitor. Iframe embeds don't. */
  readonly mediaElement: boolean;
}

/**
 * Everything the installation flow needs to know about one selectable media renderer.
 *
 * Presets decide which renderers are compatible. This catalog owns how each renderer is described, installed, imported,
 * and rendered so the site, Markdown renderer, and package CLI cannot drift between parallel maps.
 */
export const INSTALLATION_RENDERERS = {
  'background-video': {
    label: 'Background Video',
    article: 'a',
    adapterPackage: null,
    mediaSubpath: null,
    htmlTag: 'background-video',
    reactComponent: 'BackgroundVideo',
    defaultSource: INSTALLATION_DEMO_SOURCES.videoMp4,
    playsInline: true,
    preset: true,
    muxData: false,
    mediaElement: true,
  },
  'hls-background-video': {
    label: 'HLS Background Video',
    article: 'an',
    adapterPackage: null,
    mediaSubpath: 'hls-background-video',
    htmlTag: 'hls-background-video',
    reactComponent: 'HlsBackgroundVideo',
    defaultSource: INSTALLATION_DEMO_SOURCES.videoHls,
    playsInline: true,
    preset: false,
    muxData: false,
    mediaElement: true,
  },
  cloudflare: {
    label: 'Cloudflare Stream',
    article: 'a',
    adapterPackage: '@videojs/cloudflare-video',
    mediaSubpath: 'cloudflare-video',
    htmlTag: 'cloudflare-video',
    reactComponent: 'CloudflareVideo',
    defaultSource: INSTALLATION_DEMO_SOURCES.cloudflare,
    playsInline: false,
    preset: false,
    muxData: false,
    mediaElement: false,
  },
  dash: {
    label: 'DASH',
    article: 'a',
    adapterPackage: '@videojs/dash-video',
    mediaSubpath: 'dash-video',
    htmlTag: 'dash-video',
    reactComponent: 'DashVideo',
    defaultSource: INSTALLATION_DEMO_SOURCES.dash,
    playsInline: true,
    preset: false,
    muxData: false,
    mediaElement: true,
  },
  hls: {
    label: 'HLS',
    article: 'an',
    adapterPackage: '@videojs/hlsjs-video',
    mediaSubpath: 'hlsjs-video',
    htmlTag: 'hlsjs-video',
    reactComponent: 'HlsJsVideo',
    defaultSource: INSTALLATION_DEMO_SOURCES.videoHls,
    playsInline: true,
    preset: false,
    muxData: false,
    mediaElement: true,
  },
  'html5-audio': {
    label: 'HTML5 Audio',
    article: 'an',
    adapterPackage: null,
    mediaSubpath: null,
    htmlTag: 'audio',
    reactComponent: 'Audio',
    defaultSource: INSTALLATION_DEMO_SOURCES.audio,
    playsInline: false,
    preset: true,
    muxData: false,
    mediaElement: true,
  },
  'html5-video': {
    label: 'HTML5 Video',
    article: 'an',
    adapterPackage: null,
    mediaSubpath: null,
    htmlTag: 'video',
    reactComponent: 'Video',
    defaultSource: INSTALLATION_DEMO_SOURCES.videoMp4,
    playsInline: true,
    preset: true,
    muxData: false,
    mediaElement: true,
  },
  'mux-audio': {
    label: 'Mux',
    article: 'a',
    adapterPackage: '@videojs/mux-audio',
    mediaSubpath: 'mux-audio',
    htmlTag: 'mux-audio',
    reactComponent: 'MuxAudio',
    defaultSource: INSTALLATION_DEMO_SOURCES.videoHls,
    playsInline: false,
    preset: false,
    muxData: true,
    mediaElement: true,
  },
  'mux-background-video': {
    label: 'Mux Background Video',
    article: 'a',
    adapterPackage: null,
    mediaSubpath: 'mux-background-video',
    htmlTag: 'mux-background-video',
    reactComponent: 'MuxBackgroundVideo',
    defaultSource: INSTALLATION_DEMO_SOURCES.videoHls,
    playsInline: true,
    preset: false,
    muxData: false,
    mediaElement: true,
  },
  'mux-video': {
    label: 'Mux',
    article: 'a',
    adapterPackage: '@videojs/mux-video',
    mediaSubpath: 'mux-video',
    htmlTag: 'mux-video',
    reactComponent: 'MuxVideo',
    defaultSource: INSTALLATION_DEMO_SOURCES.videoHls,
    playsInline: true,
    preset: false,
    muxData: true,
    mediaElement: true,
  },
  spotify: {
    label: 'Spotify',
    article: 'a',
    adapterPackage: '@videojs/spotify-audio',
    mediaSubpath: 'spotify-audio',
    htmlTag: 'spotify-audio',
    reactComponent: 'SpotifyAudio',
    defaultSource: INSTALLATION_DEMO_SOURCES.spotify,
    playsInline: false,
    preset: false,
    muxData: false,
    mediaElement: false,
  },
  tiktok: {
    label: 'TikTok',
    article: 'a',
    adapterPackage: '@videojs/tiktok-video',
    mediaSubpath: 'tiktok-video',
    htmlTag: 'tiktok-video',
    reactComponent: 'TikTokVideo',
    defaultSource: INSTALLATION_DEMO_SOURCES.tiktok,
    playsInline: false,
    preset: false,
    muxData: false,
    mediaElement: false,
  },
  twitch: {
    label: 'Twitch',
    article: 'a',
    adapterPackage: '@videojs/twitch-video',
    mediaSubpath: 'twitch-video',
    htmlTag: 'twitch-video',
    reactComponent: 'TwitchVideo',
    defaultSource: INSTALLATION_DEMO_SOURCES.twitch,
    playsInline: false,
    preset: false,
    muxData: false,
    mediaElement: false,
  },
  vimeo: {
    label: 'Vimeo',
    article: 'a',
    adapterPackage: '@videojs/vimeo-video',
    mediaSubpath: 'vimeo-video',
    htmlTag: 'vimeo-video',
    reactComponent: 'VimeoVideo',
    defaultSource: INSTALLATION_DEMO_SOURCES.vimeo,
    playsInline: false,
    preset: false,
    muxData: false,
    mediaElement: false,
  },
  youtube: {
    label: 'YouTube',
    article: 'a',
    adapterPackage: '@videojs/youtube-video',
    mediaSubpath: 'youtube-video',
    htmlTag: 'youtube-video',
    reactComponent: 'YouTubeVideo',
    defaultSource: INSTALLATION_DEMO_SOURCES.youtube,
    playsInline: false,
    preset: false,
    muxData: false,
    mediaElement: false,
  },
} as const satisfies Record<string, InstallationRendererDefinition>;

export type Renderer = keyof typeof INSTALLATION_RENDERERS;

/** Renderer ids in picker-independent catalog order. Presets own their display order. */
export const RENDERERS: readonly Renderer[] = Object.freeze(Object.keys(INSTALLATION_RENDERERS).filter(isRenderer));

export function getInstallationRenderer(renderer: Renderer): InstallationRendererDefinition {
  return INSTALLATION_RENDERERS[renderer];
}

export function isRenderer(value: string): value is Renderer {
  return Object.hasOwn(INSTALLATION_RENDERERS, value);
}

export function getAdapterPackage(renderer: Renderer): string | null {
  return INSTALLATION_RENDERERS[renderer].adapterPackage;
}

export function getMediaSubpath(renderer: Renderer): string | null {
  return INSTALLATION_RENDERERS[renderer].mediaSubpath;
}

export function isMuxRenderer(renderer: Renderer): boolean {
  return INSTALLATION_RENDERERS[renderer].muxData;
}

export function isMediaElementRenderer(renderer: Renderer): boolean {
  return INSTALLATION_RENDERERS[renderer].mediaElement;
}

export function isPresetRenderer(renderer: Renderer): boolean {
  return INSTALLATION_RENDERERS[renderer].preset;
}

export function isVideoLikeRenderer(renderer: Renderer): boolean {
  return INSTALLATION_RENDERERS[renderer].playsInline;
}
