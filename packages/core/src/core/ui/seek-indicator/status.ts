import { clamp } from '@videojs/utils/number';
import { formatTime } from '@videojs/utils/time';

import type { InputActionEvent, MediaSnapshot } from '../input-action';

export type IndicatorDirection = 'forward' | 'backward';

export function isSeekIndicatorAction(action: string | null | undefined): action is 'seekStep' | 'seekToPercent' {
  return action === 'seekStep' || action === 'seekToPercent';
}

export function formatCurrentTime(snapshot: MediaSnapshot, locale?: string | string[]): string {
  const options = locale === undefined ? undefined : { locale };

  return formatTime(snapshot.currentTime ?? 0, snapshot.duration, options);
}

export function getSeekIndicatorDisplayValue(state: { value: string | null; currentTime: string }): string {
  return state.value ?? state.currentTime;
}

export function getSeekToPercent(event: InputActionEvent): number | null {
  if (event.value !== undefined) return clamp(event.value, 0, 100);

  if (!event.key || event.key < '0' || event.key > '9') return null;

  return Number(event.key) * 10;
}

export function getSeekDirection(event: InputActionEvent, snapshot: MediaSnapshot): IndicatorDirection | null {
  if (event.action === 'seekStep' && event.value !== undefined) {
    if (event.value > 0) return 'forward';

    if (event.value < 0) return 'backward';
  }

  if (event.action === 'seekToPercent') {
    const percent = getSeekToPercent(event);
    if (percent === null || snapshot.duration === undefined || snapshot.duration <= 0) return null;

    const targetTime = (percent / 100) * snapshot.duration;
    const currentTime = snapshot.currentTime ?? 0;
    if (targetTime > currentTime) return 'forward';

    if (targetTime < currentTime) return 'backward';
  }

  return null;
}
