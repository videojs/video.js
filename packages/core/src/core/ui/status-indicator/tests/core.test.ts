import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { StatusIndicatorCore, type DeriveCustomStatus } from '../core';

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

  it('falls back to deriveCustomStatus for actions without built-in feedback', () => {
    const core = new StatusIndicatorCore();
    const deriveCustomStatus: DeriveCustomStatus = (event, snapshot) =>
      event.action === 'stepRate' ? { status: 'rate', label: `${snapshot.playbackRate}×`, value: null } : null;

    core.setProps({ actions: ['stepRate', 'frameStep'], deriveCustomStatus });

    expect(core.processEvent({ action: 'stepRate' }, { playbackRate: 1.5 })).toBe(true);
    expect(core.state.current).toMatchObject({ open: true, generation: 1, status: 'rate', label: '1.5×' });
    expect(core.processEvent({ action: 'frameStep' }, {})).toBe(false);
    expect(core.state.current.generation).toBe(1);
  });

  it('does not consult deriveCustomStatus for built-in actions', () => {
    const core = new StatusIndicatorCore();
    const deriveCustomStatus = vi.fn(() => ({ status: 'custom', label: 'Custom', value: null }));

    core.setProps({ deriveCustomStatus });
    core.processEvent({ action: 'togglePaused' }, { paused: false });

    expect(deriveCustomStatus).not.toHaveBeenCalled();
    expect(core.state.current.status).toBe('pause');
  });

  it('does not consult deriveCustomStatus for filtered-out actions', () => {
    const core = new StatusIndicatorCore();
    const deriveCustomStatus = vi.fn(() => ({ status: 'custom', label: 'Custom', value: null }));

    core.setProps({ actions: ['togglePaused'], deriveCustomStatus });

    expect(core.processEvent({ action: 'stepRate' }, {})).toBe(false);
    expect(deriveCustomStatus).not.toHaveBeenCalled();
  });
});
