import {
  containsControlCharacter,
  defaultInstallationExtensions,
  getInstallationPreset,
  INSTALLATION_DEMO_SOURCE_URL,
  INSTALLATION_PARAMETERS,
  installationParameterForKey,
  isInstallationFramework,
  resolveInstallationSelection,
  serializeInstallationExtensions,
  skinToFlag,
  sourceFrameworkFor,
  type InstallMethod,
  type InstallationExtension,
  type InstallationFramework,
  type InstallationInput,
  type InstallationMethod,
  type InstallationProject,
  type InstallationSelection,
  type InstallationTemplate,
  type RegistryStyling,
  type Renderer,
  type Skin,
  type UseCase,
} from '@videojs/installation';

import { INSTALLATION_ROUTES, type InstallationRouteSegment } from './routes.ts';

/**
 * The installation choices encoded in the page URL. `package-manager` controls app setup and development commands
 * whenever the selected path uses them. `styling` is `null` until a reader picks a Shadcn catalog, so the framework's
 * default applies.
 */
export interface InstallationUiSelection {
  framework: InstallationFramework;
  template: InstallationTemplate;
  project: InstallationProject;
  useCase: UseCase;
  skin: Skin;
  media: Renderer;
  extensions: readonly InstallationExtension[];
  sourceUrl: string;
  installMethod: InstallMethod;
  styling: RegistryStyling | null;
}

export const DEFAULT_SELECTION: InstallationUiSelection = {
  framework: 'react',
  template: 'next',
  project: 'existing',
  useCase: 'default-video',
  skin: 'video',
  media: 'html5-video',
  extensions: [],
  sourceUrl: '',
  installMethod: 'pnpm',
  styling: null,
};

interface ParseOptions {
  /** A framework fixed by the page instead of the `framework` query. */
  framework?: InstallationFramework | undefined;
  method?: InstallationMethod | undefined;
}

const SOURCE_URL_QUERY = installationParameterForKey('sourceUrl').query;

function methodForRoute(route: InstallationRouteSegment | ''): InstallationMethod {
  return route === 'shadcn' || route === 'cdn' ? route : 'packaged';
}

/**
 * Resolve input with the shared installation rules, keeping its method and framework. A reader can land on any
 * hand-edited link, so each rejected choice is dropped in parameter order until the rest resolves, and the page shows
 * that choice's default instead.
 */
export function resolveInstallationInputWithFallbacks(input: InstallationInput): InstallationSelection {
  let remaining = input;

  for (;;) {
    const result = resolveInstallationSelection(remaining);
    if (result.ok) return result.selection;

    const rejected = INSTALLATION_PARAMETERS.find(
      ({ key }) =>
        key !== 'method' &&
        key !== 'framework' &&
        remaining[key] !== undefined &&
        result.errors.some((error) => error.field === key)
    );
    if (!rejected) throw new Error(`Cannot resolve installation input: ${JSON.stringify(result.errors)}`);

    remaining = { ...remaining };
    delete remaining[rejected.key];
  }
}

/** Read the selection encoded in a query string. Invalid or incompatible values fall back to their defaults. */
export function parseInstallationSearch(search: string, options: ParseOptions = {}): InstallationUiSelection {
  const params = new URLSearchParams(search);
  const method = options.method ?? 'packaged';
  const requestedFramework = params.get('framework');
  const framework =
    options.framework ??
    (isInstallationFramework(requestedFramework) ? requestedFramework : DEFAULT_SELECTION.framework);
  const input: InstallationInput = { method, framework };

  // The source URL stays out of resolution: on the page it only suggests media, so it must not replace or reject the
  // media pick the way detection does for agent commands.
  for (const { key, query } of INSTALLATION_PARAMETERS) {
    const value = params.get(query);

    if (value !== null && key !== 'method' && key !== 'framework' && key !== 'sourceUrl') input[key] = value;
  }

  const selection = resolveInstallationInputWithFallbacks(input);
  const requestedSourceUrl = params.get(SOURCE_URL_QUERY) ?? '';
  // The CLI's explicit demo choice is the page's empty source, so the URL drops it like any other default.
  const sourceUrl = requestedSourceUrl === INSTALLATION_DEMO_SOURCE_URL ? '' : requestedSourceUrl;

  return {
    framework: selection.framework,
    template: selection.template,
    project: selection.project,
    useCase: selection.useCase,
    skin: selection.skin,
    media: selection.media,
    extensions: selection.extensions,
    sourceUrl: containsControlCharacter(sourceUrl) ? '' : sourceUrl,
    installMethod: selection.packageManager,
    styling: selection.defaulted.includes('styling') ? null : selection.styling,
  };
}

