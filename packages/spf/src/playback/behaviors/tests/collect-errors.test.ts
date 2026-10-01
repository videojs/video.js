import { describe, expect, it, vi } from 'vite-plus/test';

import { signal } from '../../../core/signals/primitives';
import { SVTA_NO_SUPPORTED_AUDIO_TRACK, SVTA_NO_SUPPORTED_VIDEO_TRACK, type SvtaError } from '../../../media/errors';
import type { MaybeResolvedPresentation, Presentation } from '../../../media/types';
import { collectErrors, emitError } from '../collect-errors';

const resolved = (id = 'pres-1'): Presentation =>
  ({ id, url: 'https://example.com/master.m3u8', startTime: 0, selectionSets: [] }) as Presentation;

const makeState = (presentation?: MaybeResolvedPresentation) => ({
  presentation: signal<MaybeResolvedPresentation | undefined>(presentation),
  errors: signal<SvtaError[] | undefined>(undefined),
});

const flush = () => Promise.resolve().then(() => Promise.resolve());

describe('emitError', () => {
  it('appends onto an empty slot', () => {
    const errors = signal<SvtaError[] | undefined>(undefined);

    emitError({ errors }, { code: SVTA_NO_SUPPORTED_VIDEO_TRACK });
    expect(errors.get()).toEqual([{ code: SVTA_NO_SUPPORTED_VIDEO_TRACK }]);
  });

  it('preserves emission order across reporters', () => {
    const errors = signal<SvtaError[] | undefined>(undefined);

    emitError({ errors }, { code: SVTA_NO_SUPPORTED_VIDEO_TRACK });
    emitError({ errors }, { code: SVTA_NO_SUPPORTED_AUDIO_TRACK });
    expect(errors.get()?.map((error) => error.code)).toEqual([
      SVTA_NO_SUPPORTED_VIDEO_TRACK,
      SVTA_NO_SUPPORTED_AUDIO_TRACK,
    ]);
  });

  it('keeps duplicate codes — a repeat is a real observation, not noise', () => {
    const errors = signal<SvtaError[] | undefined>(undefined);

    emitError({ errors }, { code: SVTA_NO_SUPPORTED_VIDEO_TRACK });
    emitError({ errors }, { code: SVTA_NO_SUPPORTED_VIDEO_TRACK });
    expect(errors.get()).toHaveLength(2);
  });

  it('carries optional message and data through unchanged', () => {
    const errors = signal<SvtaError[] | undefined>(undefined);

    emitError({ errors }, { code: SVTA_NO_SUPPORTED_VIDEO_TRACK, message: 'nope', data: { trackType: 'video' } });
    expect(errors.get()?.[0]).toEqual({
      code: SVTA_NO_SUPPORTED_VIDEO_TRACK,
      message: 'nope',
      data: { trackType: 'video' },
    });
  });

  it('replaces the array rather than mutating it, so signal consumers notify', () => {
    const errors = signal<SvtaError[] | undefined>(undefined);

    emitError({ errors }, { code: SVTA_NO_SUPPORTED_VIDEO_TRACK });
    const first = errors.get();

    emitError({ errors }, { code: SVTA_NO_SUPPORTED_AUDIO_TRACK });
    expect(errors.get()).not.toBe(first);
    expect(first).toHaveLength(1);
  });

  it('no-ops when no owner is composed', () => {
    expect(() => emitError({}, { code: SVTA_NO_SUPPORTED_VIDEO_TRACK })).not.toThrow();
  });

  it('logs every emission', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const errors = signal<SvtaError[] | undefined>(undefined);
    const reported = { code: SVTA_NO_SUPPORTED_VIDEO_TRACK, data: { trackType: 'video' } };

    emitError({ errors }, reported);

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('[spf]'), reported);
    spy.mockRestore();
  });

  it('logs even when no owner is composed — the only trace of a dropped emission', () => {
    // The log sits before the owner check on purpose: without a collector this
    // condition reaches nothing at all, so the log is the whole record of it.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    emitError({}, { code: SVTA_NO_SUPPORTED_VIDEO_TRACK });

    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});

describe('collectErrors', () => {
  it('does not clear on a live reload — a new presentation object, still resolved', async () => {
    const state = makeState(resolved());
    const reactor = collectErrors.setup({ state });

    await flush();

    emitError(state, { code: SVTA_NO_SUPPORTED_VIDEO_TRACK });
    await flush();

    expect(state.errors.get()).toEqual([{ code: SVTA_NO_SUPPORTED_VIDEO_TRACK }]);

    // A live media-playlist reload swaps in a new presentation object without
    // ever leaving the resolved state; errors must survive it.
    state.presentation.set(resolved());
    await flush();

    expect(state.errors.get()).toHaveLength(1);

    reactor.destroy();
  });

  it('clears errors on src unload so the next source starts clean', async () => {
    const state = makeState(resolved());
    const reactor = collectErrors.setup({ state });

    await flush();

    emitError(state, { code: SVTA_NO_SUPPORTED_VIDEO_TRACK });
    await flush();

    state.presentation.set(undefined);
    await flush();

    expect(state.errors.get()).toBeUndefined();

    reactor.destroy();
  });

  it('clears errors on behavior destroy', async () => {
    const state = makeState(resolved());
    const reactor = collectErrors.setup({ state });

    await flush();

    emitError(state, { code: SVTA_NO_SUPPORTED_VIDEO_TRACK });
    await flush();

    reactor.destroy();
    await flush();

    expect(state.errors.get()).toBeUndefined();
  });
});
