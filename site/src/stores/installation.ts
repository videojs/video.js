import {
  defaultInstallationExtensions,
  fitSelectionToPreset,
  getInstallationPreset,
  installationExtensionsFor,
  PRIVATE_INSTALLATION_QUERY_PARAMETERS,
  resolveInstallationTemplate,
  resolveRegistryStyling,
  sourceFrameworkFor,
  type InstallMethod,
  type InstallationFramework,
  type InstallationExtension,
  type InstallationProject,
  type InstallationTemplate,
  type RegistryStyling,
  type Renderer,
  type Skin,
  type UseCase,
} from '@videojs/installation';
import type { TransitionBeforeSwapEvent } from 'astro:transitions/client';
import { atom, type WritableAtom } from 'nanostores';

import { getFrameworkPreferenceClient } from '@/utils/docs/preferences';
import { getInstallationRouteSegment, type InstallationRouteSegment } from '@/utils/installation/routes';
import {
  DEFAULT_SELECTION,
  type InstallationUiSelection,
  isCustomInstallationSelection,
  parseInstallationSearchForRoute,
  serializeInstallationSearchForRoute,
} from '@/utils/installation/url-state';

function selectionFromUrl(target: Pick<URL, 'pathname' | 'search'>): InstallationUiSelection {
  const route = getInstallationRouteSegment(target.pathname);
  if (!route) return DEFAULT_SELECTION;

  return parseInstallationSearchForRoute(route, target.search, getFrameworkPreferenceClient() ?? undefined);
}

const initialSelection = globalThis.location ? selectionFromUrl(location) : DEFAULT_SELECTION;

export const media = atom<Renderer>(initialSelection.media);
export const extensions = atom<readonly InstallationExtension[]>(initialSelection.extensions);
export const framework = atom<InstallationFramework>(initialSelection.framework);
export const template = atom<InstallationTemplate>(initialSelection.template);
export const project = atom<InstallationProject>(initialSelection.project);
export const skin = atom<Skin>(initialSelection.skin);
export const useCase = atom<UseCase>(initialSelection.useCase);
export const sourceUrl = atom<string>(initialSelection.sourceUrl);
export const installMethod = atom<InstallMethod>(initialSelection.installMethod);
export const styling = atom<RegistryStyling | null>(initialSelection.styling);

/** Mux playback ID from successful upload (used by code generation) */
export const muxPlaybackId = atom<string | null>(null);

/**
 * The picks live in the page URL so a reload, a shared link, or coming back from another page lands on the same player.
 * The atoms start from the URL, and every change rewrites it in place so the history stack stays one entry per page.
 */
type SelectionAtoms = { [K in keyof InstallationUiSelection]: WritableAtom<InstallationUiSelection[K]> };

export const selectionAtoms: SelectionAtoms = {
  framework,
  template,
  project,
  // Use case before skin and media: its listener fits them to the preset before their own values arrive.
  useCase,
  skin,
  media,
  extensions,
  sourceUrl,
  installMethod,
  styling,
};

// SAFETY: `selectionAtoms` has exactly one atom per selection key.
const SELECTION_KEYS = Object.keys(selectionAtoms) as (keyof InstallationUiSelection)[];

let syncedUrl: string | null = null;
let applyingSelection = false;
let urlWriteScheduled = false;

export function currentInstallationSelection(): InstallationUiSelection {
  return {
    framework: framework.get(),
    template: template.get(),
    project: project.get(),
    useCase: useCase.get(),
    skin: skin.get(),
    media: media.get(),
    extensions: extensions.get(),
    sourceUrl: sourceUrl.get(),
    installMethod: installMethod.get(),
    styling: styling.get(),
  };
}

/**
 * Mirror the selection onto `<html>` for the CSS that picks prerendered branches. The inline script in
 * `InstallationFrameworkInit.astro` writes the same attributes from the URL before hydration.
 */
function syncInstallationDocument(route: InstallationRouteSegment, selection: InstallationUiSelection): void {
  const root = document.documentElement;

  root.dataset.installationPreset = getInstallationPreset(selection.useCase).flag;
  root.dataset.installationProject = selection.project;
  root.dataset.installationTemplate = selection.template;

  if (route === 'shadcn') {
    const registryFramework = sourceFrameworkFor(selection.framework);

    root.dataset.registryFramework = registryFramework;
    root.dataset.registryStyling = resolveRegistryStyling(registryFramework, selection.styling);
  }

  root.toggleAttribute('data-installation-pending', isCustomInstallationSelection(route, selection));
}

/**
 * Point the head's Markdown twin at the picks. The link is prerendered without a query, so an agent following it would
 * otherwise read the default plan. Private input such as a source URL stays out of the advertised link.
 */
function syncMarkdownAlternate(search: string): void {
  const link = document.querySelector<HTMLLinkElement>('link[rel="alternate"][type="text/markdown"]');
  if (!link) return;

  const href = new URL(link.href);
  const params = new URLSearchParams(search);

  for (const parameter of PRIVATE_INSTALLATION_QUERY_PARAMETERS) params.delete(parameter);

  href.search = params.toString();
  link.href = href.href;
}