/**
 * Parse a query for one installation guide. Dedicated routes fix the framework; the Shadcn guide reads it from the
 * query, falls back to `shadcnFramework`, and shows HTML source for Vue and Svelte.
 */
export function parseInstallationSearchForRoute(
  route: InstallationRouteSegment | '',
  search: string,
  shadcnFramework?: InstallationFramework
): InstallationUiSelection {
  const requested = new URLSearchParams(search).get('framework');
  const framework =
    route === 'shadcn'
      ? sourceFrameworkFor(
          isInstallationFramework(requested)
            ? requested
            : (shadcnFramework ?? INSTALLATION_ROUTES.shadcn.pickerFramework)
        )
      : route
        ? INSTALLATION_ROUTES[route].pickerFramework
        : undefined;

  return parseInstallationSearch(search, { framework, method: methodForRoute(route) });
}

/**
 * Write a selection back onto a query string, keeping unrelated params and leaving out anything still at its default so
 * an untouched page keeps a clean URL.
 */
export function serializeInstallationSearch(
  selection: InstallationUiSelection,
  search = '',
  method: InstallationMethod = 'packaged'
): string {
  const params = new URLSearchParams(search);
  const preset = getInstallationPreset(selection.useCase);
  const defaults = parseInstallationSearch(`?preset=${preset.flag}`, { framework: selection.framework, method });
  const defaultPreset = getInstallationPreset(DEFAULT_SELECTION.useCase).flag;

  const write = (key: string, value: string, fallback: string) => {
    if (value === fallback) params.delete(key);
    else params.set(key, value);
  };

  write('framework', selection.framework, DEFAULT_SELECTION.framework);
  write('template', selection.template, defaults.template);
  write('project', selection.project, defaults.project);
  write('preset', preset.flag, defaultPreset);

  if (selection.useCase === 'background-video') params.delete('skin');
  else write('skin', skinToFlag(selection.skin), skinToFlag(defaults.skin));

  write('media', selection.media, defaults.media);
  write(
    'extensions',
    serializeInstallationExtensions(selection.extensions),
    serializeInstallationExtensions(defaultInstallationExtensions(selection.media))
  );
  write('package-manager', selection.installMethod, defaults.installMethod);
  write(SOURCE_URL_QUERY, selection.sourceUrl, '');

  if (selection.styling) params.set('styling', selection.styling);
  else params.delete('styling');

  const string = params.toString();

  return string ? `?${string}` : '';
}

/** Remove installation parameters that the current guide cannot apply while retaining unrelated campaign params. */
export function serializeInstallationSearchForRoute(
  route: InstallationRouteSegment | '',
  selection: InstallationUiSelection,
  search = ''
): string {
  const params = new URLSearchParams(serializeInstallationSearch(selection, search, methodForRoute(route)));

  params.delete('method');

  let canonicalParams = params;

  if (route !== 'shadcn') {
    params.delete('framework');
    params.delete('styling');
  } else {
    // The framework always leads a Shadcn URL so a shared link does not depend on the reader's saved preference.
    canonicalParams = new URLSearchParams([['framework', selection.framework]]);

    for (const [key, value] of params) {
      if (key !== 'framework') canonicalParams.append(key, value);
    }
  }

  // An existing CDN page runs no package manager commands, so the choice has nothing to change there.
  if (route === 'cdn' && selection.template === 'none') canonicalParams.delete('package-manager');

  const string = canonicalParams.toString();

  return string ? `?${string}` : '';
}

/** The one canonical query for a guide: its picks as the page would show them, plus unrelated params. */
export function canonicalInstallationSearch(
  route: InstallationRouteSegment,
  search: string,
  shadcnFramework?: InstallationFramework
): string {
  return serializeInstallationSearchForRoute(
    route,
    parseInstallationSearchForRoute(route, search, shadcnFramework),
    search
  );
}

/** Whether a guide's prerendered picks, which use the route defaults, differ from `selection`. */
export function isCustomInstallationSelection(
  route: InstallationRouteSegment,
  selection: InstallationUiSelection
): boolean {
  return (
    serializeInstallationSearchForRoute(route, selection) !==
    serializeInstallationSearchForRoute(route, parseInstallationSearchForRoute(route, ''))
  );
}
