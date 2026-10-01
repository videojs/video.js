import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { sleep } from '../sleep';

afterEach(() => {
  vi.useRealTimers();
});

describe('sleep', () => {
  it('resolves after the given delay', async () => {
    vi.useFakeTimers();
    const resolved = vi.fn();
    const promise = sleep(100).then(resolved);

    await vi.advanceTimersByTimeAsync(99);
    expect(resolved).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    await promise;
    expect(resolved).toHaveBeenCalledTimes(1);
  });

  it('rejects with the signal reason and clears the timer when aborted mid-wait', async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const reason = new DOMException('Aborted', 'AbortError');
    const promise = sleep(100, controller.signal);
    const rejection = expect(promise).rejects.toBe(reason);

    expect(vi.getTimerCount()).toBe(1);

    controller.abort(reason);
    expect(vi.getTimerCount()).toBe(0);
    await rejection;
  });

  it('rejects immediately when the signal is already aborted', async () => {
    const controller = new AbortController();
    const reason = new DOMException('Aborted', 'AbortError');

    controller.abort(reason);

    await expect(sleep(100, controller.signal)).rejects.toBe(reason);
  });
});
