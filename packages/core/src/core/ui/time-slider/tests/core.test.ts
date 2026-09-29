import type { MediaBufferState, MediaPlaybackState, MediaTimeState } from '@videojs/media';
import { formatTimeAsPhrase } from '@videojs/utils/time';
import { describe, expect, it, vi } from 'vite-plus/test';

import type { SliderInput } from '../../slider/core';
import { TimeSliderCore } from '../core';

type TimeSliderMedia = MediaTimeState & MediaBufferState;

function createInput(overrides: Partial<SliderInput> = {}): SliderInput {
  return {
    pointerPercent: 0,
    dragPercent: 0,
    dragging: false,
    pointing: false,
    focused: false,
    ...overrides,
  };
}

function createMediaState(overrides: Partial<TimeSliderMedia> = {}): TimeSliderMedia {
  return {
    currentTime: 0,
    duration: 300,
    seeking: false,
    seek: vi.fn(async (t: number) => t),
    buffered: [],
    seekable: [],
    ...overrides,
  };
}

describe('TimeSliderCore', () => {
  describe('defaultProps', () => {
    it('has expected defaults', () => {
      expect(TimeSliderCore.defaultProps).toEqual({
        label: '',
        step: 1,
        largeStep: 10,
        orientation: 'horizontal',
        disabled: false,
        thumbAlignment: 'center',
        value: 0,
        min: 0,
        max: 100,
        changeThrottle: 100,
        pauseOnDrag: false,
      });
    });
  });

  describe('getState', () => {
    it('uses currentTime as value when not dragging', () => {
      const core = new TimeSliderCore();

      core.setInput(createInput());
      core.setMedia(createMediaState({ currentTime: 90, duration: 300 }));
      const state = core.getState();

      expect(state.value).toBe(90);
      expect(state.currentTime).toBe(90);
      expect(state.duration).toBe(300);
      expect(state.fillPercent).toBe(30); // 90/300 * 100
    });

    it('fill stays at currentTime during drag, pointerPercent tracks drag', () => {
      const core = new TimeSliderCore();

      core.setInput(createInput({ dragging: true, dragPercent: 50, pointerPercent: 50 }));
      core.setMedia(createMediaState({ currentTime: 90, duration: 300 }));
      const state = core.getState();

      expect(state.value).toBe(90); // still currentTime
      expect(state.fillPercent).toBe(30); // 90/300 * 100
      expect(state.pointerPercent).toBe(50); // drag position
      expect(state.dragging).toBe(true);
      expect(state.currentTime).toBe(90);
    });

    it('computes buffer percent from buffered ranges', () => {
      const core = new TimeSliderCore();

      core.setInput(createInput());
      core.setMedia(createMediaState({ duration: 200, buffered: [[0, 100]] }));
      const state = core.getState();

      expect(state.bufferPercent).toBe(50); // 100/200 * 100
    });

    it('uses end of the furthest buffered range', () => {
      const core = new TimeSliderCore();

      core.setInput(createInput());
      core.setMedia(
        createMediaState({
          duration: 200,
          buffered: [
            [0, 50],
            [60, 150],
          ],
        })
      );
      const state = core.getState();

      expect(state.bufferPercent).toBe(75); // 150/200 * 100
    });

    it('returns 0 buffer percent when no buffered ranges', () => {
      const core = new TimeSliderCore();

      core.setInput(createInput());
      core.setMedia(createMediaState({ duration: 200, buffered: [] }));
      const state = core.getState();

      expect(state.bufferPercent).toBe(0);
    });

    it('returns 0 buffer percent when duration is 0', () => {
      const core = new TimeSliderCore();

      core.setInput(createInput());
      core.setMedia(createMediaState({ duration: 0, buffered: [] }));
      const state = core.getState();

      expect(state.bufferPercent).toBe(0);
    });

    it('passes through seeking state', () => {
      const core = new TimeSliderCore();

      core.setInput(createInput());
      core.setMedia(createMediaState({ seeking: true }));
      const state = core.getState();

      expect(state.seeking).toBe(true);
    });

    it('sets min to 0 and max to duration', () => {
      const core = new TimeSliderCore();

      core.setInput(createInput());
      core.setMedia(createMediaState({ duration: 600 }));
      const state = core.getState();

      const attrs = core.getAttrs(state);

      expect(attrs['aria-valuemin']).toBe(0);
      expect(attrs['aria-valuemax']).toBe(600);
    });

    it('handles zero duration', () => {
      const core = new TimeSliderCore();

      core.setInput(createInput());
      core.setMedia(createMediaState({ currentTime: 0, duration: 0 }));
      const state = core.getState();

      expect(state.fillPercent).toBe(0);
      expect(state.value).toBe(0);
    });

    it('is disabled without a duration or seekable range', () => {
      const core = new TimeSliderCore();

      core.setInput(createInput());
      core.setMedia(createMediaState({ duration: 0, seekable: [] }));
      const state = core.getState();

      expect(state.disabled).toBe(true);
      expect(core.getAttrs(state)).toMatchObject({ 'aria-disabled': 'true', tabIndex: -1 });
      expect(core.getAttrs(state)['aria-valuetext']).toMatchObject({
        key: 'time.unknown',
        text: 'Media not loaded, unknown time.',
      });
    });

    it('uses the seekable end when duration is unavailable', () => {
      const core = new TimeSliderCore();

      core.setInput(createInput());
      core.setMedia(createMediaState({ duration: 0, seekable: [[10, 120]] }));
      const state = core.getState();

      expect(state.disabled).toBe(false);
      expect(state.duration).toBe(120);
      expect(core.getAttrs(state)['aria-valuemax']).toBe(120);
    });
  });

  describe('getAttrs', () => {
    it('returns aria-label and aria-valuetext', () => {
      const core = new TimeSliderCore();

      core.setInput(createInput());
      core.setMedia(createMediaState({ currentTime: 90, duration: 300 }));
      const state = core.getState();
      const attrs = core.getAttrs(state);

      expect(attrs['aria-label']).toMatchObject({ key: 'slider.seek', text: 'Seek' });
      expect(attrs['aria-valuetext']).toMatchObject({ key: 'time.position', text: '{current} of {duration}' });
      expect(core.getValueTextParams(state)).toEqual({
        current: formatTimeAsPhrase(90),
        duration: formatTimeAsPhrase(300),
      });
      expect(attrs.role).toBe('slider');
    });

    it('uses custom label', () => {
      const core = new TimeSliderCore({ label: 'Scrub' });

      core.setInput(createInput());
      core.setMedia(createMediaState({ currentTime: 0, duration: 300 }));
      const state = core.getState();
      const attrs = core.getAttrs(state);

      expect(attrs['aria-label']).toBe('Scrub');
    });

    it('announces drag position in valuetext during drag', () => {
      const core = new TimeSliderCore();

      core.setInput(createInput({ dragging: true, dragPercent: 50, pointerPercent: 50 }));
      core.setMedia(createMediaState({ currentTime: 0, duration: 300 }));
      const state = core.getState();
      const attrs = core.getAttrs(state);

      expect(attrs['aria-valuenow']).toBe(150);
      expect(attrs['aria-valuetext']).toMatchObject({ key: 'time.position', text: '{current} of {duration}' });
      expect(core.getValueTextParams(state)).toEqual({
        current: formatTimeAsPhrase(150),
        duration: formatTimeAsPhrase(300),
      });
    });

    it('formats value text params with the active locale', () => {
      const core = new TimeSliderCore();

      core.setFormatLocale('fr');
      core.setInput(createInput());
      core.setMedia(createMediaState({ currentTime: 90, duration: 300 }));
      const state = core.getState();

      expect(core.getValueTextParams(state)).toEqual({
        current: formatTimeAsPhrase(90, { locale: 'fr' }),
        duration: formatTimeAsPhrase(300, { locale: 'fr' }),
      });
    });
  });

  describe('setProps', () => {
    it('updates label', () => {
      const core = new TimeSliderCore();

      core.setProps({ label: 'Progress' });

      core.setInput(createInput());
      core.setMedia(createMediaState({ currentTime: 0, duration: 100 }));
      const state = core.getState();
      const attrs = core.getAttrs(state);

      expect(attrs['aria-label']).toBe('Progress');
    });

    it('preserves disabled across getState calls', () => {
      const core = new TimeSliderCore({ disabled: true });

      // getState overrides min/max via super.setProps — disabled must survive.
      core.setInput(createInput());
      core.setMedia(createMediaState({ duration: 300 }));
      const state = core.getState();

      expect(state.disabled).toBe(true);

      const attrs = core.getAttrs(state);

      expect(attrs['aria-disabled']).toBe('true');
      expect(attrs.tabIndex).toBe(-1);
    });

    it('preserves thumbAlignment across getState calls', () => {
      const core = new TimeSliderCore({ thumbAlignment: 'edge' });

      core.setInput(createInput());
      core.setMedia(createMediaState({ duration: 300 }));
      const state = core.getState();

      expect(state.thumbAlignment).toBe('edge');
    });

    it('preserves orientation across getState calls', () => {
      const core = new TimeSliderCore({ orientation: 'vertical' });

      core.setInput(createInput());
      core.setMedia(createMediaState({ duration: 300 }));
      const state = core.getState();

      expect(state.orientation).toBe('vertical');
    });
  });

  describe('startDrag/endDrag', () => {
    function createPlaybackState(overrides: Partial<MediaPlaybackState> = {}): MediaPlaybackState {
      return {
        paused: false,
        ended: false,
        started: true,
        waiting: false,
        play: vi.fn(async () => {}),
        pause: vi.fn(),
        ...overrides,
      };
    }

    it('does nothing when pauseOnDrag is false (default)', () => {
      const core = new TimeSliderCore();
      const playback = createPlaybackState();

      core.startDrag(playback);
      expect(playback.pause).not.toHaveBeenCalled();

      core.endDrag(playback);
      expect(playback.play).not.toHaveBeenCalled();
    });

    it('pauses on startDrag and resumes on endDrag when playing', () => {
      const core = new TimeSliderCore({ pauseOnDrag: true });
      const playback = createPlaybackState();

      core.startDrag(playback);
      expect(playback.pause).toHaveBeenCalledTimes(1);

      core.endDrag(playback);
      expect(playback.play).toHaveBeenCalledTimes(1);
    });

    it('does not resume on endDrag when playback was already paused', () => {
      const core = new TimeSliderCore({ pauseOnDrag: true });
      const playback = createPlaybackState({ paused: true });

      core.startDrag(playback);
      expect(playback.pause).not.toHaveBeenCalled();

      core.endDrag(playback);
      expect(playback.play).not.toHaveBeenCalled();
    });

    it('resumes on endDrag even if pauseOnDrag is turned off mid-drag', () => {
      const core = new TimeSliderCore({ pauseOnDrag: true });
      const playback = createPlaybackState();

      core.startDrag(playback);
      expect(playback.pause).toHaveBeenCalledTimes(1);

      core.setProps({ pauseOnDrag: false });

      core.endDrag(playback);
      expect(playback.play).toHaveBeenCalledTimes(1);
    });

    it('does not resume on a second endDrag', () => {
      const core = new TimeSliderCore({ pauseOnDrag: true });
      const playback = createPlaybackState();

      core.startDrag(playback);
      core.endDrag(playback);
      core.endDrag(playback);

      expect(playback.play).toHaveBeenCalledTimes(1);
    });
  });
});
