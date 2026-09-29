import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { StatusIndicatorCore } from '../core';

describe('StatusIndicatorCore', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('honors the optional action filter', () => {
    const core = new StatusIndicatorCore();

    core.setProps({ actions: ['toggleSubtitles'] });

    expect(core.processEvent({ action: 'togglePaused' }, { paused: false })).toBe(false);
    expect(core.processEvent({ action: 'toggleSubtitles' }, { subtitlesShowing: false })).toBe(true);
    expect(core.state.current.status).toBe('captions-on');
  });

  it('increments generation on each accepted trigger', () => {
    const core = new StatusIndicatorCore();

    core.processEvent({ action: 'togglePaused' }, { paused: false });
    core.processEvent({ action: 'togglePaused' }, { paused: false });

    expect(core.state.current.generation).toBe(2);
  });

  it('clears after the configured delay', () => {
    const core = new StatusIndicatorCore();

    core.setProps({ closeDelay: 100 });
    core.processEvent({ action: 'toggleFullscreen' }, { isFullscreen: false });

    vi.advanceTimersByTime(100);

    expect(core.state.current.open).toBe(false);
    expect(core.state.current.status).toBeNull();
  });
});
