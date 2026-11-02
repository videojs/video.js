import { createTemplate } from '@videojs/utils/dom';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { UIElement } from '../../ui/ui-element';
import { SkinElement } from '../skin';

let tagId = 0;

const controlTag = 'test-skin-control';

customElements.define(controlTag, class extends UIElement {});

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
  vi.useRealTimers();
  document.body.replaceChildren();
  document.getElementById('__media-styles')?.remove();
});

describe('SkinElement', () => {
  it('renders the template into the shadow root', () => {
    const skin = createSkin(createTemplate('<media-container><slot></slot></media-container>'));

    expect(skin.shadowRoot?.querySelector('media-container')).not.toBeNull();
  });

  it('keeps its controls alive across an asynchronous move inside a kept-alive player', () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const player = document.createElement('div');
    const skin = createSkin(createTemplate(`<${controlTag}></${controlTag}>`));
    const control = skin.shadowRoot!.querySelector(controlTag) as UIElement;

    player.setAttribute('keep-alive', '');
    player.append(skin);
    document.body.append(player);
    player.remove();

    vi.advanceTimersByTime(100);
    document.body.append(player);

    expect(skin.destroyed).toBe(false);
    expect(control.destroyed).toBe(false);
  });

  it('destroys the controls in its shadow root on destroy()', () => {
    const skin = createSkin(createTemplate(`<${controlTag}></${controlTag}>`));
    const control = skin.shadowRoot!.querySelector(controlTag) as UIElement;

    skin.destroy();

    expect(control.destroyed).toBe(true);
  });
});
