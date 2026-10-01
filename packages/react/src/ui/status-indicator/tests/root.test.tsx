import { act, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { controlFrames, renderIndicator } from '../../input-indicator/tests/fixture';
import { StatusIndicatorRoot } from '../root';
import { StatusIndicatorValue } from '../value';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('StatusIndicatorRoot', () => {
  it('keeps repeated updates in the current transition and filters actions', async () => {
    const frame = controlFrames();
    const fixture = renderIndicator(
      <StatusIndicatorRoot actions={['togglePaused', 'volumeStep']} data-testid="status">
        <StatusIndicatorValue />
      </StatusIndicatorRoot>
    );

    try {
      await fixture.input('k', 'togglePaused');
      const root = fixture.getByTestId('status');

      expect(root.textContent).toBe('Playing');
      expect(root.hasAttribute('data-starting-style')).toBe(true);
      await frame();
      await frame();
      expect(root.hasAttribute('data-starting-style')).toBe(false);

      await fixture.input('u', 'volumeStep', 0.1);
      expect(root.textContent).toBe('60%');
      expect(root.hasAttribute('data-open')).toBe(true);
      expect(root.hasAttribute('data-starting-style')).toBe(false);

      await fixture.input('f', 'toggleFullscreen');
      expect(root.textContent).toBe('60%');
      expect(root.getAttribute('data-status')).toBe('volume-high');
      expect(root.hasAttribute('data-starting-style')).toBe(false);
    } finally {
      fixture.dispose();
    }
  });

  it('cancels an exit on accepted input and survives its old completion', async () => {
    vi.useFakeTimers();
    const frame = controlFrames();
    const fixture = renderIndicator(
      <StatusIndicatorRoot data-testid="status">
        <StatusIndicatorValue />
      </StatusIndicatorRoot>
    );

    try {
      await fixture.input('k', 'togglePaused');
      const root = fixture.getByTestId('status');

      await frame();
      await frame();
      await frame();
      let finish!: () => void;
      const finished = new Promise<void>((resolve) => {
        finish = resolve;
      });

      Object.defineProperty(root, 'getAnimations', { value: () => [{ finished, cancel: () => {} }] });
      await act(async () => vi.advanceTimersByTime(800));
      expect(root.hasAttribute('data-ending-style')).toBe(true);
      expect(root.textContent).toBe('Playing');
      await frame();
      await frame();

      await fixture.input('u', 'volumeStep', 0.1);
      expect(fixture.getByTestId('status')).toBe(root);
      expect(root.hasAttribute('data-ending-style')).toBe(false);
      expect(root.hasAttribute('data-starting-style')).toBe(false);
      expect(root.hasAttribute('data-open')).toBe(true);
      expect(root.textContent).toBe('60%');

      await act(async () => finish());
      await frame();
      expect(fixture.getByTestId('status')).toBe(root);
      expect(root.hasAttribute('data-open')).toBe(true);
      expect(root.textContent).toBe('60%');
    } finally {
      fixture.dispose();
    }
  });

  it('renders deriveCustomStatus results without forwarding the prop to the DOM', async () => {
    const fixture = renderIndicator(
      <StatusIndicatorRoot
        data-testid="status"
        deriveCustomStatus={(event) =>
          event.action === 'seekStep' ? { status: 'frame', label: 'Frame', value: null } : null
        }
      >
        <StatusIndicatorValue />
      </StatusIndicatorRoot>
    );

    try {
      await fixture.input('l', 'seekStep', 10);
      const root = fixture.getByTestId('status');

      expect(root.getAttribute('data-status')).toBe('frame');
      expect(root.textContent).toBe('Frame');
      expect(root.hasAttribute('derivecustomstatus')).toBe(false);
    } finally {
      fixture.dispose();
    }
  });
});
