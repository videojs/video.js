import { getInstallationPreset, type Skin, type UseCase } from './presets';
import { isMediaElementRenderer, isMuxRenderer, type Renderer } from './renderers';

export const INSTALLATION_EXTENSIONS = ['google-analytics', 'google-cast', 'mux-data'] as const;
export type InstallationExtension = (typeof INSTALLATION_EXTENSIONS)[number];

export interface InstallationExtensionDefinition {
  readonly label: string;
  readonly description: string;
  readonly packageName: `@videojs/${string}`;
  readonly htmlSubpath: string;
  readonly htmlTag: string;
  readonly reactComponent: string;
}

export const INSTALLATION_EXTENSION_DEFINITIONS = {
  'google-analytics': {
    label: 'Google Analytics',
    description: 'Send video events to the GA4 tag.',
    packageName: '@videojs/google-analytics',
    htmlSubpath: 'google-analytics',
    htmlTag: 'google-analytics',
    reactComponent: 'GoogleAnalytics',
  },
  'google-cast': {
    label: 'Google Cast',
    description: 'Send video to Chromecast devices.',
    packageName: '@videojs/google-cast',
    htmlSubpath: 'google-cast',
    htmlTag: 'google-cast',
    reactComponent: 'GoogleCast',
  },
  'mux-data': {
    label: 'Mux Data',
    description: 'Measure playback quality and engagement.',
    packageName: '@videojs/mux-data',
    htmlSubpath: 'mux-data',
    htmlTag: 'mux-data',
    reactComponent: 'MuxData',
  },
} as const satisfies Record<InstallationExtension, InstallationExtensionDefinition>;

const GOOGLE_CAST_RENDERERS = ['hls', 'dash', 'mux-video'] as const satisfies readonly Renderer[];

export function isInstallationExtension(value: string): value is InstallationExtension {
  return INSTALLATION_EXTENSIONS.some((extension) => extension === value);
}

export function getInstallationExtension(extension: InstallationExtension): InstallationExtensionDefinition {
  return INSTALLATION_EXTENSION_DEFINITIONS[extension];
}

/** Extensions that produce a useful result for the selected ready-made player. */
export function installationExtensionsFor(
  useCase: UseCase,
  skin: Skin,
  renderer: Renderer
): readonly InstallationExtension[] {
  const extensions: InstallationExtension[] = [];
  const preset = getInstallationPreset(useCase);

  // A decorative video autoplays and loops on every page load, which analytics would count as views. Readers who want
  // to measure one can still add an extension by hand.
  const decorative = useCase === 'background-video';

  if (!decorative) extensions.push('google-analytics');

  if (
    preset.mediaType === 'video' &&
    useCase !== 'background-video' &&
    skin !== 'none' &&
    GOOGLE_CAST_RENDERERS.some((candidate) => candidate === renderer)
  ) {
    extensions.push('google-cast');
  }

  if (!decorative && isMediaElementRenderer(renderer)) extensions.push('mux-data');

  return extensions;
}

/**
 * Whether generated Mux Data markup needs an environment key. Mux files a view under the environment that owns its
 * playback ID, which the extension reads only from a Mux source or an `https://stream.mux.com` URL.
 */
export function muxDataNeedsEnvKey(renderer: Renderer, sourceUrl: string): boolean {
  if (isMuxRenderer(renderer)) return false;

  try {
    const url = new URL(sourceUrl);

    return url.protocol !== 'https:' || url.hostname !== 'stream.mux.com';
  } catch {
    return true;
  }
}

/** Preserve the existing Mux playback behavior while keeping every other extension opt-in. */
export function defaultInstallationExtensions(renderer: Renderer): readonly InstallationExtension[] {
  return isMuxRenderer(renderer) ? ['mux-data'] : [];
}

export function parseInstallationExtensions(value: string): readonly string[] {
  if (value === 'none') return [];

  return value
    .split(',')
    .map((extension) => extension.trim())
    .filter(Boolean);
}

export function serializeInstallationExtensions(extensions: readonly InstallationExtension[]): string {
  return extensions.length > 0 ? extensions.join(',') : 'none';
}
