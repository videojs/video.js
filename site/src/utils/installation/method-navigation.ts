import {
  CDN_MEDIA_SUBPATHS,
  defaultInstallationTemplate,
  isInstallationTemplate,
  registrySkinSelection,
  rendererSupportsCdn,
  resolveInstallationTemplateForMethod,
  type InstallationFramework,
  type InstallationMethod,
  type RegistryFramework,
} from '@videojs/installation';

import {
  getInstallationRoutePath,
  getInstallationRouteSegment,
  isShadcnInstallationUrl,
} from '@/utils/installation/routes';
import type { InstallationUiSelection } from '@/utils/installation/url-state';
import { canonicalInstallationSearch, serializeInstallationSearch } from '@/utils/installation/url-state';

export type { InstallationMethod } from '@videojs/installation';

/** The guide for one installation method, before the reader's picks join its query. */
export function installationMethodBaseHref(method: InstallationMethod, framework: InstallationFramework): string {
  if (method === 'packaged') return getInstallationRoutePath(framework);

  if (method === 'shadcn') return `${getInstallationRoutePath('shadcn')}?framework=${framework}`;

  return getInstallationRoutePath('cdn');
}

/** Whether a reader can switch from the `current` method's guide to `method` with these picks. */
export function isInstallationMethodAvailable(
  method: InstallationMethod,
  current: InstallationMethod,
  { template, useCase, skin, media }: Pick<InstallationUiSelection, 'template' | 'useCase' | 'skin' | 'media'>
): boolean {
  if (method === current) return true;

  if (method === 'shadcn') {
    // A packaged existing site without a bundler cannot build skin source; Shadcn gives a plain CDN page its default
    // app setup instead.
    if (current !== 'cdn' && template === 'none') return false;

    return registrySkinSelection({ useCase, skin }) !== null;
  }

  if (method === 'cdn') return rendererSupportsCdn(media, CDN_MEDIA_SUBPATHS);

  return true;
}

/** Carry compatible installation choices to another method's guide. */
export function resolveInstallationMethodUrl(current: URL, href: string, method: InstallationMethod): URL {
  const target = new URL(href, current);
  const hrefParams = [...target.searchParams];

  target.search = current.search;

  for (const [key, value] of hrefParams) target.searchParams.set(key, value);

  if (method === 'packaged') {
    if (isShadcnInstallationUrl(current)) {
      const requested = current.searchParams.get('framework');
      const framework = requested === 'html' ? 'html' : 'react';

      target.pathname = getInstallationRoutePath(framework);
    }

    target.searchParams.delete('framework');
    target.searchParams.delete('styling');
  } else if (method === 'shadcn') {
    const requested = target.searchParams.get('framework') ?? getInstallationRouteSegment(current.pathname);
    const framework: RegistryFramework = requested === 'react' ? 'react' : 'html';
    const requestedTemplate = target.searchParams.get('template');
    const template = resolveInstallationTemplateForMethod(
      framework,
      isInstallationTemplate(requestedTemplate) ? requestedTemplate : null,
      'shadcn'
    );

    target.searchParams.set('framework', framework);

    if (template === defaultInstallationTemplate(framework)) target.searchParams.delete('template');
    else target.searchParams.set('template', template);
  } else if (method === 'cdn') {
    // Other guides' app setups do not carry over; the CDN guide derives its own from the starting point.
    target.searchParams.delete('template');
    target.search = canonicalInstallationSearch('cdn', target.search);
  }

  return target;
}

/** Build the native card href from the latest picker state, including navigation opened in another tab. */
export function resolveInstallationMethodHref(
  current: URL,
  href: string,
  method: InstallationMethod,
  selection: InstallationUiSelection,
  framework?: InstallationFramework
): string {
  const source = new URL(current);

  source.search = serializeInstallationSearch(selection, source.search);

  if (framework && (isShadcnInstallationUrl(source) || method === 'shadcn')) {
    source.searchParams.set('framework', framework);
  }

  const target = resolveInstallationMethodUrl(source, href, method);

  return `${target.pathname}${target.search}${target.hash}`;
}
