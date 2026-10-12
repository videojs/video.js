import { getInstallationPreset, type Skin, type UseCase } from './presets';
import { isMuxRenderer, type Renderer } from './renderers';

export const INSTALLATION_EXTENSIONS = ['google-cast', 'mux-data'] as const;
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
    description: 'Measure playback quality for Mux video and audio.',
    packageName: '@videojs/mux-data',
    htmlSubpath: 'mux-data',
    htmlTag: 'mux-data',
    reactComponent: 'MuxData',
  },
} as const satisfies Record<InstallationExtension, InstallationExtensionDefinition>;

/** The media Google Cast can send to a receiver. */
export const GOOGLE_CAST_RENDERERS = ['hls', 'dash', 'mux-video'] as const satisfies readonly Renderer[];

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

  if (
    preset.mediaType === 'video' &&
    useCase !== 'background-video' &&
    skin !== 'none' &&
    GOOGLE_CAST_RENDERERS.some((candidate) => candidate === renderer)
  ) {
    extensions.push('google-cast');
  }

  if (isMuxRenderer(renderer)) extensions.push('mux-data');

  return extensions;
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
