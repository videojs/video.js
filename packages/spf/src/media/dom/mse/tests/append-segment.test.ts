import { describe, expect, it, vi } from 'vite-plus/test';

import { appendSegment } from '../append-segment';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSourceBuffer(): SourceBuffer {
  const listeners: Record<string, EventListener[]> = {};

  return {
    updating: false,
    abort: vi.fn(),
    appendBuffer: vi.fn(() => {
      setTimeout(() => {
        for (const listener of listeners.updateend ?? []) listener(new Event('updateend'));
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

function makeControlledSourceBuffer(initialUpdating = false) {
  const target = Object.assign(new EventTarget(), { updating: initialUpdating });
  const sourceBuffer = Object.assign(target, {
    appendBuffer: vi.fn(() => {
      if (target.updating) throw new DOMException('Buffer is updating', 'InvalidStateError');

      target.updating = true;
    }),
  }) as unknown as SourceBuffer;
  const finishUpdating = () => {
    target.updating = false;
    target.dispatchEvent(new Event('updateend'));
  };

  return { sourceBuffer, finishUpdating };
}

async function* chunks(...buffers: ArrayBuffer[]): AsyncGenerator<Uint8Array> {
  for (const buf of buffers) yield new Uint8Array(buf);
}

// ---------------------------------------------------------------------------
// ArrayBuffer path
// ---------------------------------------------------------------------------

describe('appendSegment', () => {
  it('calls appendBuffer once for an ArrayBuffer', async () => {
    const sb = makeSourceBuffer();

    await appendSegment(sb, new ArrayBuffer(8));
    expect(sb.appendBuffer).toHaveBeenCalledTimes(1);
  });

  it('resolves after updateend for ArrayBuffer', async () => {
    const { sourceBuffer, finishUpdating } = makeControlledSourceBuffer();
    const settled = vi.fn();
    const pending = appendSegment(sourceBuffer, new ArrayBuffer(4));

    void pending.then(settled, settled);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sourceBuffer.appendBuffer).toHaveBeenCalledOnce();
    expect(settled).not.toHaveBeenCalled();

    finishUpdating();
    await expect(pending).resolves.toBeUndefined();
    expect(settled).toHaveBeenCalledOnce();
  });

  it('waits for updating=false before appending', async () => {
    const { sourceBuffer, finishUpdating } = makeControlledSourceBuffer(true);
    const settled = vi.fn();
    const pending = appendSegment(sourceBuffer, new ArrayBuffer(4));

    void pending.then(settled, settled);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sourceBuffer.appendBuffer).not.toHaveBeenCalled();
    expect(settled).not.toHaveBeenCalled();

    finishUpdating();
    await vi.waitFor(() => expect(sourceBuffer.appendBuffer).toHaveBeenCalledOnce());
    expect(settled).not.toHaveBeenCalled();

    finishUpdating();
    await expect(pending).resolves.toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // AsyncIterable path
  // ---------------------------------------------------------------------------

  it('calls appendBuffer once per chunk for AsyncIterable', async () => {
    const sb = makeSourceBuffer();

    await appendSegment(sb, chunks(new ArrayBuffer(4), new ArrayBuffer(4), new ArrayBuffer(4)));
    expect(sb.appendBuffer).toHaveBeenCalledTimes(3);
  });

  it('resolves after all chunks are appended', async () => {
    const { sourceBuffer, finishUpdating } = makeControlledSourceBuffer();
    const settled = vi.fn();
    const pending = appendSegment(sourceBuffer, chunks(new ArrayBuffer(4), new ArrayBuffer(8)));

    void pending.then(settled, settled);
    await vi.waitFor(() => expect(sourceBuffer.appendBuffer).toHaveBeenCalledTimes(1));
    expect(settled).not.toHaveBeenCalled();

    finishUpdating();
    await vi.waitFor(() => expect(sourceBuffer.appendBuffer).toHaveBeenCalledTimes(2));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(settled).not.toHaveBeenCalled();

    finishUpdating();
    await expect(pending).resolves.toBeUndefined();
    expect(settled).toHaveBeenCalledOnce();
  });

  it('calls sourceBuffer.abort() and throws when signal is aborted between chunks', async () => {
    const sb = makeSourceBuffer();
    const controller = new AbortController();

    async function* twoChunks(): AsyncGenerator<Uint8Array> {
      yield new Uint8Array(4);
      controller.abort();
      yield new Uint8Array(4);
    }

    await expect(appendSegment(sb, twoChunks(), controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(sb.abort).toHaveBeenCalledOnce();
    // Only the first chunk should have been appended
    expect(sb.appendBuffer).toHaveBeenCalledOnce();
  });

  it('calls sourceBuffer.abort() when the stream itself throws an AbortError', async () => {
    const sb = makeSourceBuffer();

    async function* abortingStream(): AsyncGenerator<Uint8Array> {
      yield new Uint8Array(4);
      throw new DOMException('Aborted', 'AbortError');
    }

    await expect(appendSegment(sb, abortingStream())).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(sb.abort).toHaveBeenCalledOnce();
  });

  it('does not call sourceBuffer.abort() for non-abort stream errors', async () => {
    const sb = makeSourceBuffer();

    async function* errorStream(): AsyncGenerator<Uint8Array> {
      yield new Uint8Array(4);
      throw new Error('network error');
    }

    await expect(appendSegment(sb, errorStream())).rejects.toThrow('network error');
    expect(sb.abort).not.toHaveBeenCalled();
  });

  it('passes chunk bytes through to appendBuffer unchanged', async () => {
    const sb = makeSourceBuffer();
    const data = new Uint8Array([1, 2, 3, 4]);

    await appendSegment(
      sb,
      (async function* () {
        yield data;
      })()
    );

    const appended = (sb.appendBuffer as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];

    expect(Array.from(new Uint8Array(appended as ArrayBuffer))).toEqual([1, 2, 3, 4]);
  });

  it('appends chunks in order', async () => {
    const appended: number[][] = [];

    const listeners: Record<string, EventListener[]> = {};
    const sb = {
      updating: false,
      appendBuffer: vi.fn((data: ArrayBuffer) => {
        appended.push(Array.from(new Uint8Array(data)));
        setTimeout(() => {
          for (const l of listeners.updateend ?? []) l(new Event('updateend'));
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

    const chunk1 = new Uint8Array([1, 2]);
    const chunk2 = new Uint8Array([3, 4]);
    const chunk3 = new Uint8Array([5, 6]);

    await appendSegment(
      sb,
      (async function* () {
        yield chunk1;
        yield chunk2;
        yield chunk3;
      })()
    );

    expect(appended).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
  });
});
