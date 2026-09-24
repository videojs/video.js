/**
 * Canonical components this package exports from their own subpath rather than the package root, so the root stays free
 * of their dependencies. Compiler targets that emit React skins import every other component from the root.
 */
export const reactSubpathComponents: Readonly<Record<string, string>> = {
  AudioTrackRadioGroup: '@videojs/react/ui/audio-track-radio-group',
  CaptionsRadioGroup: '@videojs/react/ui/captions-radio-group',
  PlaybackRateRadioGroup: '@videojs/react/ui/playback-rate-radio-group',
  QualityRadioGroup: '@videojs/react/ui/quality-radio-group',
};

/** The module that exports a canonical component, such as `@videojs/react` for `PlayButton`. */
export function reactComponentModule(component: string): string {
  return reactSubpathComponents[component] ?? '@videojs/react';
}
