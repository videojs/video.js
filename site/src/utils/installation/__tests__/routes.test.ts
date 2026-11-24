import { describe, expect, it } from 'vite-plus/test';

import { resolveInstallationMarkdownPlan } from '../markdown';
import {
  getInstallationRouteForSlug,
  getInstallationRoutePath,
  getInstallationRouteSegment,
  INSTALLATION_ROUTES,
  INSTALLATION_ROUTE_SEGMENTS,
  installationMarkdownGuides,
  isInstallationRouteSegment,
  isShadcnInstallationUrl,
} from '../routes';

describe('installation routes', () => {
  it('defines the six public installation pages', () => {
    expect(INSTALLATION_ROUTE_SEGMENTS).toEqual(['react', 'html', 'vue', 'svelte', 'shadcn', 'cdn']);
    expect(INSTALLATION_ROUTE_SEGMENTS.map(getInstallationRoutePath)).toEqual([
      '/docs/guides/installation/react',
      '/docs/guides/installation/html',
      '/docs/guides/installation/vue',
      '/docs/guides/installation/svelte',
      '/docs/guides/installation/shadcn',
      '/docs/guides/installation/cdn',
    ]);
  });

  it('keeps supported frameworks with each source document', () => {
    expect(INSTALLATION_ROUTES.react).toMatchObject({ framework: 'react', frameworks: ['react'] });
    expect(INSTALLATION_ROUTES.vue).toMatchObject({ framework: 'html', frameworks: ['html'] });
    expect(INSTALLATION_ROUTES.shadcn).toMatchObject({
      framework: 'react',
      frameworks: ['react', 'html'],
    });
    expect(INSTALLATION_ROUTES.cdn).toMatchObject({ framework: 'html', frameworks: ['html'] });
  });

  it('validates installation route segments', () => {
    expect(isInstallationRouteSegment('shadcn')).toBe(true);
    expect(isInstallationRouteSegment('angular')).toBe(false);
    expect(isInstallationRouteSegment(undefined)).toBe(false);
  });

  it('parses HTML and Markdown installation paths through the same route table', () => {
    expect(getInstallationRouteSegment('/docs/guides/installation/shadcn')).toBe('shadcn');
    expect(getInstallationRouteSegment('/docs/guides/installation/shadcn.md')).toBe('shadcn');
    expect(getInstallationRouteSegment('/docs/guides/installation/shadcn/')).toBe('shadcn');
    expect(getInstallationRouteSegment('/docs/guides/installation')).toBeNull();
    expect(getInstallationRouteSegment('/docs/guides/cdn')).toBeNull();
  });

  it('recognizes the Shadcn guide in HTML and Markdown URLs', () => {
    expect(isShadcnInstallationUrl(new URL('https://videojs.org/docs/guides/installation/shadcn.md'))).toBe(true);
    expect(isShadcnInstallationUrl(new URL('https://videojs.org/docs/guides/installation/react?framework=html'))).toBe(
      false
    );
  });

  it('maps guide slugs to the route that renders them', () => {
    expect(getInstallationRouteForSlug('guides/installation', 'html')).toBe('html');
    expect(getInstallationRouteForSlug('guides/installation-shadcn', 'react')).toBe('shadcn');
    expect(getInstallationRouteForSlug('guides/installation-cdn', 'react')).toBe('cdn');
    expect(getInstallationRouteForSlug('guides/architecture', 'react')).toBeNull();
  });

  it('leaves frameworks without an installation route in the framework flow', () => {
    expect(getInstallationRouteForSlug('guides/installation', 'react-native')).toBeNull();
    expect(getInstallationRouteForSlug('guides/installation-react-native', 'react-native')).toBeNull();
    expect(getInstallationRouteForSlug('guides/installation-cdn', 'react-native')).toBe('cdn');
  });
});

describe('installationMarkdownGuides', () => {
  it('lists every route by method, with a Shadcn entry per source framework', () => {
    expect(installationMarkdownGuides()).toEqual([
      {
        method: 'packaged',
        title: 'Packaged modules',
        guides: [
          { label: 'React', path: '/docs/guides/installation/react.md' },
          { label: 'HTML', path: '/docs/guides/installation/html.md' },
          { label: 'Vue', path: '/docs/guides/installation/vue.md' },
          { label: 'Svelte', path: '/docs/guides/installation/svelte.md' },
        ],
      },
      {
        method: 'shadcn',
        title: 'Editable Shadcn source',
        guides: [
          { label: 'React source', path: '/docs/guides/installation/shadcn.md?framework=react' },
          { label: 'HTML source', path: '/docs/guides/installation/shadcn.md?framework=html' },
        ],
      },
      {
        method: 'cdn',
        title: 'CDN',
        guides: [{ label: 'HTML from jsDelivr', path: '/docs/guides/installation/cdn.md' }],
      },
    ]);
  });

  it('only links Markdown guides that render a plan for their method', () => {
    for (const { method, guides } of installationMarkdownGuides()) {
      for (const { path } of guides) {
        const url = new URL(path, 'https://videojs.org');

        expect(resolveInstallationMarkdownPlan(url.pathname, url.searchParams)).toMatchObject({
          ok: true,
          plan: { selection: { method } },
        });
      }
    }
  });
});
