import { cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { controlFrames, renderIndicator } from '../../input-indicator/tests/fixture';
import { VolumeIndicatorRoot } from '../root';
import { VolumeIndicatorValue } from '../value';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('VolumeIndicatorRoot', () => {
  it('updates feedback without replaying the current transition', async () => {
    const frame = controlFrames();
    const fixture = renderIndicator(
      <VolumeIndicatorRoot data-testid="volume">
        <VolumeIndicatorValue />
      </VolumeIndicatorRoot>
    );

    try {
      await fixture.input('u', 'volumeStep', 0.1);
      const root = fixture.getByTestId('volume');

      expect(root.textContent).toBe('60%');
      expect(root.hasAttribute('data-starting-style')).toBe(true);
      await frame();
      await frame();
      expect(root.hasAttribute('data-starting-style')).toBe(false);

      await fixture.input('d', 'volumeStep', -0.1);
      expect(root.textContent).toBe('40%');
      expect(root.hasAttribute('data-open')).toBe(true);
      expect(root.hasAttribute('data-starting-style')).toBe(false);
    } finally {
      fixture.dispose();
    }
  });
});
