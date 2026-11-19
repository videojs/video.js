import { afterEach, describe, expect, it } from 'vite-plus/test';

import { UIElement } from '../../../ui/ui-element';
import { BackgroundVideoSkinElement } from '../skin';

let tagId = 0;

const controlTag = 'test-background-video-skin-control';

customElements.define(controlTag, class extends UIElement {});

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

  it('shares one light-DOM stylesheet across multiple instances', () => {
    const first = createSkin();
    const second = createSkin();

    document.body.append(first, second);

    const styles = document.querySelectorAll('#__media-background-styles');

    expect(styles).toHaveLength(1);
  });

  it('destroys the UI elements in its shadow root on destroy()', () => {
    const skin = createSkin();
    const control = document.createElement(controlTag) as UIElement;

    skin.shadowRoot!.querySelector('media-container')!.append(control);
    skin.destroy();

    expect(control.destroyed).toBe(true);
  });
});
