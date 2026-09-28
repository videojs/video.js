import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';

import { FRAMEWORK_COOKIE } from '@/utils/docs/preferences';

import {
  extensions,
  framework,
  installMethod,
  media,
  project,
  selectCdnStartingPoint,
  skin,
  sourceUrl,
  styling,
  syncInstallationSelectionFromUrl,
  template,
  useCase,
} from '../installation';

/** Let the URL write that store changes schedule for the end of the current task run. */
async function settleUrl(): Promise<void> {
  await Promise.resolve();
}

describe('useCase', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/');
    extensions.set([]);
  });

  it('fits the skin and media to the new preset from the store values', () => {
    useCase.set('default-video');
    skin.set('minimal-video');
    media.set('youtube');

    useCase.set('default-audio');

    expect(skin.get()).toBe('minimal-audio');
    expect(media.get()).toBe('html5-audio');

    useCase.set('live-video');

    expect(skin.get()).toBe('minimal-video');
    expect(media.get()).toBe('hls');
  });

  it('writes the URL once, after the other picks fit the new use case', async () => {
    window.history.replaceState(null, '', '/docs/guides/installation/react?media=mux-video');
    syncInstallationSelectionFromUrl();

    const replaceState = vi.spyOn(window.history, 'replaceState');

    try {
      useCase.set('default-audio');
      await settleUrl();

      expect(replaceState).toHaveBeenCalledOnce();
      expect(replaceState.mock.calls[0]?.[2]).toBe('/docs/guides/installation/react?preset=audio');
      expect(window.location.search).toBe('?preset=audio');
    } finally {
      replaceState.mockRestore();
    }
  });

  it('replaces stale picks when a client navigation has a different URL', () => {
    syncInstallationSelectionFromUrl(
      new URL(
        'https://videojs.org/docs/guides/installation/react?preset=audio&skin=minimal&media=spotify&package-manager=pnpm&source-url=track'
      )
    );

    expect(useCase.get()).toBe('default-audio');
    expect(skin.get()).toBe('minimal-audio');
    expect(media.get()).toBe('spotify');
    expect(installMethod.get()).toBe('pnpm');
    expect(sourceUrl.get()).toBe('track');

    syncInstallationSelectionFromUrl(new URL('https://videojs.org/docs/guides/installation/cdn'));

    expect(useCase.get()).toBe('default-video');
    expect(skin.get()).toBe('video');
    expect(media.get()).toBe('html5-video');
    expect(installMethod.get()).toBe('pnpm');
    expect(sourceUrl.get()).toBe('');
  });

  it('keeps extensions in sync with media and explicit URL choices', async () => {
    window.history.replaceState(null, '', '/docs/guides/installation/react?media=mux-video&extensions=none');
    syncInstallationSelectionFromUrl();

    expect(extensions.get()).toEqual([]);

    media.set('hls');
    extensions.set(['google-cast']);
    await settleUrl();

    expect(window.location.search).toContain('extensions=google-cast');

    media.set('html5-video');

    expect(extensions.get()).toEqual([]);
  });

  it('normalizes invalid URL picks to the selection shown by the page', () => {
    window.history.replaceState(
      { index: 2, scrollX: 0, scrollY: 300 },
      '',
      '/docs/guides/installation/react?preset=audio&skin=fancy&media=youtube&package-manager=deno&source-url=line%0Abreak&utm_source=test'
    );

    syncInstallationSelectionFromUrl();

    expect(window.location.search).toBe('?preset=audio&utm_source=test');
    expect(window.history.state).toEqual({ index: 2, scrollX: 0, scrollY: 300 });
    expect(useCase.get()).toBe('default-audio');
    expect(skin.get()).toBe('audio');
    expect(media.get()).toBe('html5-audio');
    expect(installMethod.get()).toBe('pnpm');
    expect(sourceUrl.get()).toBe('');
  });

  it('leaves installation-shaped parameters alone outside installation guides', async () => {
    window.history.replaceState(
      { index: 2 },
      '',
      '/docs/framework/react/guides/architecture?framework=html&package-manager=npm&styling=css&utm_source=test'
    );

    syncInstallationSelectionFromUrl();
    useCase.set('default-audio');
    await settleUrl();

    expect(window.location.search).toBe('?framework=html&package-manager=npm&styling=css&utm_source=test');
    expect(window.history.state).toEqual({ index: 2 });
  });

  it('normalizes choices unavailable from the Shadcn route', () => {
    window.history.replaceState(
      null,
      '',
      '/docs/guides/installation/shadcn?framework=react&preset=background-video&skin=none&media=background-video&package-manager=pnpm'
    );

    syncInstallationSelectionFromUrl();

    expect(window.location.search).toBe('?framework=react');
    expect(useCase.get()).toBe('default-video');
    expect(skin.get()).toBe('video');
    expect(media.get()).toBe('html5-video');
    expect(installMethod.get()).toBe('pnpm');
  });

  it('normalizes the address bar after an Astro client transition', () => {
    const destination = new URL(
      'https://videojs.org/docs/guides/installation/shadcn?framework=react&preset=background-video&skin=none&package-manager=pnpm'
    );

    // `before-swap` publishes destination state while the browser still has the departing URL.
    syncInstallationSelectionFromUrl(destination);
    window.history.replaceState({ index: 3 }, '', `${destination.pathname}${destination.search}`);
    document.dispatchEvent(new Event('astro:after-swap'));

    expect(window.location.search).toBe('?framework=react');
    expect(window.history.state).toEqual({ index: 3 });
    expect(useCase.get()).toBe('default-video');
    expect(skin.get()).toBe('video');
  });
});

