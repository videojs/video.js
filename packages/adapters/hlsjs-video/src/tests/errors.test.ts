import { MediaError } from '@videojs/media';
import { HTMLVideoAdapter } from '@videojs/media/dom';
import Hls from 'hls.js';
import { describe, expect, it, vi } from 'vite-plus/test';

import { HlsJsErrorsMixin } from '../errors';

class FakeHost extends HTMLVideoAdapter {
  engine: Hls | null;

  constructor(engine: Hls | null = null) {
    super();
    this.engine = engine;
  }
}

const HlsJsErrors = HlsJsErrorsMixin(FakeHost);

function createEngine(): Hls {
  const listeners = new Map<string, Set<(...args: any[]) => void>>();

  return {
    on(event: string, fn: (...args: any[]) => void) {
      if (!listeners.has(event)) listeners.set(event, new Set());

      listeners.get(event)!.add(fn);
    },
    off(event: string, fn: (...args: any[]) => void) {
      listeners.get(event)?.delete(fn);
    },
    emit(event: string, ...args: any[]) {
      for (const fn of listeners.get(event) ?? []) fn(event, ...args);
    },
  } as unknown as Hls;
}

function setup() {
  const engine = createEngine();
  const host = new HlsJsErrors(engine);
  const video = document.createElement('video');

  host.attach(video);
  (engine as any).emit(Hls.Events.MEDIA_ATTACHING);
  (engine as any).emit(Hls.Events.MEDIA_ATTACHED);
  return { engine, host, video };
}

