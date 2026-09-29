import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import type { MediaSnapshot } from '../../input-action';
import { StatusAnnouncerCore } from '../core';

describe('StatusAnnouncerCore', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('uses the first snapshot as a baseline only', () => {
    const core = new StatusAnnouncerCore();

    expect(core.processSnapshot({ paused: false, volume: 0.5, muted: false })).toBe(false);
    expect(core.state.current.label).toBeNull();
  });

  it('uses the first snapshot after reset as a baseline only', () => {
    const core = new StatusAnnouncerCore();

    core.processSnapshot({ paused: false, volume: 0.5, muted: false });
    core.resetSnapshot();

    expect(core.processSnapshot({ paused: true, volume: 0.75, muted: true })).toBe(false);

    vi.advanceTimersByTime(200);

    expect(core.state.current.label).toBeNull();
  });

  it('clears pending debounced announcements when reset', () => {
    const core = new StatusAnnouncerCore();

    core.processSnapshot({ volume: 0.5, muted: false });
    core.processSnapshot({ volume: 0.75, muted: false });
    core.resetSnapshot();

    vi.advanceTimersByTime(200);

    expect(core.state.current.label).toBeNull();
  });

  it('clears pending volume announcements when an immediate snapshot announcement wins', () => {
    const core = new StatusAnnouncerCore();

    core.processSnapshot({ paused: true, volume: 0.5, muted: false });
    core.processSnapshot({ paused: true, volume: 0.75, muted: false });
    core.processSnapshot({ paused: false, volume: 0.75, muted: false });

    expect(core.state.current.label).toBe('Playing');

    vi.advanceTimersByTime(200);

    expect(core.state.current.label).toBe('Playing');
  });

  it('clears pending seek announcements when an immediate snapshot announcement wins', () => {
    const core = new StatusAnnouncerCore();

    core.processSnapshot({ playbackRate: 1, currentTime: 10, duration: 120, seeking: false });
    core.processSnapshot({ playbackRate: 1, currentTime: 45, duration: 120, seeking: true });
    core.processSnapshot({ playbackRate: 1, currentTime: 45, duration: 120, seeking: false });
    core.processSnapshot({ playbackRate: 1.25, currentTime: 45, duration: 120, seeking: false });

    expect(core.state.current.label).toBe('Playback rate 1.25×');

    vi.advanceTimersByTime(200);

    expect(core.state.current.label).toBe('Playback rate 1.25×');
  });

  it('rechecks volume suppression when the debounced announcement fires', () => {
    let shouldAnnounce = true;
    const core = new StatusAnnouncerCore();

    core.setProps({ shouldAnnounce: () => shouldAnnounce });

    core.processSnapshot({ volume: 0.5, muted: false });
    expect(core.processSnapshot({ volume: 0.75, muted: false })).toBe(true);
    shouldAnnounce = false;

    vi.advanceTimersByTime(200);

    expect(core.state.current.label).toBeNull();
  });

  it('rechecks seek suppression when the debounced announcement fires', () => {
    let shouldAnnounce = true;
    const core = new StatusAnnouncerCore();

    core.setProps({ shouldAnnounce: () => shouldAnnounce });

    core.processSnapshot({ currentTime: 10, duration: 120, seeking: false });
    core.processSnapshot({ currentTime: 45, duration: 120, seeking: true });
    expect(core.processSnapshot({ currentTime: 45, duration: 120, seeking: false })).toBe(true);
    shouldAnnounce = false;

    vi.advanceTimersByTime(200);

    expect(core.state.current.label).toBeNull();
  });

  it('announces confirmed playback, captions, fullscreen, pip, and playback-rate changes', () => {
    const core = new StatusAnnouncerCore();
    const process = createSnapshotProcessor(core, {
      paused: true,
      subtitlesShowing: false,
      subtitlesAvailable: true,
      isFullscreen: false,
      isPictureInPicture: false,
      playbackRate: 1,
    });

    for (const [partial, label] of [
      [{ paused: false }, 'Playing'],
      [{ subtitlesShowing: true }, 'Captions on'],
      [{ isFullscreen: true }, 'Fullscreen'],
      [{ isPictureInPicture: true }, 'Picture in picture'],
      [{ playbackRate: 1.5 }, 'Playback rate 1.5×'],
    ] as const) {
      expect(process(partial)).toBe(true);
      expect(core.state.current.label).toBe(label);
    }
  });

  it('debounces volume snapshot announcements to the final value', () => {
    const core = new StatusAnnouncerCore();
    const process = createSnapshotProcessor(core, { volume: 0.5, muted: false });

    expect(process({ volume: 0.55 })).toBe(true);
    expect(process({ volume: 0.6 })).toBe(true);
    expect(core.state.current.label).toBeNull();

    vi.advanceTimersByTime(199);
    expect(core.state.current.label).toBeNull();

    vi.advanceTimersByTime(1);
    expect(core.state.current.label).toBe('Volume 60%');
  });

  it('replaces a pending volume announcement with a completed seek', () => {
    const core = new StatusAnnouncerCore();
    const process = createSnapshotProcessor(core, {
      currentTime: 10,
      seeking: false,
      volume: 0.5,
      muted: false,
    });

    process({ volume: 0.75 });
    vi.advanceTimersByTime(100);
    process({ currentTime: 45, seeking: true });
    process({ seeking: false });

    vi.advanceTimersByTime(100);
    expect(core.state.current.label).toBeNull();

    vi.advanceTimersByTime(100);
    expect(core.state.current.label).toBe('Seeked to 45 seconds');
  });

  it('replaces a pending seek announcement with a volume change', () => {
    const core = new StatusAnnouncerCore();
    const process = createSnapshotProcessor(core, {
      currentTime: 10,
      seeking: false,
      volume: 0.5,
      muted: false,
    });

    process({ currentTime: 45, seeking: true });
    process({ seeking: false });
    vi.advanceTimersByTime(100);
    process({ volume: 0.75 });

    vi.advanceTimersByTime(100);
    expect(core.state.current.label).toBeNull();

    vi.advanceTimersByTime(100);
    expect(core.state.current.label).toBe('Volume 75%');
  });

  it('announces muted volume snapshots', () => {
    const core = new StatusAnnouncerCore();
    const process = createSnapshotProcessor(core, { volume: 0.5, muted: false });

    process({ muted: true });

    vi.advanceTimersByTime(200);

    expect(core.state.current.label).toBe('Muted');
  });

  it('increments the generation for repeated announcement labels', () => {
    const core = new StatusAnnouncerCore();
    const process = createSnapshotProcessor(core, { volume: 0.5, muted: false });

    process({ volume: 0 });
    vi.advanceTimersByTime(200);
    const firstGeneration = core.state.current.generation;

    process({ muted: true });
    vi.advanceTimersByTime(200);

    expect(core.state.current.label).toBe('Muted');
    expect(core.state.current.generation).toBe(firstGeneration + 1);
  });

  it('ignores regular currentTime updates and announces completed seeks once', () => {
    const core = new StatusAnnouncerCore();
    const process = createSnapshotProcessor(core, { currentTime: 10, duration: 120, seeking: false });

    expect(process({ currentTime: 11 })).toBe(false);
    expect(core.state.current.label).toBeNull();

    expect(process({ currentTime: 40, seeking: true })).toBe(false);
    expect(process({ currentTime: 45 })).toBe(false);
    expect(process({ seeking: false })).toBe(true);
    expect(core.state.current.label).toBeNull();

    vi.advanceTimersByTime(200);

    expect(core.state.current.label).toBe('Seeked to 45 seconds');
  });

  it('announces a completed seek when volume changes in the same snapshot', () => {
    const core = new StatusAnnouncerCore();
    const process = createSnapshotProcessor(core, {
      currentTime: 10,
      duration: 120,
      seeking: false,
      volume: 0.5,
      muted: false,
    });

    process({ currentTime: 45, seeking: true });
    expect(process({ seeking: false, volume: 0.75 })).toBe(true);

    vi.advanceTimersByTime(200);

    expect(core.state.current.label).toBe('Seeked to 45 seconds');
  });

  it('allows seek announcements to be suppressed by callers', () => {
    const core = new StatusAnnouncerCore();

    core.setProps({ shouldAnnounce: () => false });
    const process = createSnapshotProcessor(core, { currentTime: 10, duration: 120, seeking: false });

    process({ currentTime: 45, seeking: true });
    expect(process({ seeking: false })).toBe(false);

    vi.advanceTimersByTime(200);

    expect(core.state.current.label).toBeNull();
  });

  it('allows volume announcements to be suppressed by callers', () => {
    const core = new StatusAnnouncerCore();

    core.setProps({ shouldAnnounce: () => false });
    const process = createSnapshotProcessor(core, { volume: 0.5, muted: false });

    expect(process({ volume: 0.75 })).toBe(false);

    vi.advanceTimersByTime(200);

    expect(core.state.current.label).toBeNull();
  });
});

function createSnapshotProcessor(core: StatusAnnouncerCore, initial: MediaSnapshot) {
  let snapshot = initial;

  core.processSnapshot(snapshot);

  return (partial: MediaSnapshot) => {
    snapshot = { ...snapshot, ...partial };
    return core.processSnapshot(snapshot);
  };
}
