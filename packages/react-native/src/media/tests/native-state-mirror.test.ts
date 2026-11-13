import { describe, expect, it } from 'vite-plus/test';

import { initialNativeState, NativeStateMirror } from '../native-state-mirror';

describe('NativeStateMirror', () => {
  it('starts as a media element does', () => {
    expect(new NativeStateMirror().state).toEqual(initialNativeState);
  });

  it('applies only the fields an update carries', () => {
    const mirror = new NativeStateMirror();

    mirror.apply({ version: 1, patch: { paused: false }, events: ['play'] });

    expect(mirror.state).toEqual({ ...initialNativeState, paused: false });
  });

  it('keeps a command applied synchronously over an older update arriving late', () => {
    const mirror = new NativeStateMirror();
    const tick = { version: 5, patch: { currentTime: 12, buffered: [{ start: 12, end: 20 }] }, events: ['timeupdate'] };
    const seek = { version: 6, patch: { currentTime: 40, seeking: true }, events: ['seeking', 'timeupdate'] };

    mirror.apply(seek);
    const applied = mirror.apply(tick);

    expect(mirror.state.currentTime).toBe(40);
    expect(mirror.state.seeking).toBe(true);
    // Fields the newer update didn't touch still land.
    expect(applied).toEqual(['buffered']);
    expect(mirror.state.buffered).toEqual([{ start: 12, end: 20 }]);
  });

  it('ignores an update it has already applied', () => {
    const mirror = new NativeStateMirror();
    const update = { version: 3, patch: { currentTime: 7 }, events: ['timeupdate'] };

    mirror.apply(update);
    const before = mirror.state;

    expect(mirror.apply(update)).toEqual([]);
    expect(mirror.state).toBe(before);
  });

  it('clears the error on an explicit null', () => {
    const mirror = new NativeStateMirror();

    mirror.apply({ version: 1, patch: { error: { code: 2, message: 'network' } }, events: ['error'] });
    mirror.apply({ version: 2, patch: { error: null }, events: [] });

    expect(mirror.state.error).toBeNull();
  });

  it('replaces state rather than mutating it, so a held snapshot stays consistent', () => {
    const mirror = new NativeStateMirror();
    const snapshot = mirror.state;

    mirror.apply({ version: 1, patch: { currentTime: 3, seeking: true }, events: [] });

    expect(snapshot.currentTime).toBe(0);
    expect(mirror.state).not.toBe(snapshot);
  });
});
