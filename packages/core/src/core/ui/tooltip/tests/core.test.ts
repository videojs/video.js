import { describe, expect, it } from 'vite-plus/test';

import { TooltipCore, type TooltipInput } from '../core';

const CLOSED: TooltipInput = { active: false, status: 'idle' };
const OPEN: TooltipInput = { active: true, status: 'idle' };

describe('TooltipCore', () => {
  it('uses default props', () => {
    const core = new TooltipCore();

    core.setInput(CLOSED);
    const state = core.getState();

    expect(state.side).toBe('top');
    expect(state.align).toBe('center');
  });

  it('merges input state', () => {
    const core = new TooltipCore();

    core.setInput(CLOSED);
    expect(core.getState().open).toBe(false);

    core.setInput(OPEN);
    expect(core.getState().open).toBe(true);
  });

  it('applies custom props', () => {
    const core = new TooltipCore({ side: 'bottom', align: 'start' });

    core.setInput(OPEN);
    const state = core.getState();

    expect(state.side).toBe('bottom');
    expect(state.align).toBe('start');
  });

  it('updates props via setProps', () => {
    const core = new TooltipCore();

    core.setProps({ side: 'left' });
    core.setInput(OPEN);
    const state = core.getState();

    expect(state.side).toBe('left');
    expect(state.align).toBe('center');
  });

  describe('getPopupAttrs', () => {
    it('returns presentation role', () => {
      const core = new TooltipCore();

      core.setInput(OPEN);
      const attrs = core.getPopupAttrs(core.getState());

      expect(attrs.role).toBe('presentation');
    });

    it('returns popover manual attribute', () => {
      const core = new TooltipCore();

      core.setInput(OPEN);
      const attrs = core.getPopupAttrs(core.getState());

      expect(attrs.popover).toBe('manual');
    });
  });

  it.each([
    ['starting', true, false],
    ['ending', false, true],
    ['idle', false, false],
  ] as const)('derives transition flags for %s', (status, transitionStarting, transitionEnding) => {
    const core = new TooltipCore();

    core.setInput({ active: true, status });
    const state = core.getState();

    expect(state.transitionStarting).toBe(transitionStarting);
    expect(state.transitionEnding).toBe(transitionEnding);
  });
});