/**
 * The one writer for installation URLs: replace the current entry's query with the canonical one for the picks, and
 * keep the Markdown twin link and the analytics context in step.
 */
function writeInstallationUrl(): void {
  urlWriteScheduled = false;

  if (!globalThis.location) return;

  const route = getInstallationRouteSegment(location.pathname);
  if (!route) return;

  const selection = currentInstallationSelection();
  const search = serializeInstallationSearchForRoute(route, selection, location.search);

  if (search !== location.search)
    history.replaceState(history.state, '', `${location.pathname}${search}${location.hash}`);

  syncedUrl = `${location.pathname}${search}`;
  syncInstallationDocument(route, selection);
  syncMarkdownAlternate(search);
}

/**
 * Write once the picks settle. One choice can set several stores, since the listeners below fit the others to it, and
 * writing after each store would put combinations such as audio with a video renderer into the address bar.
 */
function scheduleInstallationUrlWrite(): void {
  if (urlWriteScheduled) return;

  urlWriteScheduled = true;
  queueMicrotask(() => {
    if (urlWriteScheduled) writeInstallationUrl();
  });
}

function applySelection(patch: Partial<InstallationUiSelection>): void {
  applyingSelection = true;

  try {
    for (const key of SELECTION_KEYS) {
      // SAFETY: `patch[key]` has the value type of the atom stored under the same key.
      if (key in patch) (selectionAtoms[key] as WritableAtom<unknown>).set(patch[key]);
    }
  } finally {
    applyingSelection = false;
  }
}

/** Apply several picks as one change, so the URL is written once for the combined selection. */
export function updateInstallationSelection(patch: Partial<InstallationUiSelection>): void {
  applySelection(patch);
  writeInstallationUrl();
}

/**
 * Replace every installation pick from a destination URL before its islands render. A destination other than the
 * current location, such as the one Astro announces before a swap, updates the stores and leaves the address bar
 * alone.
 */
export function syncInstallationSelectionFromUrl(url?: URL): void {
  const target = url ?? (globalThis.location ? new URL(location.href) : null);
  if (!target || !getInstallationRouteSegment(target.pathname)) return;

  const urlKey = `${target.pathname}${target.search}`;

  if (syncedUrl !== urlKey) {
    syncedUrl = urlKey;
    applySelection(selectionFromUrl(target));
  }

  if (globalThis.location && target.pathname === location.pathname && target.search === location.search) {
    writeInstallationUrl();
  }
}

export function selectInstallationTemplate(nextTemplate: InstallationTemplate): void {
  const patch: Partial<InstallationUiSelection> = {
    template: resolveInstallationTemplate(framework.get(), nextTemplate),
  };

  if (patch.template === 'none') patch.project = 'existing';

  updateInstallationSelection(patch);
}

export function selectInstallationStartingPoint(nextProject: InstallationProject): void {
  project.set(template.get() === 'none' ? 'existing' : nextProject);
}

/** The CDN guide pairs each starting point with the app setup the resolver defaults it to: a Vite app or a plain page. */
export function selectCdnStartingPoint(nextProject: InstallationProject): void {
  const { template: nextTemplate } = parseInstallationSearchForRoute('cdn', `?project=${nextProject}`);

  updateInstallationSelection({ project: nextProject, template: nextTemplate });
}

for (const store of Object.values(selectionAtoms)) {
  store.listen(() => {
    if (!applyingSelection) scheduleInstallationUrlWrite();
  });
}

// A new use case can leave the skin and media pointing at options its preset does not offer. Fit them here, from the
// store's own values, so every island agrees. Pickers fixing the store from their rendered props raced hydration: the
// rendered use case was still the server default while the store already held the URL's picks.
useCase.listen((next) => {
  const fitted = fitSelectionToPreset(next, skin.get(), media.get());

  if (fitted.skin !== skin.get()) skin.set(fitted.skin);

  if (fitted.media !== media.get()) media.set(fitted.media);

  const available = installationExtensionsFor(next, skin.get(), media.get());
  const selected = extensions.get().filter((extension) => available.includes(extension));

  if (selected.length !== extensions.get().length) extensions.set(selected);
});

skin.listen((next) => {
  const available = installationExtensionsFor(useCase.get(), next, media.get());
  const selected = extensions.get().filter((extension) => available.includes(extension));

  if (selected.length !== extensions.get().length) extensions.set(selected);
});

media.listen((next) => {
  const available = installationExtensionsFor(useCase.get(), skin.get(), next);
  const selected = extensions.get().filter((extension) => available.includes(extension));
  const defaults = defaultInstallationExtensions(next).filter((extension) => available.includes(extension));
  const fitted = [...new Set([...selected, ...defaults])];

  if (
    fitted.length !== extensions.get().length ||
    fitted.some((extension, index) => extensions.get()[index] !== extension)
  ) {
    extensions.set(fitted);
  }
});

if (globalThis.document) {
  document.addEventListener('astro:before-swap', (event: TransitionBeforeSwapEvent) => {
    syncInstallationSelectionFromUrl(event.to);
  });
  document.addEventListener('astro:after-swap', () => syncInstallationSelectionFromUrl());

  syncInstallationSelectionFromUrl();
}
