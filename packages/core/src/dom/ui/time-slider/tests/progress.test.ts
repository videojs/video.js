import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { createTimeSliderProgress, type TimeSliderProgressState } from '../progress';

const media: TimeSliderProgressState = { currentTime: 10, duration: 25, playbackRate: 1, playing: true };

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('createTimeSliderProgress', () => {
  it('moves at a constant rate between cached media updates without restarting on render', () => {
    const progress = createTimeSliderProgress();

    progress.update(media, () => 10);

    vi.advanceTimersByTime(80);
    expect(progress.state.current.currentTime).toBeCloseTo(10.08);

    progress.update({ ...media }, () => 10);
    vi.advanceTimersByTime(80);
    expect(progress.state.current.currentTime).toBeCloseTo(10.16);
    progress.destroy();
  });

  it('reads native media time on each frame and follows a loop back to zero', () => {
    let time = 10;
    const progress = createTimeSliderProgress();

    progress.update(media, () => time);

    time = 10.2;
    vi.advanceTimersByTime(16);
    expect(progress.state.current.currentTime).toBe(10.2);

    time = 0;
    vi.advanceTimersByTime(16);
    expect(progress.state.current.currentTime).toBe(0);
    progress.destroy();
  });

  it('uses playback rate and clamps at the end', () => {
    const progress = createTimeSliderProgress();

    progress.update({ ...media, currentTime: 24.8, playbackRate: 2 });

    vi.advanceTimersByTime(80);
    expect(progress.state.current.currentTime).toBeCloseTo(24.96);
    vi.advanceTimersByTime(80);
    expect(progress.state.current.currentTime).toBe(25);
    progress.destroy();
  });

  it('stops at the authoritative position and restarts from a seek or rate change', () => {
    const progress = createTimeSliderProgress();

    progress.update(media);
    vi.advanceTimersByTime(80);

    progress.update({ ...media, currentTime: 10.05, playing: false });
    vi.advanceTimersByTime(160);
    expect(progress.state.current.currentTime).toBe(10.05);

    progress.update({ ...media, currentTime: 5, playbackRate: 2 });
    vi.advanceTimersByTime(80);
    expect(progress.state.current.currentTime).toBeCloseTo(5.16);
    progress.destroy();
  });

  it('does not move backwards when a store snapshot lags native media time', () => {
    let time = 10;
    const progress = createTimeSliderProgress();

    progress.update(media, () => time);
    time = 10.2;
    vi.advanceTimersByTime(16);

    progress.update({ ...media, currentTime: 10.1 }, () => time);
    expect(progress.state.current.currentTime).toBe(10.2);
    expect(progress.state.current.advancing).toBe(true);
    progress.destroy();
  });

  it('waits for a slowly advancing sampled clock to catch up without reversing', () => {
    let time = 10;
    const progress = createTimeSliderProgress();

    progress.update(media, () => time);
    vi.advanceTimersByTime(48);
    expect(progress.state.current.currentTime).toBeCloseTo(10.048);

    time = 10.03;
    vi.advanceTimersByTime(16);
    expect(progress.state.current.currentTime).toBeCloseTo(10.048);

    time = 10.08;
    vi.advanceTimersByTime(16);
    expect(progress.state.current.currentTime).toBe(10.08);
    progress.destroy();
  });

  it('holds a seek target until the configured transition finishes, then resumes from native time', () => {
    let time = 10;
    // SAFETY: the clock only reads these transition fields from the animation stub.
    const animation = { transitionProperty: 'opacity', playState: 'running' } as CSSTransition;
    const element = document.createElement('div');
    const animations = vi.fn(() => [animation]);

    element.getAnimations = animations;
    const progress = createTimeSliderProgress('opacity');

    progress.update(media, () => time, element);
    vi.advanceTimersByTime(16);
    progress.seek(20);
    time = 20;
    progress.update({ ...media, currentTime: 10, playing: false, seeking: true }, () => time, element);
    vi.advanceTimersByTime(32);
    expect(progress.state.current).toEqual({ currentTime: 20, advancing: false });

    progress.update({ ...media, currentTime: 20, seeking: false }, () => time, element);
    time = 20.05;
    vi.advanceTimersByTime(32);
    expect(progress.state.current).toEqual({ currentTime: 20, advancing: false });

    animations.mockReturnValue([]);
    vi.advanceTimersByTime(16);
    expect(progress.state.current).toEqual({ currentTime: 20.05, advancing: true });
    progress.destroy();
  });

  it('settles a paused seek without scheduling continuous playback frames', () => {
    const progress = createTimeSliderProgress();

    progress.update({ ...media, playing: false });
    progress.seek(5);
    progress.update({ ...media, currentTime: 5, playing: false });
    vi.advanceTimersByTime(32);
    expect(progress.state.current).toEqual({ currentTime: 5, advancing: false });
    expect(vi.getTimerCount()).toBe(0);
    progress.destroy();
  });

  it('cancels frames on teardown and can reconnect', () => {
    const readTime = vi.fn(() => undefined);
    const progress = createTimeSliderProgress();

    progress.update(media, readTime);
    vi.advanceTimersByTime(16);
    progress.destroy();
    readTime.mockClear();

    vi.advanceTimersByTime(160);
    expect(readTime).not.toHaveBeenCalled();

    progress.update({ ...media, currentTime: 0 });
    vi.advanceTimersByTime(16);
    expect(progress.state.current.currentTime).toBeCloseTo(0.016);
    progress.destroy();
  });
});
