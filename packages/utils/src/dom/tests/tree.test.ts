import { describe, expect, it } from 'vite-plus/test';

import { containsComposed } from '../tree';

describe('containsComposed', () => {
  it('checks composed containment across shadow roots', () => {
    const container = document.createElement('div');
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    const button = document.createElement('button');

    shadow.append(button);
    container.append(host);
    document.body.append(container);

    expect(container.contains(button)).toBe(false);
    expect(containsComposed(container, button)).toBe(true);
  });

  it('recognizes assigned content inside its slot and shadow wrapper', () => {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    const wrapper = document.createElement('section');
    const slot = document.createElement('slot');
    const content = document.createElement('span');

    wrapper.append(slot);
    shadow.append(wrapper);
    host.append(content);
    document.body.append(host);

    try {
      expect(content.assignedSlot).toBe(slot);
      expect.soft(containsComposed(slot, content)).toBe(true);
      expect(containsComposed(wrapper, content)).toBe(true);
    } finally {
      host.remove();
    }
  });

  it('returns false for elements outside the composed tree', () => {
    const container = document.createElement('div');
    const button = document.createElement('button');

    document.body.append(container, button);

    expect(containsComposed(container, button)).toBe(false);
  });
});
