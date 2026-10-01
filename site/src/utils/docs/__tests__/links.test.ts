import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { syncInstallationSelectionFromUrl, useCase } from '@/stores/installation';
import { currentFramework } from '@/stores/preferences';

import { initializeDocsLinks } from '../links';
import { FRAMEWORK_COOKIE } from '../preferences';

function renderLink(slug = 'guides/architecture', hash = ''): HTMLAnchorElement {
  document.body.innerHTML = `<a href="/docs/${slug}${hash}" data-docs-slug="${slug}">Guide</a>`;

  return document.querySelector<HTMLAnchorElement>('a')!;
}

describe('initializeDocsLinks', () => {
  afterEach(() => {
    window.__videojsDocsLinksController?.abort();
    delete window.__videojsDocsLinksController;
    currentFramework.set(null);
    document.cookie = `${FRAMEWORK_COOKIE}=; max-age=0; path=/`;
    syncInstallationSelectionFromUrl(new URL('http://localhost/docs/guides/installation/react'));
    window.history.replaceState(null, '', '/');
    document.body.replaceChildren();
  });

  it('updates agnostic links when the selected framework changes', () => {
    currentFramework.set('html');
    const link = renderLink('guides/architecture', '#ui-components');

    initializeDocsLinks();

    expect(link.pathname).toBe('/docs/framework/html/guides/architecture');
    expect(link.hash).toBe('#ui-components');

    currentFramework.set('react');

    expect(link.pathname).toBe('/docs/framework/react/guides/architecture');
  });

  it('adds the selected framework to Shadcn links', () => {
    currentFramework.set('html');
    const link = renderLink('guides/installation-shadcn');

    initializeDocsLinks();

    expect(`${link.pathname}${link.search}`).toBe('/docs/guides/installation/shadcn?framework=html');
  });

  it('updates links swapped into the document by Astro', () => {
    currentFramework.set('react');
    initializeDocsLinks();

    const link = renderLink();

    document.dispatchEvent(new Event('astro:page-load'));

    expect(link.pathname).toBe('/docs/framework/react/guides/architecture');
  });

  it('carries compatible installation choices into Shadcn links', async () => {
    window.history.replaceState(
      null,
      '',
      '/docs/guides/installation/html?preset=audio&skin=neutral&media=spotify&package-manager=yarn&template=astro'
    );
    syncInstallationSelectionFromUrl();
    document.body.innerHTML = `
      <a
        href="/docs/guides/installation/shadcn"
        data-docs-slug="guides/installation-shadcn"
        data-installation-method-link="shadcn"
      >Guide</a>
    `;

    initializeDocsLinks();

    const link = document.querySelector<HTMLAnchorElement>('a')!;

    await vi.waitFor(() =>
      expect(Object.fromEntries(new URLSearchParams(link.search))).toEqual({
        preset: 'audio',
        skin: 'neutral',
        media: 'spotify',
        'package-manager': 'yarn',
        template: 'astro',
        framework: 'html',
      })
    );
    expect(link.pathname).toBe('/docs/guides/installation/shadcn');
  });

  it('follows later picks on an installation guide', async () => {
    window.history.replaceState(null, '', '/docs/guides/installation/html');
    syncInstallationSelectionFromUrl();
    document.body.innerHTML = `
      <a href="/docs/guides/installation/shadcn" data-installation-method-link="shadcn">Guide</a>
    `;

    initializeDocsLinks();

    const link = document.querySelector<HTMLAnchorElement>('a')!;

    await vi.waitFor(() => expect(link.search).toBe('?framework=html'));

    useCase.set('default-audio');

    expect(link.search).toBe('?framework=html&preset=audio');
  });

  it('keeps a heading anchor on Shadcn links across later picks', async () => {
    window.history.replaceState(null, '', '/docs/guides/installation/html');
    syncInstallationSelectionFromUrl();
    document.body.innerHTML = `
      <a href="/docs/guides/installation/shadcn#choose-how-to-install" data-installation-method-link="shadcn">Guide</a>
    `;

    initializeDocsLinks();

    const link = document.querySelector<HTMLAnchorElement>('a')!;

    await vi.waitFor(() => expect(link.search).toBe('?framework=html'));
    expect(link.hash).toBe('#choose-how-to-install');

    useCase.set('default-audio');

    expect(link.search).toBe('?framework=html&preset=audio');
    expect(link.hash).toBe('#choose-how-to-install');
  });
});
