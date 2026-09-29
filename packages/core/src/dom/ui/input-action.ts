import { isCaptionOrSubtitleTrack } from '@videojs/utils/dom';

import { IndicatorVisibilityCoordinator } from '../../core/ui/indicator/lifecycle';
import type { InputActionEvent, MediaSnapshot } from '../../core/ui/input-action';
import { getGestureCoordinator } from '../gesture/coordinator';
import type { GestureActivateEvent } from '../gesture/gesture';
import type { HotkeyActivateEvent } from '../hotkey/coordinator';
import { getHotkeyCoordinator } from '../hotkey/hotkey';
import {
  selectFullscreen,
  selectPiP,
  selectPlayback,
  selectPlaybackRate,
  selectTextTrack,
  selectTime,
  selectVolume,
} from '../store/selectors';

export type CoordinatorEvent = GestureActivateEvent | HotkeyActivateEvent;

export interface MediaSnapshotStore {
  readonly state: object;
}

export function toInputActionEvent(event: CoordinatorEvent): InputActionEvent {
  return {
    action: event.action,
    value: event.value,
    source: event.source,
    key: 'key' in event.event ? event.event.key : undefined,
    repeat: 'repeat' in event.event ? event.event.repeat : undefined,
  };
}

export function getMediaSnapshot(store: MediaSnapshotStore | undefined): MediaSnapshot {
  if (!store) return {};

  const state = store.state;
  const time = selectTime(state);

  const textTrack = selectTextTrack(state);

  return {
    paused: selectPlayback(state)?.paused,
    volume: selectVolume(state)?.volume,
    muted: selectVolume(state)?.muted,
    playbackRate: selectPlaybackRate(state)?.playbackRate,
    isFullscreen: selectFullscreen(state)?.isFullscreen,
    subtitlesShowing: textTrack?.subtitlesShowing,
    subtitlesAvailable: textTrack ? (textTrack.textTrackList ?? []).some(isCaptionOrSubtitleTrack) : undefined,
    isPictureInPicture: selectPiP(state)?.isPictureInPicture,
    currentTime: time?.currentTime,
    duration: time?.duration,
    seeking: time?.seeking,
  };
}

export function subscribeToInputActions(
  container: HTMLElement,
  callback: (event: InputActionEvent) => void
): () => void {
  const handleEvent = (event: CoordinatorEvent) => callback(toInputActionEvent(event));
  const gestureUnsubscribe = getGestureCoordinator(container).subscribe(handleEvent);
  const hotkeyUnsubscribe = getHotkeyCoordinator(container).subscribe(handleEvent);

  return () => {
    gestureUnsubscribe();
    hotkeyUnsubscribe();
  };
}

const indicatorVisibilityCoordinators = new WeakMap<HTMLElement, IndicatorVisibilityCoordinator>();

export function getIndicatorVisibilityCoordinator(container: HTMLElement): IndicatorVisibilityCoordinator {
  let coordinator = indicatorVisibilityCoordinators.get(container);

  if (!coordinator) {
    coordinator = new IndicatorVisibilityCoordinator();
    indicatorVisibilityCoordinators.set(container, coordinator);
  }

  return coordinator;
}
