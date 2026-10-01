import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { MediaIconElement } from '../element';

let id = 0;

function createIcon(): MediaIconElement {
  const tag = `test-media-icon-${id++}`;

  customElements.define(tag, class extends MediaIconElement {});
  return document.createElement(tag) as MediaIconElement;
}

function uniqueFamily(): string {
  return `test-family-${id++}`;
}

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe('MediaIconElement', () => {
  it('renders registered icons and reacts to attributes', () => {
    const family = uniqueFamily();

    MediaIconElement.register(family, {
      pause: '<svg data-icon="pause"></svg>',
      play: '<svg data-icon="play"></svg>',
    });

    const icon = createIcon();

    icon.setAttribute('family', family);
    icon.setAttribute('name', 'play');
    document.body.append(icon);

    expect(icon.querySelector('svg')?.dataset.icon).toBe('play');

    icon.setAttribute('name', 'pause');
    expect(icon.querySelector('svg')?.dataset.icon).toBe('pause');

    icon.setAttribute('name', 'missing');
    expect(icon.childNodes).toHaveLength(0);
  });

  it('loads a family once for every waiting instance', async () => {
    const family = uniqueFamily();
    const load = vi.fn(async () => ({ play: '<svg data-icon="loaded"></svg>' }));

    const first = createIcon();
    const second = createIcon();

    for (const icon of [first, second]) {
      icon.setAttribute('family', family);
      icon.setAttribute('name', 'play');
      document.body.append(icon);
    }

    MediaIconElement.registerLoader(family, load);

    await vi.waitFor(() => {
      expect(first.querySelector('svg')?.dataset.icon).toBe('loaded');
      expect(second.querySelector('svg')?.dataset.icon).toBe('loaded');
    });
    expect(load).toHaveBeenCalledOnce();
  });

  it('does not load disconnected instances', async () => {
    const family = uniqueFamily();
    const load = vi.fn(async () => ({ play: '<svg></svg>' }));

    MediaIconElement.registerLoader(family, load);

    const icon = createIcon();

    icon.setAttribute('family', family);
    icon.setAttribute('name', 'play');
    await Promise.resolve();

    expect(load).not.toHaveBeenCalled();
  });

  it('does not request a load when a family has no loader', async () => {
    const load = vi.spyOn(MediaIconElement, 'load');
    const icon = createIcon();

    icon.setAttribute('family', uniqueFamily());
    icon.setAttribute('name', 'play');
    document.body.append(icon);

    try {
      await Promise.resolve();
      await Promise.resolve();
      expect(load).not.toHaveBeenCalled();
      expect(icon.childNodes).toHaveLength(0);
    } finally {
      // Stop any pending render chain even when a broken guard fails the assertion.
      icon.remove();
    }
  });

  it('does not request another load when a loaded family omits the icon name', async () => {
    const family = uniqueFamily();
    const requestLoad = MediaIconElement.load.bind(MediaIconElement);
    const load = vi.spyOn(MediaIconElement, 'load').mockImplementation(requestLoad);
    const first = createIcon();
    const missing = createIcon();

    MediaIconElement.registerLoader(family, async () => ({ play: '<svg data-icon="loaded"></svg>' }));

    for (const [icon, name] of [
      [first, 'play'],
      [missing, 'missing'],
    ] as const) {
      icon.setAttribute('family', family);
      icon.setAttribute('name', name);
      document.body.append(icon);
    }

    const requestsWhileLoading = load.mock.calls.length;

    // Record unexpected retries without letting a broken guard create an endless microtask chain.
    load.mockImplementation(() => new Promise<void>(() => {}));

    try {
      await requestLoad(family);
      await Promise.resolve();

      expect(first.querySelector('svg')?.dataset.icon).toBe('loaded');
      expect(missing.childNodes).toHaveLength(0);
      expect(load).toHaveBeenCalledTimes(requestsWhileLoading);
    } finally {
      first.remove();
      missing.remove();
    }
  });
});
