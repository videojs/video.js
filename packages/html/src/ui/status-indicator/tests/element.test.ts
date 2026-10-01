import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { controlFrames, mountIndicator } from '../../input-indicator/tests/fixture';
import { SeekIndicatorElement } from '../../seek-indicator/element';
import { StatusIndicatorElement } from '../element';
import { StatusIndicatorValueElement } from '../value';

class TestStatusIndicatorElement extends StatusIndicatorElement {
  get coreState() {
    return this.core.state.current;
  }

  processEvent(action: string) {
    return this.core.processEvent({ action }, {});
  }
}

customElements.define(StatusIndicatorElement.tagName, StatusIndicatorElement);
customElements.define(SeekIndicatorElement.tagName, SeekIndicatorElement);
customElements.define('test-status-indicator', TestStatusIndicatorElement);

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

describe('StatusIndicatorElement', () => {
  it('exposes standalone tag names', () => {
    expect(StatusIndicatorElement.tagName).toBe('media-status-indicator');
    expect(StatusIndicatorValueElement.tagName).toBe('media-status-indicator-value');
  });

  it('keeps repeated updates in the current transition', async () => {
    const frame = controlFrames();
    const status = await mountIndicator(new StatusIndicatorElement(), '<media-status-indicator-value />');
    const seek = await mountIndicator(new SeekIndicatorElement(), '<media-seek-indicator-value />');

    try {
      await status.input('k', 'togglePaused');
      await seek.input('l', 'seekStep', 10);
      expect(status.element.textContent).toBe('Playing');
      expect(status.element.hasAttribute('data-starting-style')).toBe(true);
      expect(seek.element.hasAttribute('data-starting-style')).toBe(true);

      await frame();
      await frame();
      await status.element.updateComplete;
      await seek.element.updateComplete;
      expect(status.element.hasAttribute('data-starting-style')).toBe(false);
      expect(seek.element.hasAttribute('data-starting-style')).toBe(false);

      await status.input('m', 'volumeStep', 0.1);
      await seek.input('j', 'seekStep', 10);
      expect(status.element.textContent).toBe('60%');
      expect(status.element.hasAttribute('data-open')).toBe(true);
      expect(status.element.hasAttribute('data-starting-style')).toBe(false);
      expect(seek.element.textContent).toBe('20s');
      expect(seek.element.hasAttribute('data-starting-style')).toBe(true);
    } finally {
      status.dispose();
      seek.dispose();
    }
  });

  it('forwards deriveCustomStatus to the core', async () => {
    const element = document.createElement('test-status-indicator') as TestStatusIndicatorElement;

    element.deriveCustomStatus = (event) =>
      event.action === 'frameStep' ? { status: 'frame', label: 'Frame', value: null } : null;
    document.body.append(element);
    await element.updateComplete;

    expect(element.processEvent('frameStep')).toBe(true);
    expect(element.coreState.status).toBe('frame');
  });
});
