import { cleanup, render } from '@testing-library/react';
import type { StatusIndicatorCore } from '@videojs/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const inputIndicatorMock = vi.hoisted(() => ({
  useInputIndicatorRoot: vi.fn(),
}));

vi.mock('../../input-indicator/use-input-indicator-root', () => inputIndicatorMock);

import { StatusIndicatorRoot } from '../root';

const state: StatusIndicatorCore.State = {
  open: true,
  generation: 1,
  status: 'play',
  label: 'Playing',
  value: null,
  transitionStarting: false,
  transitionEnding: false,
};

beforeEach(() => {
  inputIndicatorMock.useInputIndicatorRoot.mockReturnValue({
    elementRef: { current: null },
    present: true,
    state,
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('StatusIndicatorRoot', () => {
  it('keeps repeated updates in the current transition', () => {
    render(<StatusIndicatorRoot actions={['togglePaused']} />);

    expect(inputIndicatorMock.useInputIndicatorRoot).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ actions: ['togglePaused'] }),
      { replayOnUpdate: false }
    );
  });

  it('forwards deriveCustomStatus to the core props without rendering it', () => {
    const deriveCustomStatus = () => null;
    const { container } = render(<StatusIndicatorRoot deriveCustomStatus={deriveCustomStatus} />);

    expect(inputIndicatorMock.useInputIndicatorRoot).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ deriveCustomStatus }),
      { replayOnUpdate: false }
    );
    expect(container.firstElementChild?.hasAttribute('derivecustomstatus')).toBe(false);
  });
});
