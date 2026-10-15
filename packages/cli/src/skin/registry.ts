import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  REGISTRY_NAMESPACE,
  registryCatalog,
  type RegistryFramework,
  type RegistryPreset,
  type RegistryStyling,
  type RegistryTheme,
} from '@videojs/installation';
import { isPlainObject, isString } from '@videojs/utils/predicate';

/** The parts of a Shadcn registry item that the scaffolder copies into a project. */
export interface RegistryItem {
  name: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files?: { path: string; content: string; target: string }[];
  css?: CssTree;
  cssVars?: Record<string, Record<string, string>>;
}

export interface CssTree {
  [selector: string]: string | CssTree;
}

export interface ResolvedSkin {
  /** Project files keyed by path relative to the project root. */
  files: Map<string, string>;
  /** Npm dependencies keyed by name, with the version the registry pins or an empty range. */
  dependencies: Map<string, string>;
  /** Tailwind `@theme inline` variables from every item. */
  themeVars: Map<string, string>;
  /** Tailwind `@utility` and `@custom-variant` rules from every item. */
  css: CssTree;
}

/**
 * Map a Shadcn target to the project. The skin owns `src/`, so the `videojs` folder Shadcn nests it in is dropped:
 * `@components/videojs/video/skin.tsx` → `src/video/skin.tsx`, `@lib/resolve-class-name.ts` →
 * `src/lib/resolve-class-name.ts`.
 */
export function projectPath(target: string): string {
  const match = /^@(components|lib|hooks)\/(.+)$/.exec(target);
  if (!match) throw new Error(`Unsupported registry file target "${target}".`);

  const [, alias, path] = match;
  if (alias === 'components' && path!.startsWith('videojs/')) return `src/${path!.slice('videojs/'.length)}`;

  return `src/${alias}/${path}`;
}

/** Point absolute imports at the flattened layout `projectPath` writes. */
export function rewriteImports(content: string): string {
  return content.replaceAll("'@/components/videojs/", "'@/").replaceAll('"@/components/videojs/', '"@/');
}

/** Split `@videojs/react@10.1.0` into its name and version; `react` has no version. */
export function splitDependency(specifier: string): [name: string, version: string] {
  const at = specifier.indexOf('@', 1);

  return at === -1 ? [specifier, ''] : [specifier.slice(0, at), specifier.slice(at + 1)];
}

/** Long enough for a slow connection to send one registry item, short enough not to look stuck. */
const FETCH_TIMEOUT_MS = 30_000;

/**
 * Fetch one registry item. Node's `fetch` ignores `HTTPS_PROXY` unless `NODE_USE_ENV_PROXY=1` is set, so a failure
 * mentions that along with the local registry option.
 */
async function fetchItem(location: string): Promise<string> {
  let response: Response;

  try {
    response = await fetch(location, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch (error) {
    const reason = error instanceof Error && error.name === 'TimeoutError' ? 'timed out' : 'failed';

    throw new Error(
      `Fetching ${location} ${reason}. Behind a proxy, set HTTPS_PROXY and NODE_USE_ENV_PROXY=1 (recent Node versions), ` +
        'or pass --registry with a local registry build.',
      { cause: error }
    );
  }

  if (!response.ok) throw new Error(`Could not fetch ${location}: ${response.status} ${response.statusText}.`);

  return response.text();
}

async function readItem(registry: string, catalog: string, name: string): Promise<RegistryItem> {
  const isRemote = /^https?:\/\//.test(registry);
  const location = isRemote
    ? `${registry.replace(/\/$/, '')}/r/${catalog}/${name}.json`
    : resolve(registry, 'r', catalog, `${name}.json`);

  let source: string;

  if (isRemote) {
    source = await fetchItem(location);
  } else {
    source = await readFile(location, 'utf8').catch(() => {
      throw new Error(`Could not read ${location}. Build the registry with \`pnpm build:shadcn\` first.`);
    });
  }

  const item: unknown = JSON.parse(source);
  if (!isPlainObject(item) || !isString(item.name)) throw new Error(`${location} is not a registry item.`);

  // SAFETY: published registry items pass Shadcn schema validation in `@videojs/skins`; only the fields typed above
  // are read, and each is checked again where it is used.
  return item as unknown as RegistryItem;
}

function mergeCss(target: CssTree, source: CssTree): void {
  for (const [key, value] of Object.entries(source)) {
    const existing = target[key];

    if (isString(value) || !isPlainObject(existing)) target[key] = isString(value) ? value : structuredClone(value);
    else mergeCss(existing, value);
  }
}

/**
 * Resolve a skin item and every Video.js item it depends on into the files and package dependencies a project needs,
 * the same set `shadcn add` would install.
 */
export async function resolveRegistrySkin(options: {
  registry: string;
  framework: RegistryFramework;
  styling: RegistryStyling;
  theme: RegistryTheme;
  preset: RegistryPreset;
}): Promise<ResolvedSkin> {
  const catalog = registryCatalog(options.framework, options.styling, options.theme);
  const resolved: ResolvedSkin = { files: new Map(), dependencies: new Map(), themeVars: new Map(), css: {} };
  const visited = new Set<string>();
  const pending: string[] = [options.preset];

  while (pending.length > 0) {
    const name = pending.shift()!;
    if (visited.has(name)) continue;

    visited.add(name);

    const item = await readItem(options.registry, catalog, name);

    for (const file of item.files ?? []) resolved.files.set(projectPath(file.target), rewriteImports(file.content));

    for (const specifier of item.dependencies ?? []) {
      const [dependency, version] = splitDependency(specifier);

      if (!resolved.dependencies.get(dependency)) resolved.dependencies.set(dependency, version);
    }

    const { theme = {}, ...modes } = item.cssVars ?? {};

    // Light and dark variables need `:root` and `.dark` blocks; fail like an unknown dependency rather than drop them.
    if (Object.keys(modes).length > 0) {
      throw new Error(`Unsupported cssVars ${Object.keys(modes).join(', ')} in ${catalog}/${name}.`);
    }

    for (const [key, value] of Object.entries(theme)) resolved.themeVars.set(key, value);

    if (item.css) mergeCss(resolved.css, item.css);

    for (const dependency of item.registryDependencies ?? []) {
      if (dependency.startsWith(`${REGISTRY_NAMESPACE}/`))
        pending.push(dependency.slice(REGISTRY_NAMESPACE.length + 1));
      else throw new Error(`Unsupported registry dependency "${dependency}" in ${catalog}/${name}.`);
    }
  }

  return resolved;
}

/** The `@videojs/*` version a resolved skin pins, which the registry sets to the release it was built from. */
export function registryVersion(skin: ResolvedSkin): string | undefined {
  for (const [name, version] of skin.dependencies) {
    if (name.startsWith('@videojs/') && version) return version;
  }

  return undefined;
}
