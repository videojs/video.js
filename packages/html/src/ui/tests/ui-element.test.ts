import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { UIElement } from '../ui-element';

let tagCounter = 0;

function uniqueTag(base: string): string {
  return `${base}-${tagCounter++}`;
}

function createElement<T extends HTMLElement>(ctor: abstract new () => T): T {
  const tag = uniqueTag('test-media');

  customElements.define(tag, class extends (ctor as unknown as typeof HTMLElement) {});
  return document.createElement(tag) as T;
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('UIElement', () => {
  it('extends DestroyMixin(ReactiveElement)', () => {
    const el = createElement(UIElement);

    expect(el).toBeInstanceOf(UIElement);
    expect(el.destroyed).toBe(false);
  });
});