describe('syncInstallationSelectionFromUrl', () => {
  afterEach(() => {
    document.cookie = `${FRAMEWORK_COOKIE}=; max-age=0; path=/`;
    document.documentElement.removeAttribute('data-installation-pending');
    window.history.replaceState(null, '', '/');
  });

  it('normalizes a queryless Shadcn entry from the saved framework without touching history state', () => {
    document.cookie = `${FRAMEWORK_COOKIE}=html; path=/`;
    window.history.replaceState(
      { index: 2, scrollX: 0, scrollY: 360 },
      '',
      '/docs/guides/installation/shadcn?preset=audio'
    );

    syncInstallationSelectionFromUrl();

    expect(window.location.search).toBe('?framework=html&preset=audio');
    expect(window.history.state).toEqual({ index: 2, scrollX: 0, scrollY: 360 });
    expect(framework.get()).toBe('html');
  });

  it('canonicalizes a Vue Shadcn query to HTML while retaining valid choices', () => {
    window.history.replaceState(null, '', '/docs/guides/installation/shadcn?framework=vue&template=next&styling=css');

    syncInstallationSelectionFromUrl();

    expect(window.location.search).toBe('?framework=html&styling=css');
    expect(framework.get()).toBe('html');
    expect(template.get()).toBe('vite');
    expect(styling.get()).toBe('css');
    expect(document.documentElement.dataset.registryFramework).toBe('html');
    expect(document.documentElement.dataset.registryStyling).toBe('css');
  });

  it('drops invalid Shadcn options when the framework query is already valid', () => {
    window.history.replaceState(
      null,
      '',
      '/docs/guides/installation/shadcn?framework=react&template=nuxt&styling=bogus&preset=audio'
    );

    syncInstallationSelectionFromUrl();

    expect(window.location.search).toBe('?framework=react&preset=audio');
  });

  it('marks picks that differ from the prerendered defaults as pending', async () => {
    window.history.replaceState(null, '', '/docs/guides/installation/react?preset=audio');
    syncInstallationSelectionFromUrl();

    expect(document.documentElement).toHaveAttribute('data-installation-pending');

    useCase.set('default-video');
    await settleUrl();

    expect(window.location.search).toBe('');
    expect(document.documentElement).not.toHaveAttribute('data-installation-pending');
  });

  describe('with a Markdown alternate link', () => {
    let link: HTMLLinkElement;

    beforeEach(() => {
      link = document.createElement('link');
      link.rel = 'alternate';
      link.type = 'text/markdown';
      link.href = 'https://videojs.org/docs/guides/installation/react.md';
      document.head.append(link);
    });

    afterEach(() => {
      link.remove();
    });

    it('carries the canonical picks from the initial URL without the private source URL', () => {
      window.history.replaceState(
        null,
        '',
        '/docs/guides/installation/react?preset=audio&media=spotify&source-url=https%3A%2F%2Fopen.spotify.com%2Ftrack%2F1'
      );
      syncInstallationSelectionFromUrl();

      expect(link.href).toBe('https://videojs.org/docs/guides/installation/react.md?preset=audio&media=spotify');
    });

    it('follows later picks', async () => {
      window.history.replaceState(null, '', '/docs/guides/installation/react?preset=audio');
      syncInstallationSelectionFromUrl();

      useCase.set('default-video');
      await settleUrl();

      expect(link.href).toBe('https://videojs.org/docs/guides/installation/react.md');
    });
  });
});

describe('selectCdnStartingPoint', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-installation-pending');
    window.history.replaceState(null, '', '/');
  });

  it('pairs a new app with Vite and an existing page with no app setup', () => {
    window.history.replaceState(null, '', '/docs/guides/installation/cdn?package-manager=yarn');
    syncInstallationSelectionFromUrl();

    expect(window.location.search).toBe('');

    selectCdnStartingPoint('new');

    expect(project.get()).toBe('new');
    expect(template.get()).toBe('vite');
    expect(window.location.search).toBe('?template=vite&project=new&package-manager=yarn');
    expect(document.documentElement.dataset.installationTemplate).toBe('vite');

    selectCdnStartingPoint('existing');

    expect(project.get()).toBe('existing');
    expect(template.get()).toBe('none');
    expect(window.location.search).toBe('');
    expect(installMethod.get()).toBe('yarn');
  });
});
