import { describe, expect, it, vi } from 'vite-plus/test';

import {
  getIndicatorVisibilityCoordinator,
  getMediaSnapshot,
  type MediaSnapshotStore,
  toInputActionEvent,
} from '../input-action';
import { isSliderFocused } from '../slider/focus';

function mockStore(state: Record<string, unknown>): MediaSnapshotStore {
  return { state };
}

describe('input-action', () => {
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

  it('shares a visibility coordinator per container', () => {
    const container = document.createElement('div');
    const first = { close: vi.fn() };
    const second = { close: vi.fn() };

    const coordinator = getIndicatorVisibilityCoordinator(container);

    coordinator.register(first);
    coordinator.register(second);
    coordinator.show(second);

    expect(getIndicatorVisibilityCoordinator(container)).toBe(coordinator);
    expect(first.close).toHaveBeenCalledOnce();
    expect(second.close).not.toHaveBeenCalled();
  });

  it('detects focused sliders inside open shadow roots', () => {
    const container = document.createElement('div');
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    const slider = document.createElement('button');

    slider.setAttribute('role', 'slider');
    shadow.append(slider);
    container.append(host);
    document.body.append(container);

    slider.focus();

    expect(isSliderFocused(container)).toBe(true);
  });

  it('ignores focused sliders outside the scoped container', () => {
    const container = document.createElement('div');
    const slider = document.createElement('button');

    slider.setAttribute('role', 'slider');
    document.body.append(container, slider);

    slider.focus();

    expect(isSliderFocused(container)).toBe(false);
    expect(isSliderFocused(document)).toBe(true);
  });
});
