import { describe, expect, it } from 'vite-plus/test';

import {
  getIndicatorVisibilityCoordinator,
  getMediaSnapshot,
  type MediaSnapshotStore,
  toInputActionEvent,
} from '../input-action';

function mockStore(state: Record<string, unknown>): MediaSnapshotStore {
  return { state };
}

describe('toInputActionEvent', () => {
  it('converts coordinator events to input action events', () => {
    expect(
      toInputActionEvent({
        source: 'hotkey',
        action: 'togglePaused',
        value: 1,
        event: new KeyboardEvent('keydown', { key: 'k', repeat: true }),
      })
    ).toEqual({
      source: 'hotkey',
      action: 'togglePaused',
      value: 1,
      key: 'k',
      repeat: true,
    });
  });
});

describe('getMediaSnapshot', () => {
  it('derives media snapshots from player store selectors', () => {
    expect(
      getMediaSnapshot(
        mockStore({
          chaptersCues: [],
          paused: true,
          volume: 0.5,
          muted: false,
          playbackRates: [1, 1.5],
          playbackRate: 1.5,
          isFullscreen: true,
          subtitlesShowing: true,
          textTrackList: [{ id: 'captions-en', kind: 'captions', label: 'English', language: 'en', mode: 'showing' }],
          isPictureInPicture: false,
          currentTime: 30,
          duration: 120,
          seeking: true,
        })
      )
    ).toEqual({
      paused: true,
      volume: 0.5,
      muted: false,
      playbackRate: 1.5,
      isFullscreen: true,
      subtitlesShowing: true,
      subtitlesAvailable: true,
      isPictureInPicture: false,
      currentTime: 30,
      duration: 120,
      seeking: true,
    });
  });
});

describe('getIndicatorVisibilityCoordinator', () => {
  it('shares a visibility coordinator per container', () => {
    const container = document.createElement('div');
    const coordinator = getIndicatorVisibilityCoordinator(container);

    expect(getIndicatorVisibilityCoordinator(container)).toBe(coordinator);
    expect(getIndicatorVisibilityCoordinator(document.createElement('div'))).not.toBe(coordinator);
  });
});
