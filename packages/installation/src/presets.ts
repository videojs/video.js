import type { Renderer } from './renderers';

export type Skin = 'video' | 'audio' | 'neutral-video' | 'neutral-audio' | 'none';

/** Public skin values accepted by installation requests. */
export const INSTALLATION_SKIN_FLAGS = ['default', 'neutral', 'none'] as const;

export interface InstallationPreset {
  label: string;
  flag: string;
  group: string;
  tagPrefix: string;
  componentPrefix: string;
  mediaType: 'video' | 'audio';
  live: boolean;
  renderers: readonly Renderer[];
}

/**
 * Installation presets in the order shown by the site and `agents init` option summary.
 *
 * Renderer order is also guidance: index 0 is the default when URL detection has no match. Live presets include only
 * media that exposes Video.js live-edge state; DASH playback does not currently provide that capability.
 */
export const INSTALLATION_PRESETS = {
  'default-video': {
    label: 'Video',
    flag: 'video',
    group: 'video',
    tagPrefix: 'video',
    componentPrefix: 'Video',
    mediaType: 'video',
    live: false,
    renderers: ['html5-video', 'hls', 'dash', 'mux-video', 'vimeo', 'youtube', 'cloudflare', 'tiktok', 'twitch'],
  },
  'default-audio': {
    label: 'Audio',
    flag: 'audio',
    group: 'audio',
    tagPrefix: 'audio',
    componentPrefix: 'Audio',
    mediaType: 'audio',
    live: false,
    renderers: ['html5-audio', 'mux-audio', 'spotify'],
  },
  'live-video': {
    label: 'Live Video',
    flag: 'live-video',
    group: 'live-video',
    tagPrefix: 'live-video',
    componentPrefix: 'LiveVideo',
    mediaType: 'video',
    live: true,
    renderers: ['hls', 'mux-video'],
  },
  'live-audio': {
    label: 'Live Audio',
    flag: 'live-audio',
    group: 'live-audio',
    tagPrefix: 'live-audio',
    componentPrefix: 'LiveAudio',
    mediaType: 'audio',
    live: true,
    renderers: ['mux-audio'],
  },
  'background-video': {
    label: 'Background Video',
    flag: 'background-video',
    group: 'background',
    tagPrefix: 'background-video',
    componentPrefix: 'BackgroundVideo',
    mediaType: 'video',
    live: false,
    renderers: ['background-video', 'hls-background-video', 'mux-background-video'],
  },
} as const satisfies Record<string, InstallationPreset>;

export type UseCase = keyof typeof INSTALLATION_PRESETS;

// SAFETY: INSTALLATION_PRESETS is the source of the UseCase key union.
export const USE_CASES = Object.keys(INSTALLATION_PRESETS) as UseCase[];

export function getInstallationPreset(useCase: UseCase): InstallationPreset {
  return INSTALLATION_PRESETS[useCase];
}

export function getInstallationPlayerComponentName(useCase: UseCase): string {
  return `${getInstallationPreset(useCase).componentPrefix}Player`;
}
