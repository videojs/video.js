// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

const bundles = import.meta.glob(['../*.ts', '!../*-player.ts', '!../background.ts', '!../i18n*.ts']);

function createRegistry(): CustomElementRegistry {
  const definitions = new Map<string, CustomElementConstructor>();

  return {
    define: (name: string, element: CustomElementConstructor) => void definitions.set(name, element),
    get: (name: string) => definitions.get(name),
  } as CustomElementRegistry;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('@videojs/cdn skin bundles', () => {
  it.each(Object.keys(bundles))('%s registers the i18n provider and text elements', async (path) => {
    const registry = createRegistry();

    vi.resetModules();
    vi.stubGlobal('customElements', registry);

    await bundles[path]!();

    expect(registry.get('media-i18n')).toBeTypeOf('function');
    expect(registry.get('media-text')).toBeTypeOf('function');
  });
});
