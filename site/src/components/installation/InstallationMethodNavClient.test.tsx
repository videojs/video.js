import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { framework, project, media, skin, template, useCase } from '@/stores/installation';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  savePageScrollForNavigation: vi.fn(),
}));

vi.mock('astro:transitions/client', () => ({ navigate: mocks.navigate }));
vi.mock('@/utils/docs/navigation', () => ({
  DOCS_FRAMEWORK_NAVIGATION_INFO: { docsNavigation: 'framework' },
  savePageScrollForNavigation: mocks.savePageScrollForNavigation,
}));

import InstallationMethodNavClient from './InstallationMethodNavClient';

describe('InstallationMethodNavClient', () => {
  afterEach(() => {
    cleanup();
    useCase.set('default-video');
    skin.set('video');
    media.set('html5-video');
    template.set('next');
    project.set('existing');
    framework.set('react');
    window.history.replaceState(null, '', '/');
    vi.clearAllMocks();
  });

  it('shows the methods supported by React', () => {
    const markup = renderToString(<InstallationMethodNavClient currentFramework="react" route="react" />);

    expect(markup).toContain('data-installation-method="packaged"');
    expect(markup).toContain('data-installation-method="shadcn"');
    expect(markup).toContain('href="/docs/guides/installation/shadcn?framework=react"');
    expect(markup).not.toContain('data-installation-method="cdn"');
  });

  it('shows every method supported by HTML', () => {
    const markup = renderToString(<InstallationMethodNavClient currentFramework="html" route="cdn" />);

    expect(markup).toContain('data-installation-method="packaged"');
    expect(markup).toContain('data-installation-method="shadcn"');
    expect(markup).toContain('href="/docs/guides/installation/shadcn?framework=html"');
    expect(markup).toContain('data-installation-method="cdn"');
  });

  it('keeps the active CDN method visible while route state is normalized', () => {
    media.set('vimeo');

    const markup = renderToString(<InstallationMethodNavClient currentFramework="html" route="cdn" />);

    expect(markup).toContain('data-installation-method="cdn"');
  });

  it('offers Vue and Svelte only the packaged method', () => {
    const vue = renderToString(<InstallationMethodNavClient currentFramework="vue" route="vue" />);
    const svelte = renderToString(<InstallationMethodNavClient currentFramework="svelte" route="svelte" />);

    expect(vue).toContain('data-installation-method="packaged"');
    expect(vue).not.toContain('data-installation-method="shadcn"');
    expect(vue).not.toContain('data-installation-method="cdn"');
    expect(svelte).toContain('data-installation-method="packaged"');
    expect(svelte).not.toContain('data-installation-method="shadcn"');
    expect(svelte).not.toContain('data-installation-method="cdn"');
  });

  it('keeps Shadcn in place but disables it when the selected player has no registry source', async () => {
    const { queryByRole } = render(<InstallationMethodNavClient currentFramework="html" route="html" />);

    expect(queryByRole('link', { name: /Shadcn/ })).not.toHaveAttribute('aria-disabled');

    act(() => {
      useCase.set('background-video');
      media.set('background-video');
    });

    await waitFor(() => expect(queryByRole('link', { name: /Shadcn/ })).toHaveAttribute('aria-disabled', 'true'));

    act(() => {
      useCase.set('default-video');
      media.set('html5-video');
      skin.set('none');
    });

    await waitFor(() => expect(queryByRole('link', { name: /Shadcn/ })).toHaveAttribute('aria-disabled', 'true'));
  });

  it('keeps Shadcn in place but disables it when plain HTML keeps its existing app setup', async () => {
    const { queryByRole } = render(<InstallationMethodNavClient currentFramework="html" route="html" />);

    expect(queryByRole('link', { name: /Shadcn/ })).toBeInTheDocument();

    act(() => template.set('none'));

    await waitFor(() => expect(queryByRole('link', { name: /Shadcn/ })).toHaveAttribute('aria-disabled', 'true'));
    expect(queryByRole('link', { name: /CDN/ })).toBeInTheDocument();
  });

  it('hydrates query-backed card filters against the prerendered defaults', async () => {
    const container = document.createElement('div');

    container.innerHTML = renderToString(<InstallationMethodNavClient currentFramework="react" route="react" />);
    document.body.append(container);

    act(() => {
      useCase.set('background-video');
      media.set('background-video');
    });

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const root = hydrateRoot(container, <InstallationMethodNavClient currentFramework="react" route="react" />);

    await act(async () => {});

    expect(consoleError).not.toHaveBeenCalled();
    expect(container.querySelector('[data-installation-method="shadcn"]')).toHaveAttribute('aria-disabled', 'true');

    root.unmount();
    container.remove();
  });

  it('offers CDN on the Shadcn guide only for the HTML framework', async () => {
    framework.set('html');
    const { queryByRole } = render(<InstallationMethodNavClient currentFramework="react" route="shadcn" />);

    await waitFor(() => expect(queryByRole('link', { name: /CDN/ })).not.toHaveAttribute('aria-disabled'));

    act(() => framework.set('react'));

    await waitFor(() => expect(queryByRole('link', { name: /CDN/ })).not.toBeInTheDocument());
  });

  it('carries HTML selections into the HTML Shadcn route', async () => {
    window.history.replaceState(null, '', '/docs/guides/installation/html?preset=audio');
    useCase.set('default-audio');
    skin.set('neutral-audio');
    media.set('html5-audio');
    template.set('vite');
    // Let the store write the picks to the URL, as it does before a reader reaches the method cards.
    await Promise.resolve();

    const { getByRole } = render(<InstallationMethodNavClient currentFramework="html" route="html" />);
    const link = getByRole('link', { name: /Shadcn/ });

    await waitFor(() => expect(link.getAttribute('href')).toContain('preset=audio'));
    fireEvent.click(link);
    await Promise.resolve();

    const target = '/docs/guides/installation/shadcn?preset=audio&skin=neutral&framework=html';

    expect(mocks.savePageScrollForNavigation).toHaveBeenCalledWith(target, '[data-installation-method-nav]');
    expect(mocks.navigate).toHaveBeenCalledWith(target, {
      history: 'push',
      info: { docsNavigation: 'framework' },
    });
  });

  it('carries the new-project starting point between installation methods', async () => {
    window.history.replaceState(null, '', '/docs/guides/installation/react?project=new');
    project.set('new');

    const { getByRole } = render(<InstallationMethodNavClient currentFramework="react" route="react" />);
    const link = getByRole('link', { name: /Shadcn/ });

    await waitFor(() => expect(link.getAttribute('href')).toContain('project=new'));
  });

  it('prerenders the active method from the route', () => {
    const shadcn = renderToString(<InstallationMethodNavClient currentFramework="react" route="shadcn" />);
    const cdn = renderToString(<InstallationMethodNavClient currentFramework="html" route="cdn" />);

    expect(shadcn).toMatch(/data-installation-method="shadcn" aria-current="page"[^>]*ring-accent/);
    expect(shadcn).not.toContain('data-installation-method="cdn"');
    expect(cdn).toMatch(/data-installation-method="cdn" aria-current="page"[^>]*ring-accent/);
  });

  it('keeps Shadcn available from an existing CDN page', () => {
    const { queryByRole } = render(<InstallationMethodNavClient currentFramework="html" route="cdn" />);

    act(() => template.set('none'));

    expect(queryByRole('link', { name: /Shadcn/ })).not.toHaveAttribute('aria-disabled');
  });

  it('hands method navigation to Astro with the existing scroll restoration metadata', async () => {
    window.history.replaceState(null, '', '/docs/guides/installation/react?preset=audio');
    useCase.set('default-audio');
    skin.set('neutral-audio');
    media.set('html5-audio');
    const { getByRole } = render(<InstallationMethodNavClient currentFramework="react" route="react" />);
    const link = getByRole('link', { name: /Shadcn/ });

    await waitFor(() => expect(link.getAttribute('href')).toContain('preset=audio'));
    fireEvent.click(link);
    await Promise.resolve();

    const target = '/docs/guides/installation/shadcn?preset=audio&skin=neutral&framework=react';

    expect(mocks.savePageScrollForNavigation).toHaveBeenCalledWith(target, '[data-installation-method-nav]');
    expect(mocks.navigate).toHaveBeenCalledWith(target, {
      history: 'push',
      info: { docsNavigation: 'framework' },
    });
  });

  it('leaves modified clicks to the native link behavior', () => {
    window.history.replaceState(null, '', '/docs/guides/installation/react');
    const { getByRole } = render(<InstallationMethodNavClient currentFramework="react" route="react" />);
    const link = getByRole('link', { name: /Shadcn/ });

    link.setAttribute('target', '_blank');
    fireEvent.click(link, { metaKey: true });

    expect(mocks.savePageScrollForNavigation).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
