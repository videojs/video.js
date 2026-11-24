import {
  INSTALLATION_FRAMEWORKS,
  INSTALLATION_METHODS,
  installationMethodsForFramework,
  type InstallationFramework,
  type InstallationMethod,
} from '@videojs/installation';

import type { SupportedFramework } from '../../types/docs.ts';

export const INSTALLATION_ROUTE_SEGMENTS = ['react', 'html', 'vue', 'svelte', 'shadcn', 'cdn'] as const;
export type InstallationRouteSegment = (typeof INSTALLATION_ROUTE_SEGMENTS)[number];

export interface InstallationRouteConfig {
  description: string;
  framework: SupportedFramework;
  frameworks: readonly SupportedFramework[];
  /** The installation method every selection on this route uses. */
  method: InstallationMethod;
  /** The framework the route selects; on the Shadcn route, the default of its `framework` query parameter. */
  pickerFramework: InstallationFramework;
  slug: string;
}

/** Public installation routes and the source document each route renders. */
export const INSTALLATION_ROUTES = {
  react: {
    description:
      'Install Video.js in React and build an accessible, customizable video player with composable controls',
    framework: 'react',
    frameworks: ['react'],
    method: 'packaged',
    pickerFramework: 'react',
    slug: 'guides/installation',
  },
  html: {
    description: 'Install Video.js with HTML custom elements and build an accessible, customizable video player',
    framework: 'html',
    frameworks: ['html'],
    method: 'packaged',
    pickerFramework: 'html',
    slug: 'guides/installation',
  },
  vue: {
    description: 'Install Video.js in Vue or Nuxt and build a video player with HTML custom elements',
    framework: 'html',
    frameworks: ['html'],
    method: 'packaged',
    pickerFramework: 'vue',
    slug: 'guides/installation-vue',
  },
  svelte: {
    description: 'Install Video.js in Svelte or SvelteKit and build a video player with HTML custom elements',
    framework: 'html',
    frameworks: ['html'],
    method: 'packaged',
    pickerFramework: 'svelte',
    slug: 'guides/installation-svelte',
  },
  shadcn: {
    description: 'Add editable React or HTML skin source with the Shadcn registry',
    framework: 'react',
    frameworks: ['react', 'html'],
    method: 'shadcn',
    pickerFramework: 'react',
    slug: 'guides/installation-shadcn',
  },
  cdn: {
    description: 'Load Video.js from jsDelivr and build an HTML video player without installing Video.js packages',
    framework: 'html',
    frameworks: ['html'],
    method: 'cdn',
    pickerFramework: 'html',
    slug: 'guides/installation-cdn',
  },
} as const satisfies Record<InstallationRouteSegment, InstallationRouteConfig>;

export const CANONICAL_INSTALLATION_SLUGS: ReadonlySet<string> = new Set(
  Object.values(INSTALLATION_ROUTES).map(({ slug }) => slug)
);

export function isInstallationRouteSegment(value: string | undefined): value is InstallationRouteSegment {
  return INSTALLATION_ROUTE_SEGMENTS.some((route) => route === value);
}

/** Parent path of every installation guide; it redirects to the reader's framework. */
export const INSTALLATION_ROUTE_PREFIX = '/docs/guides/installation';

export function getInstallationRoutePath(route: InstallationRouteSegment): string {
  return `${INSTALLATION_ROUTE_PREFIX}/${route}`;
}

export const SHADCN_INSTALLATION_PATH = getInstallationRoutePath('shadcn');

/** Resolve a canonical installation route from its HTML or Markdown pathname. */
export function getInstallationRouteSegment(pathname: string): InstallationRouteSegment | null {
  const normalized = pathname.replace(/\.md$/, '').replace(/\/$/, '');
  const prefix = `${INSTALLATION_ROUTE_PREFIX}/`;
  if (!normalized.startsWith(prefix)) return null;

  const route = normalized.slice(prefix.length);

  return isInstallationRouteSegment(route) ? route : null;
}

const INSTALLATION_FRAMEWORK_TITLES = {
  react: 'React',
  html: 'HTML',
  vue: 'Vue',
  svelte: 'Svelte',
} as const satisfies Record<InstallationFramework, string>;

const INSTALLATION_METHOD_TITLES = {
  packaged: 'Packaged modules',
  shadcn: 'Editable Shadcn source',
  cdn: 'CDN',
} as const satisfies Record<InstallationMethod, string>;

export interface InstallationMarkdownGuide {
  label: string;
  /** Root-relative Markdown path, with the query that selects the framework on the Shadcn route. */
  path: string;
}

export interface InstallationMarkdownGuideGroup {
  method: InstallationMethod;
  title: string;
  guides: readonly InstallationMarkdownGuide[];
}

function installationMarkdownGuidesFor(route: InstallationRouteSegment): InstallationMarkdownGuide[] {
  const { method, pickerFramework } = INSTALLATION_ROUTES[route];
  const path = `${getInstallationRoutePath(route)}.md`;

  if (method === 'cdn') return [{ label: 'HTML from jsDelivr', path }];

  if (method === 'packaged') return [{ label: INSTALLATION_FRAMEWORK_TITLES[pickerFramework], path }];

  return INSTALLATION_FRAMEWORKS.filter((framework) => installationMethodsForFramework(framework).includes(method)).map(
    (framework) => ({
      label: `${INSTALLATION_FRAMEWORK_TITLES[framework]} source`,
      path: `${path}?framework=${framework}`,
    })
  );
}

/** The Markdown entry point for every installation route and Shadcn source framework, grouped by method. */
export function installationMarkdownGuides(): InstallationMarkdownGuideGroup[] {
  return INSTALLATION_METHODS.map((method) => ({
    method,
    title: INSTALLATION_METHOD_TITLES[method],
    guides: INSTALLATION_ROUTE_SEGMENTS.filter((route) => INSTALLATION_ROUTES[route].method === method).flatMap(
      installationMarkdownGuidesFor
    ),
  }));
}

export function isShadcnInstallationUrl(url: Pick<URL, 'pathname'>): boolean {
  return getInstallationRouteSegment(url.pathname) === 'shadcn';
}

/**
 * The installation route that renders a guide slug. React and HTML share one document, so `framework` picks between
 * them. A framework with no route here, such as React Native, keeps its installation guide in the framework flow.
 */
export function getInstallationRouteForSlug(
  slug: string | null | undefined,
  framework: SupportedFramework
): InstallationRouteSegment | null {
  if (isInstallationRouteSegment(framework) && slug === INSTALLATION_ROUTES[framework].slug) return framework;

  return (
    INSTALLATION_ROUTE_SEGMENTS.find(
      (route) => route !== 'react' && route !== 'html' && INSTALLATION_ROUTES[route].slug === slug
    ) ?? null
  );
}
