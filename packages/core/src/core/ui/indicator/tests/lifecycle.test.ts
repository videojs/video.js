import { describe, expect, it, vi } from 'vite-plus/test';

import {
  getRenderedIndicatorState,
  type IndicatorLifecycleState,
  IndicatorVisibilityCoordinator,
  isIndicatorPresent,
} from '../lifecycle';

interface TestState extends IndicatorLifecycleState {
  value: string | null;
}

const IDLE_STATE: TestState = {
  open: false,
  generation: 0,
  value: null,
  transitionStarting: false,
  transitionEnding: false,
};

describe('getRenderedIndicatorState', () => {
  it('keeps the snapshot payload while an indicator transitions out', () => {
    const snapshot: TestState = {
      ...IDLE_STATE,
      open: true,
      generation: 1,
      value: 'Paused',
    };

    const rendered = getRenderedIndicatorState(IDLE_STATE, snapshot, {
      active: true,
      status: 'ending',
    });

    expect(rendered.open).toBe(false);
    expect(rendered.value).toBe('Paused');
    expect(rendered.transitionEnding).toBe(true);
  });
});

describe('isIndicatorPresent', () => {
  it('stays present until both logical state and transition are inactive', () => {
    expect(isIndicatorPresent({ open: true }, { active: false })).toBe(true);
    expect(isIndicatorPresent(IDLE_STATE, { active: true })).toBe(true);
    expect(isIndicatorPresent(IDLE_STATE, { active: false })).toBe(false);
  });
});

describe('IndicatorVisibilityCoordinator', () => {
  it('closes registered indicators when another indicator is shown', () => {
    const coordinator = new IndicatorVisibilityCoordinator();
    const first = { close: vi.fn() };
    const second = { close: vi.fn() };

    coordinator.register(first);
    coordinator.register(second);
    coordinator.show(second);

    expect(first.close).toHaveBeenCalledOnce();
    expect(second.close).not.toHaveBeenCalled();
  });
});
