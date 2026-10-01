import { afterEach, describe, expect, it } from 'vite-plus/test';

import { isSliderFocused } from '../focus';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('isSliderFocused', () => {
  it('detects focused sliders inside open shadow roots', () => {
    const container = document.createElement('div');
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    const slider = document.createElement('button');

    slider.setAttribute('role', 'slider');
    shadow.append(slider);
    container.append(host);
    document.body.append(container);

    slider.focus();

    expect(isSliderFocused(container)).toBe(true);
  });

  it('ignores focused sliders outside the scoped container', () => {
    const container = document.createElement('div');
    const slider = document.createElement('button');

    slider.setAttribute('role', 'slider');
    document.body.append(container, slider);

    slider.focus();

    expect(isSliderFocused(container)).toBe(false);
    expect(isSliderFocused(document)).toBe(true);
  });
});
