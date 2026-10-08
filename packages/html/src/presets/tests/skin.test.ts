import { createTemplate } from '@videojs/utils/dom';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { SkinElement } from '../skin';

let tagId = 0;

function createSkin(template: HTMLTemplateElement | null = null): SkinElement {
  const tag = `test-skin-${tagId++}`;

  customElements.define(
    tag,
    class extends SkinElement {
      static template = template;
    }
  );
  const skin = document.createElement(tag);
  if (!(skin instanceof SkinElement)) throw new Error(`Failed to create ${tag}`);

  return skin;
}

afterEach(() => {
  document.body.replaceChildren();
  document.getElementById('__media-styles')?.remove();
});

describe('SkinElement', () => {
  it('renders the template into the shadow root', () => {
    const skin = createSkin(createTemplate('<media-container><slot></slot></media-container>'));

    expect(skin.shadowRoot?.querySelector('media-container')).not.toBeNull();
  });
});
