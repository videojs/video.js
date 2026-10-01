import { describe, expect, it, vi } from 'vite-plus/test';

import { flushBuffer } from '../buffer-flusher';

function makeSourceBuffer(): SourceBuffer {
  const listeners: Record<string, EventListener[]> = {};

  return {
    updating: false,
    remove: vi.fn(() => {
      setTimeout(() => {
        for (const listener of listeners.updateend ?? []) {
          listener(new Event('updateend'));
        }
      }, 0);
    }),
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      listeners[type] ??= [];
      listeners[type].push(listener);
    }),
    removeEventListener: vi.fn((type: string, listener: EventListener) => {
      listeners[type] = (listeners[type] ?? []).filter((l) => l !== listener);
    }),
  } as unknown as SourceBuffer;
}

describe('flushBuffer', () => {
  it('calls SourceBuffer.remove with the given time range', async () => {
    const sourceBuffer = makeSourceBuffer();

    await flushBuffer(sourceBuffer, 0, 30);

    expect(sourceBuffer.remove).toHaveBeenCalledWith(0, 30);
  });

  it('resolves when updateend fires', async () => {
    const target = Object.assign(new EventTarget(), { updating: false });
    const sourceBuffer = Object.assign(target, {
      remove: vi.fn(() => {
        target.updating = true;
      }),
    }) as unknown as SourceBuffer;
    const settled = vi.fn();
    const pending = flushBuffer(sourceBuffer, 0, 10);

    void pending.then(settled, settled);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sourceBuffer.remove).toHaveBeenCalledWith(0, 10);
    expect(settled).not.toHaveBeenCalled();

    target.updating = false;
    target.dispatchEvent(new Event('updateend'));
    await expect(pending).resolves.toBeUndefined();
    expect(settled).toHaveBeenCalledOnce();
  });

  it('waits for SourceBuffer to finish updating before removing', async () => {
    const listeners: Record<string, EventListener[]> = {};
    let updateEndCallback: (() => void) | undefined;

    const sourceBuffer = {
      updating: true,
      remove: vi.fn(() => {
        setTimeout(() => {
          for (const listener of listeners.updateend ?? []) {
            listener(new Event('updateend'));
          }
        }, 0);
      }),
      addEventListener: vi.fn((type: string, listener: EventListener) => {
        listeners[type] ??= [];
        listeners[type].push(listener);

        if (type === 'updateend' && sourceBuffer.updating) {
          updateEndCallback = () => listener(new Event('updateend'));
        }
      }),
      removeEventListener: vi.fn((type: string, listener: EventListener) => {
        listeners[type] = (listeners[type] ?? []).filter((l) => l !== listener);
      }),
    } as unknown as SourceBuffer;

    const flushPromise = flushBuffer(sourceBuffer, 0, 10);

    // remove should not have been called yet (still updating)
    expect(sourceBuffer.remove).not.toHaveBeenCalled();

    // Simulate the previous operation finishing
    (sourceBuffer as any).updating = false;

    if (updateEndCallback) updateEndCallback();

    await flushPromise;
    expect(sourceBuffer.remove).toHaveBeenCalledWith(0, 10);
  });

  it('rejects when SourceBuffer fires an error event', async () => {
    const listeners: Record<string, EventListener[]> = {};

    const sourceBuffer = {
      updating: false,
      remove: vi.fn(() => {
        setTimeout(() => {
          for (const listener of listeners.error ?? []) {
            listener(new Event('error'));
          }
        }, 0);
      }),
      addEventListener: vi.fn((type: string, listener: EventListener) => {
        listeners[type] ??= [];
        listeners[type].push(listener);
      }),
      removeEventListener: vi.fn((type: string, listener: EventListener) => {
        listeners[type] = (listeners[type] ?? []).filter((l) => l !== listener);
      }),
    } as unknown as SourceBuffer;

    await expect(flushBuffer(sourceBuffer, 0, 10)).rejects.toThrow('SourceBuffer remove error');
  });

  it('rejects when remove() throws synchronously', async () => {
    const sourceBuffer = makeSourceBuffer();

    (sourceBuffer.remove as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    await expect(flushBuffer(sourceBuffer, 0, 10)).rejects.toThrow('QuotaExceededError');
  });
});
