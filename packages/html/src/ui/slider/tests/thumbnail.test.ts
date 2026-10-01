import { flush } from '@videojs/store';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { SliderElement } from '../element';
import { SliderThumbnailElement } from '../thumbnail';
import { measureSlider, pointer } from './support';

let tagCounter = 0;

function uniqueTag(base: string): string {
  return `${base}-${tagCounter++}`;
}

function createElement<Element extends HTMLElement>(Base: abstract new () => Element): Element {
  const tag = uniqueTag('test-slt');

  customElements.define(tag, class extends (Base as unknown as typeof HTMLElement) {});
  return document.createElement(tag) as Element;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('SliderThumbnailElement', () => {
  it('draws a fallback image in its shadow root', () => {
    const el = createElement(SliderThumbnailElement);
    const img = el.shadowRoot!.querySelector('img');

    expect(img!.getAttribute('part')).toBe('image');
    expect(img!.getAttribute('aria-hidden')).toBe('true');
  });

  it('reads pointerValue from slider context as time', async () => {
    const slider = createElement(SliderElement);
    const thumbnail = createElement(SliderThumbnailElement);
    const img = document.createElement('img');

    Object.defineProperty(img, 'complete', { value: false, configurable: true });

    thumbnail.thumbnails = [
      { url: 'thumb-0.jpg', startTime: 0 },
      { url: 'thumb-30.jpg', startTime: 30 },
      { url: 'thumb-60.jpg', startTime: 60 },
    ];
    thumbnail.append(img);

    slider.appendChild(thumbnail);
    document.body.appendChild(slider);

    await slider.updateComplete;
    await thumbnail.updateComplete;

    // In idle state, pointerPercent=0 → pointerValue=0 → selects 'thumb-0.jpg'.
    expect(img.getAttribute('src')).toBe('thumb-0.jpg');

    measureSlider(slider, 100);
    pointer(slider, 'pointermove', 40, 0);
    flush();
    await slider.updateComplete;
    await thumbnail.updateComplete;
    expect(img.getAttribute('src')).toBe('thumb-30.jpg');
  });
});
