/**
 * The reader's installation picks as analytics properties. The browser events and the edge's Markdown reads both build
 * them here, so a human's and an agent's install plan break down the same way in PostHog. Relative imports only: the
 * edge bundle can't resolve the `@/` alias.
 */

import { getInstallationPreset, type InstallationFramework } from '@videojs/installation';

import { getInstallationRouteSegment, type InstallationRouteSegment } from './routes.ts';
import { parseInstallationSearchForRoute, type InstallationUiSelection } from './url-state.ts';

export type InstallationAnalyticsContext = Record<`installation_${string}`, string | boolean | null>;

/**
 * Every pick, defaults included, named after the guide's query parameters. The source URL itself stays out; only
 * whether one was given.
 */
export function installationAnalyticsContext(
  route: InstallationRouteSegment,
  selection: InstallationUiSelection
): InstallationAnalyticsContext {
  return {
    installation_route: route,
    installation_method: selection.installMethod,
    installation_framework: selection.framework,
    installation_project: selection.project,
    installation_template: selection.template,
    installation_preset: getInstallationPreset(selection.useCase).flag,
    installation_skin: selection.skin,
    installation_media: selection.media,
    installation_extensions: selection.extensions.join(','),
    installation_styling: selection.styling,
    installation_custom_source: selection.sourceUrl !== '',
  };
}

/** The picks an installation guide URL, HTML or Markdown, describes, read the way the installation store reads them. */
export function installationContextForUrl(
  pathname: string,
  search: string,
  shadcnFramework?: InstallationFramework
): InstallationAnalyticsContext {
  const route = getInstallationRouteSegment(pathname);
  if (!route) return {};

  return installationAnalyticsContext(route, parseInstallationSearchForRoute(route, search, shadcnFramework));
}
