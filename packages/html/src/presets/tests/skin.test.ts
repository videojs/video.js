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

  it('shows help beside its media slot while it has no Media', () => {
    const skin = createSkin(createTemplate('<media-container><slot></slot></media-container>'));

    skin.append('\n');
    document.body.append(skin);

    const help = skin.shadowRoot?.querySelector<HTMLElement>('slot + .media-help');

    expect(help?.hidden).toBe(false);
    expect(help?.textContent).toContain('Add a Media to this skin.');
  });

  it('hides the help when the Media is slotted', () => {
    const skin = createSkin(createTemplate('<media-container><slot></slot></media-container>'));

    skin.append(document.createElement('video'));
    document.body.append(skin);

    expect(skin.shadowRoot?.querySelector<HTMLElement>('.media-help')?.hidden).toBe(true);
  });
});
