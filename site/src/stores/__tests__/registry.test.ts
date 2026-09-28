import { afterEach, describe, expect, it } from 'vite-plus/test';

import {
  framework,
  selectInstallationTemplate,
  syncInstallationSelectionFromUrl,
  template,
} from '@/stores/installation';
import { currentFramework } from '@/stores/preferences';
import {
  registryFramework,
  registrySkin,
  registryStyling,
  registryTheme,
  selectRegistryFramework,
  selectRegistryStyling,
} from '@/stores/registry';
import { FRAMEWORK_COOKIE } from '@/utils/docs/preferences';

describe('selectRegistryFramework', () => {
  afterEach(() => {
    currentFramework.set(null);
    framework.set('react');
    registrySkin.set(null);
    registryStyling.set(null);
    template.set('next');
    registryTheme.set(null);
    document.documentElement.removeAttribute('data-registry-framework');
    document.documentElement.removeAttribute('data-registry-styling');
    document.cookie = `${FRAMEWORK_COOKIE}=; max-age=0; path=/`;
    window.history.replaceState(null, '', '/');
  });

  it('syncs the registry and site-wide framework preferences', () => {
    registryStyling.set('tailwind');
    template.set('next');

    selectRegistryFramework('html');

    expect(registryFramework.get()).toBe('html');
    expect(currentFramework.get()).toBe('html');
    expect(document.cookie).toContain('vjs_docs_framework=html');
    expect(registryStyling.get()).toBeNull();
    expect(template.get()).toBe('vite');
  });

  it('keeps registry options when only the site-wide preference is stale', () => {
    framework.set('html');
    registryStyling.set('css');
    template.set('astro');
    currentFramework.set('react');

    selectRegistryFramework('html');

    expect(currentFramework.get()).toBe('html');
    expect(registryStyling.get()).toBe('css');
    expect(template.get()).toBe('astro');
  });

  it('preserves an explicitly selected app setup when the next framework supports it', () => {
    window.history.replaceState(null, '', '/docs/guides/installation/shadcn?framework=react&template=vite&styling=css');
    template.set('vite');
    registryStyling.set('css');

    selectRegistryFramework('html');

    expect(template.get()).toBe('vite');
    expect(registryStyling.get()).toBe('css');
    // Vite is the HTML default, so the canonical URL leaves it out.
    expect(window.location.search).toBe('?framework=html&styling=css');
  });

  it('writes compatible defaults that the next framework would otherwise reinterpret', () => {
    window.history.replaceState(null, '', '/docs/guides/installation/shadcn?framework=html');
    template.set('vite');
    registryStyling.set('css');

    selectRegistryFramework('react');

    expect(template.get()).toBe('vite');
    expect(registryStyling.get()).toBe('css');
    expect(window.location.search).toBe('?framework=react&template=vite&styling=css');
  });

  it('updates the Shadcn URL and root attribute for an in-page selection', () => {
    window.history.replaceState({ index: 2, scrollX: 0, scrollY: 320 }, '', '/docs/guides/installation/shadcn');

    selectRegistryFramework('html');

    expect(window.location.href).toContain('/docs/guides/installation/shadcn?framework=html');
    expect(window.history.state).toEqual({ index: 2, scrollX: 0, scrollY: 320 });
    expect(document.documentElement.dataset.registryFramework).toBe('html');
    expect(document.documentElement.dataset.registryStyling).toBe('css');
  });

  it('writes template and styling choices into the Shadcn URL', () => {
    window.history.replaceState(null, '', '/docs/guides/installation/shadcn?framework=react&preset=audio');
    syncInstallationSelectionFromUrl();

    selectInstallationTemplate('vite');
    selectRegistryStyling('css');

    expect(window.location.search).toBe('?framework=react&preset=audio&template=vite&styling=css');
    expect(template.get()).toBe('vite');
    expect(registryStyling.get()).toBe('css');
    expect(document.documentElement.dataset.registryStyling).toBe('css');
  });

  it('initializes registry choices from the destination of a client navigation', () => {
    registrySkin.set('video');
    registryTheme.set('minimal');
    const to = new URL('https://videojs.org/docs/guides/installation/shadcn?framework=html&template=astro&styling=css');

    document.dispatchEvent(Object.assign(new Event('astro:before-swap'), { to }));

    expect(registryFramework.get()).toBe('html');
    expect(template.get()).toBe('astro');
    expect(registryStyling.get()).toBe('css');
    expect(registrySkin.get()).toBeNull();
    expect(registryTheme.get()).toBeNull();
  });

  it('syncs a destination without rewriting the departing URL', () => {
    window.history.replaceState({ index: 2 }, '', '/docs/guides/installation/react?preset=audio');

    syncInstallationSelectionFromUrl(new URL('https://videojs.org/docs/guides/installation/shadcn?framework=html'));

    expect(window.location.pathname).toBe('/docs/guides/installation/react');
    expect(window.location.search).toBe('?preset=audio');
    expect(window.history.state).toEqual({ index: 2 });
    expect(registryFramework.get()).toBe('html');
  });
});
