import type { UseCase } from './presets';

/** Player features an installation can ask for, each with the guide that shows how to add it. */
export const INSTALLATION_FEATURES = [
  'captions',
  'quality',
  'thumbnails',
  'poster',
  'autoplay',
  'keyboard-shortcuts',
  'user-preferences',
  'internationalization',
] as const;
export type InstallationFeature = (typeof INSTALLATION_FEATURES)[number];

export interface InstallationFeatureDefinition {
  readonly label: string;
  /** The slug of the guide that shows how to add the feature. */
  readonly guide: string;
}

export const INSTALLATION_FEATURE_DEFINITIONS = {
  captions: { label: 'Captions', guide: 'captions' },
  quality: { label: 'Quality menu', guide: 'quality' },
  thumbnails: { label: 'Thumbnail previews', guide: 'thumbnails' },
  poster: { label: 'Poster', guide: 'poster' },
  autoplay: { label: 'Autoplay', guide: 'autoplay' },
  'keyboard-shortcuts': { label: 'Keyboard shortcuts', guide: 'keyboard-shortcuts' },
  'user-preferences': { label: 'User preferences', guide: 'user-preferences' },
  internationalization: { label: 'Translations', guide: 'internationalization' },
} as const satisfies Record<InstallationFeature, InstallationFeatureDefinition>;

const AUDIO_FEATURES: readonly InstallationFeature[] = [
  'autoplay',
  'keyboard-shortcuts',
  'user-preferences',
  'internationalization',
];

export function isInstallationFeature(value: string): value is InstallationFeature {
  return INSTALLATION_FEATURES.some((feature) => feature === value);
}

/**
 * The features that fit a preset: audio has no picture for posters or thumbnails, live streams have no seek previews,
 * and background video plays without controls.
 */
export function installationFeaturesFor(useCase: UseCase): readonly InstallationFeature[] {
  switch (useCase) {
    case 'default-audio':
    case 'live-audio':
      return AUDIO_FEATURES;
    case 'live-video':
      return INSTALLATION_FEATURES.filter((feature) => feature !== 'thumbnails');
    case 'background-video':
      return ['poster'];
    default:
      return INSTALLATION_FEATURES;
  }
}

export function parseInstallationFeatures(value: string): readonly string[] {
  if (value === 'none') return [];

  return value
    .split(',')
    .map((feature) => feature.trim())
    .filter(Boolean);
}

export function serializeInstallationFeatures(features: readonly InstallationFeature[]): string {
  return features.length > 0 ? features.join(',') : 'none';
}
