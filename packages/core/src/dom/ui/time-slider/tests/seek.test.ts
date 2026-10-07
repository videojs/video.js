import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { createTimeSliderSeek } from '../seek';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('createTimeSliderSeek', () => {
  it('holds the latest seek target until seeking and the configured transition finish', () => {
    const element = document.createElement('div');
    // SAFETY: only these transition fields are read from the animation stub.
    const animation = { transitionProperty: 'opacity', playState: 'running' } as CSSTransition;
    const animations = vi.fn(() => [animation]);

    element.getAnimations = animations;
    const seek = createTimeSliderSeek('opacity');

    seek.update(false, 10, element);
    seek.seek(70);
    seek.update(true, 70, element);
    vi.advanceTimersByTime(32);
    expect(seek.state.current.percent).toBe(70);

    seek.seek(20);
    seek.update(false, 20, element);
    vi.advanceTimersByTime(32);
    expect(seek.state.current.percent).toBe(20);

    animations.mockReturnValue([]);
    vi.advanceTimersByTime(16);
    expect(seek.state.current.percent).toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
    seek.destroy();
  });

  it('handles external seeks without animations and cancels pending work on teardown', () => {
    const seek = createTimeSliderSeek('opacity');

    seek.update(true, 30, null);
    vi.advanceTimersByTime(32);
    expect(seek.state.current.percent).toBe(30);

    seek.update(false, 30, null);
    vi.advanceTimersByTime(16);
    expect(seek.state.current.percent).toBeUndefined();

    seek.seek(80);
    seek.destroy();
    expect(seek.state.current.percent).toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
  });
});
