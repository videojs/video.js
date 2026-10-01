import { clamp } from '@videojs/utils/number';

import { DEFAULT_INPUT_INDICATOR_LABELS, type InputIndicatorLabels } from '../indicator/labels';
import type { InputActionEvent, MediaSnapshot } from '../input-action';

export type IndicatorVolumeLevel = 'off' | 'low' | 'high';

/** @internal */
export interface VolumeStatusDetails {
  status: 'volume-off' | 'volume-low' | 'volume-high';
  label: string;
  value: string;
  volumeLevel: IndicatorVolumeLevel;
}

/** @internal */
export interface VolumeActionPrediction {
  snapshotVolume: number;
  nextMuted: boolean;
  nextVolume: number;
}

/** @internal */
export function isVolumeIndicatorAction(action: string | null | undefined): action is 'toggleMuted' | 'volumeStep' {
  return action === 'toggleMuted' || action === 'volumeStep';
}

/** @internal */
export function getVolumeLevel(volume: number): IndicatorVolumeLevel {
  if (volume <= 0) return 'off';

  return volume <= 0.5 ? 'low' : 'high';
}

/** @internal */
export function formatVolumeValue(volume: number): string {
  return `${Math.round(clamp(volume, 0, 1) * 100)}%`;
}

/** @internal */
export function getVolumeIndicatorDisplayValue(state: { value: string | null }): string {
  return state.value ?? '';
}

/**
 * Predicted mute/volume after a volume-indicator action.
 *
 * @internal
 */
export function predictVolumeActionOutcome(event: InputActionEvent, snapshot: MediaSnapshot): VolumeActionPrediction {
  const muted = snapshot.muted === true;
  const snapshotVolume = snapshot.volume ?? 0;

  if (event.action === 'toggleMuted') {
    return { snapshotVolume, nextMuted: !muted, nextVolume: snapshotVolume };
  }

  if (event.action === 'volumeStep') {
    const nextVolume = clamp(snapshotVolume + (event.value ?? 0), 0, 1);
    /** Mirrors `volumeFeature.setVolume`: mute clears only when the clamped volume is greater than 0. */
    const nextMuted = muted && nextVolume <= 0;

    return { snapshotVolume, nextMuted, nextVolume };
  }

  return { snapshotVolume, nextMuted: muted, nextVolume: snapshotVolume };
}

/**
 * Labels/value/level for volume actions, shared with `StatusIndicatorCore`.
 *
 * @internal
 */
export function deriveVolumeStatus(
  event: InputActionEvent,
  snapshot: MediaSnapshot,
  labels: InputIndicatorLabels = DEFAULT_INPUT_INDICATOR_LABELS,
  cachedPrediction?: VolumeActionPrediction
): VolumeStatusDetails {
  const prediction = cachedPrediction ?? predictVolumeActionOutcome(event, snapshot);
  const level = prediction.nextMuted ? 'off' : getVolumeLevel(prediction.nextVolume);
  const value = prediction.nextMuted ? '0%' : formatVolumeValue(prediction.nextVolume);

  return {
    status: level === 'off' ? 'volume-off' : level === 'low' ? 'volume-low' : 'volume-high',
    label: level === 'off' ? labels.muted : labels.volume,
    value,
    volumeLevel: level,
  };
}
