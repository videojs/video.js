import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { VolumeIndicatorCore } from '../core';

describe('VolumeIndicatorCore', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('opens with scoped volume state for volume actions only', () => {
    const core = new VolumeIndicatorCore();

    expect(core.processEvent({ action: 'togglePaused' }, { volume: 0.5, muted: false })).toBe(false);
    expect(core.processEvent({ action: 'volumeStep', value: 0.05 }, { volume: 0.5, muted: false })).toBe(true);
    expect(core.state.current.open).toBe(true);
    expect(core.state.current.level).toBe('high');
    expect(core.state.current.value).toBe('55%');
    expect(core.state.current.fill).toBe('55%');
  });

  it('uses snapshot volume after mute feedback showed 0%', () => {
    const core = new VolumeIndicatorCore();

    core.processEvent({ action: 'toggleMuted' }, { volume: 0.5, muted: false });
    expect(core.state.current.value).toBe('0%');

    core.processEvent({ action: 'volumeStep', value: 0.05 }, { volume: 0.5, muted: true });
    expect(core.state.current.value).toBe('55%');
  });

  it('does not treat a zero volume step as a min/max boundary hit', () => {
    const core = new VolumeIndicatorCore();

    core.processEvent({ action: 'volumeStep', value: 0 }, { volume: 1, muted: false });
    expect(core.state.current.max).toBe(false);
    expect(core.state.current.min).toBe(false);

    core.processEvent({ action: 'volumeStep', value: 0 }, { volume: 0, muted: false });
    expect(core.state.current.max).toBe(false);
    expect(core.state.current.min).toBe(false);
  });

  it('does not restart boundary feedback for held keys', () => {
    const core = new VolumeIndicatorCore();

    core.processEvent({ action: 'volumeStep', value: 0.05 }, { volume: 1, muted: false });
    expect(core.state.current.max).toBe(true);

    core.processEvent({ action: 'volumeStep', value: 0.05, repeat: true }, { volume: 1, muted: false });
    expect(core.state.current.max).toBe(true);

    vi.advanceTimersByTime(300);
    expect(core.state.current.max).toBe(false);

    core.processEvent({ action: 'volumeStep', value: 0.05, repeat: true }, { volume: 1, muted: false });
    expect(core.state.current.max).toBe(false);

    core.processEvent({ action: 'volumeStep', value: 0.05, repeat: false }, { volume: 1, muted: false });
    expect(core.state.current.max).toBe(true);
  });

  it('closes after the configured delay', () => {
    const core = new VolumeIndicatorCore();

    core.setProps({ closeDelay: 100 });
    core.processEvent({ action: 'toggleMuted' }, { volume: 0.5, muted: false });

    vi.advanceTimersByTime(100);

    expect(core.state.current.open).toBe(false);
    expect(core.state.current.value).toBeNull();
  });
});
