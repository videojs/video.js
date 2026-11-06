import { useStore } from '@nanostores/react';
import { getInstallationPreset, type SkinCustomProperties } from '@videojs/installation';

import { previewAccentColor, previewControlsBeforeStart } from '@/stores/installation';

import { useSelection } from './useSelection';

export interface SkinPropertyOptions {
  /** Whether the controls option applies: a video skin is selected. */
  controlsApplies: boolean;
  /** Whether the accent option applies: a skin other than the background one is selected. */
  accentApplies: boolean;
  properties: SkinCustomProperties;
}

/** The skin custom properties the installation preview's options set, for the preview and the snippets alike. */
export function useSkinProperties(): SkinPropertyOptions {
  const $useCase = useSelection('useCase');
  const $skin = useSelection('skin');
  const controlsBeforeStart = useStore(previewControlsBeforeStart);
  const accentColor = useStore(previewAccentColor).trim();

  const accentApplies = $useCase !== 'background-video' && $skin !== 'none';
  const controlsApplies = accentApplies && getInstallationPreset($useCase).mediaType === 'video';
  const properties: Record<`--${string}`, string> = {};

  if (controlsApplies && controlsBeforeStart) properties['--media-controls-before-start'] = 'visible';

  if (accentApplies && accentColor) properties['--media-accent-color'] = accentColor;

  return { controlsApplies, accentApplies, properties };
}
