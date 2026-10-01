import { cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { controlFrames, renderIndicator } from '../../input-indicator/tests/fixture';
import { SeekIndicatorRoot } from '../root';
import { SeekIndicatorValue } from '../value';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('SeekIndicatorRoot', () => {
  it('replays the open transition on accepted updates by default', async () => {
    const frame = controlFrames();
    const fixture = renderIndicator(
      <SeekIndicatorRoot data-testid="seek">
        <SeekIndicatorValue />
      </SeekIndicatorRoot>
    );

    try {
      await fixture.input('l', 'seekStep', 10);
      const root = fixture.getByTestId('seek');

      expect(root.textContent).toBe('10s');
      expect(root.hasAttribute('data-starting-style')).toBe(true);
      await frame();
      await frame();
      expect(root.hasAttribute('data-starting-style')).toBe(false);

      await fixture.input('j', 'seekStep', 10);
      expect(root.textContent).toBe('20s');
      expect(root.hasAttribute('data-starting-style')).toBe(true);
      await frame();
      await frame();
      expect(root.hasAttribute('data-starting-style')).toBe(false);
      expect(root.hasAttribute('data-open')).toBe(true);
    } finally {
      fixture.dispose();
    }
  });
});
