import { SKIN_HELP_URL } from '@videojs/core';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import { BackgroundVideoSkinElement } from '../skin';

let tagId = 0;

function createSkin(): BackgroundVideoSkinElement {
  const tag = `test-background-video-skin-${tagId++}`;

  customElements.define(tag, class extends BackgroundVideoSkinElement {});
  const skin = document.createElement(tag);
  if (!(skin instanceof BackgroundVideoSkinElement)) throw new Error(`Failed to create ${tag}`);

  return skin;
}

afterEach(() => {
  document.body.replaceChildren();
  document.getElementById('__media-background-styles')?.remove();
});

describe('BackgroundVideoSkinElement', () => {
  it('creates the background container and legacy media slot', () => {
    const skin = createSkin();

    expect(skin.shadowRoot?.querySelector('media-container')).not.toBeNull();
    expect(skin.shadowRoot?.querySelector('slot[name="media"]')).not.toBeNull();
    expect(skin.shadowRoot?.querySelector('slot:not([name])')).not.toBeNull();
  });

  it('links to the about-this-player page after the container', () => {
    const skin = createSkin();
    const link = skin.shadowRoot?.querySelector<HTMLAnchorElement>('a[rel="help"]');

    expect(link?.getAttribute('href')).toBe(SKIN_HELP_URL);
    expect(link?.hidden).toBe(true);
    expect(link?.previousElementSibling?.tagName.toLowerCase()).toBe('media-container');
  });

  it('shares one light-DOM stylesheet across multiple instances', () => {
    const first = createSkin();
    const second = createSkin();

    document.body.append(first, second);

    const styles = document.querySelectorAll('#__media-background-styles');

    expect(styles).toHaveLength(1);
  });
});
