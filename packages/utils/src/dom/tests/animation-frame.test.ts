import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { animationFrame } from '../animation-frame';

describe('animationFrame', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls the callback on next animation frame', async () => {
    const callback = vi.fn();

    animationFrame(callback);

    expect(callback).not.toHaveBeenCalled();

    await vi.runAllTimersAsync();

    expect(callback).toHaveBeenCalledOnce();
  });

  it('passes timestamp to callback', async () => {
    const callback = vi.fn();

    animationFrame(callback);
    await vi.runAllTimersAsync();

    expect(callback).toHaveBeenCalledWith(expect.any(Number));
  });

  it('cancel prevents callback from being called', async () => {
    const callback = vi.fn();

    const cancel = animationFrame(callback);

    cancel();

    await vi.runAllTimersAsync();

    expect(callback).not.toHaveBeenCalled();
  });

  it('cancel can be called multiple times safely', async () => {
    const callback = vi.fn();

    const cancel = animationFrame(callback);

    cancel();
    cancel();
    cancel();

    await vi.runAllTimersAsync();

    expect(callback).not.toHaveBeenCalled();
  });

  it('allows multiple independent animation frames', async () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const callback3 = vi.fn();

    animationFrame(callback1);
    animationFrame(callback2);
    const cancel3 = animationFrame(callback3);

    cancel3();
    await vi.runAllTimersAsync();

    expect(callback1).toHaveBeenCalledOnce();
    expect(callback2).toHaveBeenCalledOnce();
    expect(callback3).not.toHaveBeenCalled();
  });
});
