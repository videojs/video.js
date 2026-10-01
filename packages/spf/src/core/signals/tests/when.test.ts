import { Signal } from 'signal-polyfill';
import { describe, expect, it, vi } from 'vite-plus/test';

import { signal } from '../primitives';
import { when } from '../when';

describe('when', () => {
  it('resolves without waiting when the condition already holds', async () => {
    await expect(when(() => true)).resolves.toBeUndefined();
  });

  it('resolves once a signal flips the condition true', async () => {
    const ready = signal(false);
    let resolved = false;
    const settled = when(() => ready.get()).then(() => {
      resolved = true;
    });

    // Effects run a microtask after the write — nothing settles before it.
    await Promise.resolve();
    expect(resolved).toBe(false);

    ready.set(true);
    await settled;
    expect(resolved).toBe(true);
  });

  it('re-evaluates only on tracked-signal changes, and stops after settling', async () => {
    const ready = signal(false);
    const condition = vi.fn(() => ready.get());
    const settled = when(condition);

    expect(Signal.subtle.hasSinks(ready)).toBe(true);
    ready.set(true);
    await settled;
    await Promise.resolve();
    expect(Signal.subtle.hasSinks(ready)).toBe(false);

    const callsWhenSettled = condition.mock.calls.length;

    ready.set(false);
    ready.set(true);
    await Promise.resolve();
    await Promise.resolve();
    expect(condition.mock.calls.length).toBe(callsWhenSettled);
  });

  it('rejects with the abort reason when the signal aborts first', async () => {
    const ready = signal(false);
    const controller = new AbortController();
    const settled = when(() => ready.get(), { signal: controller.signal });

    const reason = new Error('source changed');

    controller.abort(reason);
    await expect(settled).rejects.toBe(reason);
  });

  it('rejects immediately on an already-aborted signal without evaluating the condition', async () => {
    const controller = new AbortController();
    const reason = new Error('gone');

    controller.abort(reason);

    const condition = vi.fn(() => true);

    await expect(when(condition, { signal: controller.signal })).rejects.toBe(reason);
    expect(condition).not.toHaveBeenCalled();
  });
});
