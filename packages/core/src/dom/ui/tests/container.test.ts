import { afterEach, describe, expect, it } from 'vite-plus/test';

import { focusContainer } from '../container';

afterEach(() => {
  document.body.replaceChildren();
});

describe('focusContainer', () => {
  it('focuses the container when focus is outside', () => {
    const container = document.createElement('div');

    container.tabIndex = 0;
    document.body.append(container);

    focusContainer(container);

    expect(document.activeElement).toBe(container);
  });

  it('preserves focus inside the composed tree', () => {
    const container = document.createElement('div');
    const host = document.createElement('div');
    const button = document.createElement('button');

    container.tabIndex = 0;
    host.attachShadow({ mode: 'open' }).append(button);
    container.append(host);
    document.body.append(container);
    button.focus();

    expect(host.shadowRoot?.activeElement).toBe(button);

    focusContainer(container);

    expect(host.shadowRoot?.activeElement).toBe(button);
  });
});