describe('HlsJsErrorsMixin', () => {
  it('captures an in-flight manifest failure before reattachment finishes', () => {
    const engine = createEngine();
    const host = new HlsJsErrors(engine);
    const video = document.createElement('video');
    const handler = vi.fn();

    host.addEventListener('error', handler);
    host.attach(video);
    (engine as any).emit(Hls.Events.MANIFEST_LOADING);
    host.detach();
    (engine as any).emit(Hls.Events.MEDIA_DETACHED);
    host.attach(video);
    (engine as any).emit(Hls.Events.MEDIA_ATTACHING);
    (engine as any).emit(Hls.Events.ERROR, {
      type: Hls.ErrorTypes.NETWORK_ERROR,
      details: Hls.ErrorDetails.MANIFEST_LOAD_ERROR,
      fatal: true,
      response: { code: 403 },
      error: new Error('Forbidden'),
    });

    expect(handler).toHaveBeenCalledOnce();
    expect(host.error!.data.response.code).toBe(403);

    const error = host.error;

    (engine as any).emit(Hls.Events.MEDIA_ATTACHED);

    expect(host.error).toBe(error);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('retains a fatal manifest error when MSE attachment completes later', () => {
    const engine = createEngine();
    const host = new HlsJsErrors(engine);

    host.attach(document.createElement('video'));
    (engine as any).emit(Hls.Events.MEDIA_ATTACHING);
    (engine as any).emit(Hls.Events.MANIFEST_LOADING);
    (engine as any).emit(Hls.Events.ERROR, {
      type: Hls.ErrorTypes.NETWORK_ERROR,
      details: Hls.ErrorDetails.MANIFEST_LOAD_ERROR,
      fatal: true,
      error: new Error('Forbidden'),
    });

    const error = host.error;

    expect(error).toBeInstanceOf(MediaError);

    (engine as any).emit(Hls.Events.MEDIA_ATTACHED);

    expect(host.error).toBe(error);
  });

  it('dispatches an error event on the host for fatal errors', () => {
    const { engine, host } = setup();

    const handler = vi.fn();

    host.addEventListener('error', handler);

    (engine as any).emit(Hls.Events.ERROR, {
      type: Hls.ErrorTypes.NETWORK_ERROR,
      details: Hls.ErrorDetails.MANIFEST_LOAD_ERROR,
      fatal: true,
      error: new Error('network failure'),
    });

    expect(handler).toHaveBeenCalledOnce();

    const event = handler.mock.calls[0]![0] as ErrorEvent;

    expect(event.error).toBeInstanceOf(MediaError);
    expect(event.error.code).toBe(MediaError.MEDIA_ERR_NETWORK);
    expect(event.error.fatal).toBe(true);
    expect(event.error.context).toBe(Hls.ErrorDetails.MANIFEST_LOAD_ERROR);
    expect(event.error.data).toBeDefined();
  });

  it('exposes the error via the error getter', () => {
    const { engine, host } = setup();

    expect(host.error).toBeNull();

    (engine as any).emit(Hls.Events.ERROR, {
      type: Hls.ErrorTypes.NETWORK_ERROR,
      details: Hls.ErrorDetails.MANIFEST_LOAD_ERROR,
      fatal: true,
      error: new Error('network failure'),
    });

    expect(host.error).toBeInstanceOf(MediaError);
    expect(host.error!.code).toBe(MediaError.MEDIA_ERR_NETWORK);
  });

  it('ignores non-fatal errors', () => {
    const { engine, host } = setup();

    const handler = vi.fn();

    host.addEventListener('error', handler);

    (engine as any).emit(Hls.Events.ERROR, {
      type: Hls.ErrorTypes.NETWORK_ERROR,
      details: Hls.ErrorDetails.FRAG_LOAD_ERROR,
      fatal: false,
      error: new Error('transient'),
    });

    expect(handler).not.toHaveBeenCalled();
    expect(host.error).toBeNull();
  });

  it('maps media errors to MEDIA_ERR_DECODE', () => {
    const { engine, host } = setup();

    const handler = vi.fn();

    host.addEventListener('error', handler);

    (engine as any).emit(Hls.Events.ERROR, {
      type: Hls.ErrorTypes.MEDIA_ERROR,
      details: Hls.ErrorDetails.BUFFER_APPEND_ERROR,
      fatal: true,
      error: new Error('decode'),
    });

    const event = handler.mock.calls[0]![0] as ErrorEvent;

    expect(event.error.code).toBe(MediaError.MEDIA_ERR_DECODE);
  });

  it('maps key system errors to MEDIA_ERR_ENCRYPTED', () => {
    const { engine, host } = setup();

    const handler = vi.fn();

    host.addEventListener('error', handler);

    (engine as any).emit(Hls.Events.ERROR, {
      type: Hls.ErrorTypes.KEY_SYSTEM_ERROR,
      details: Hls.ErrorDetails.KEY_SYSTEM_NO_KEYS,
      fatal: true,
      error: new Error('drm'),
    });

    const event = handler.mock.calls[0]![0] as ErrorEvent;

    expect(event.error.code).toBe(MediaError.MEDIA_ERR_ENCRYPTED);
  });

  it('stops listening after MEDIA_DETACHED', () => {
    const { engine, host } = setup();

    const handler = vi.fn();

    host.addEventListener('error', handler);

    (engine as any).emit(Hls.Events.MEDIA_DETACHED);

    (engine as any).emit(Hls.Events.ERROR, {
      type: Hls.ErrorTypes.NETWORK_ERROR,
      details: Hls.ErrorDetails.MANIFEST_LOAD_ERROR,
      fatal: true,
      error: new Error('after detach'),
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('resets error after MEDIA_DETACHED', () => {
    const { engine, host } = setup();

    (engine as any).emit(Hls.Events.ERROR, {
      type: Hls.ErrorTypes.NETWORK_ERROR,
      details: Hls.ErrorDetails.MANIFEST_LOAD_ERROR,
      fatal: true,
      error: new Error('failure'),
    });

    expect(host.error).not.toBeNull();

    (engine as any).emit(Hls.Events.MEDIA_DETACHED);

    expect(host.error).toBeNull();
  });

  it('preserves the original hls.js error as the message source', () => {
    const { engine, host } = setup();

    const handler = vi.fn();

    host.addEventListener('error', handler);

    (engine as any).emit(Hls.Events.ERROR, {
      type: Hls.ErrorTypes.OTHER_ERROR,
      details: Hls.ErrorDetails.INTERNAL_EXCEPTION,
      fatal: true,
      error: new Error('something broke'),
    });

    const event = handler.mock.calls[0]![0] as ErrorEvent;

    expect(event.error.code).toBe(MediaError.MEDIA_ERR_CUSTOM);
    expect(event.error.message).toContain('something broke');
  });
});
