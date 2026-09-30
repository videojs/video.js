import { afterEach, describe, expect, it } from 'vite-plus/test';

import { StatusIndicatorElement } from '../element';
import { StatusIndicatorValueElement } from '../value';

class TestStatusIndicatorElement extends StatusIndicatorElement {
  get transitionOptions() {
    return this.options;
  }

  get coreState() {
    return this.core.state.current;
  }

  processEvent(action: string) {
    return this.core.processEvent({ action }, {});
  }
}

customElements.define('test-status-indicator', TestStatusIndicatorElement);

afterEach(() => {
  document.body.innerHTML = '';
});

describe('StatusIndicatorElement', () => {
  it('exposes standalone tag names', () => {
    expect(StatusIndicatorElement.tagName).toBe('media-status-indicator');
    expect(StatusIndicatorValueElement.tagName).toBe('media-status-indicator-value');
  });

  it('keeps repeated updates in the current transition', () => {
    const element = document.createElement('test-status-indicator') as TestStatusIndicatorElement;

    expect(element.transitionOptions).toEqual({ replayOnUpdate: false });
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
