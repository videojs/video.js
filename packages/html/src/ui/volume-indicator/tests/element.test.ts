import { VolumeIndicatorCSSVars } from '@videojs/core';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { controlFrames, mountIndicator } from '../../input-indicator/tests/fixture';
import { VolumeIndicatorElement } from '../element';
import { VolumeIndicatorFillElement } from '../fill';
import { VolumeIndicatorValueElement } from '../value';

customElements.define(VolumeIndicatorElement.tagName, VolumeIndicatorElement);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe('VolumeIndicatorElement', () => {
  it('exposes standalone tag names', () => {
    expect(VolumeIndicatorElement.tagName).toBe('media-volume-indicator');
    expect(VolumeIndicatorFillElement.tagName).toBe('media-volume-indicator-fill');
    expect(VolumeIndicatorValueElement.tagName).toBe('media-volume-indicator-value');
  });

  it('renders authored volume parts from coordinator input and closes them', async () => {
    vi.useFakeTimers();
    const frame = controlFrames();
    const fixture = await mountIndicator(
      new VolumeIndicatorElement(),
      `
      <media-volume-indicator-fill><media-volume-indicator-value /></media-volume-indicator-fill>
    `
    );
    const fill = fixture.element.querySelector<HTMLElement>('media-volume-indicator-fill')!;
    const value = fixture.element.querySelector('media-volume-indicator-value')!;

    try {
      await fixture.input('u', 'volumeStep', 0.1);
      expect(fixture.element.hidden).toBe(false);
      expect(value.textContent).toBe('60%');
      expect(fill.style.getPropertyValue(VolumeIndicatorCSSVars.fill)).toBe('60%');

      await frame();
      await frame();
      await fixture.input('d', 'volumeStep', -0.1);
      expect(value.textContent).toBe('40%');
      expect(fill.style.getPropertyValue(VolumeIndicatorCSSVars.fill)).toBe('40%');
      expect(fixture.element.hasAttribute('data-starting-style')).toBe(false);

      vi.advanceTimersByTime(800);
      await Promise.resolve();
      await fixture.element.updateComplete;
      expect(fixture.element.hasAttribute('data-ending-style')).toBe(true);
      expect(value.textContent).toBe('40%');
      await frame();
      await frame();
      await fixture.element.updateComplete;
      expect(fixture.element.hidden).toBe(true);
      expect(fixture.element.hasAttribute('data-open')).toBe(false);
    } finally {
      fixture.dispose();
    }
  });
});
