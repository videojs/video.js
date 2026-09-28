import browserslist from 'browserslist';
import * as caniuse from 'caniuse-lite';
import caniusePackage from 'caniuse-lite/package.json' with { type: 'json' };

import rootPackage from '../../../package.json' with { type: 'json' };

/** The browsers the support policy names, in the order the docs list them. */
export const SUPPORT_BROWSERS = [
  { id: 'chrome', name: 'Chrome' },
  { id: 'edge', name: 'Edge' },
  { id: 'firefox', name: 'Firefox' },
  { id: 'safari', name: 'Safari' },
  { id: 'ios_saf', name: 'Safari on iOS' },
] as const;

export type SupportBrowserId = (typeof SUPPORT_BROWSERS)[number]['id'];

export type CssRequirementKind = 'required' | 'degrades' | 'guarded';

/**
 * A CSS feature the packaged skins use, keyed by its caniuse feature id so the docs read support data from
 * `caniuse-lite` at build time instead of a hand-maintained table.
 */
export interface CssRequirement {
  id: string;
  label: string;
  kind: CssRequirementKind;
  /** What a reader sees in a browser without the feature. */
  effect: string;
}

/**
 * Features found in the generated skin stylesheets after the build lowers them, which removes nesting and `@scope`.
 * `required` features have no fallback and the skin does not render without them; `degrades` features lose one visual
 * detail; `guarded` features fall back through `@supports` or a second selector.
 *
 * Only features caniuse tracks belong here. `oklch()`, `color-mix()`, `light-dark()`, `@property`, and
 * `contrast-color()` have no caniuse entry (`css-lch-lab` covers `lab()` and `lch()` only), so the guide describes them
 * in prose with MDN data instead.
 */
export const CSS_REQUIREMENTS: readonly CssRequirement[] = [
  {
    id: 'css-cascade-scope',
    label: '@scope',
    kind: 'guarded',
    effect: 'Packaged skins use :where() selectors instead; registry CSS skins need it',
  },
  { id: 'css-cascade-layers', label: '@layer', kind: 'required', effect: 'No component styling' },
  { id: 'css-has', label: ':has()', kind: 'required', effect: 'Menu and slider focus states are lost' },
  {
    id: 'css-container-queries',
    label: '@container',
    kind: 'required',
    effect: 'Controls do not adapt to player width',
  },
  {
    id: 'css-media-range-syntax',
    label: 'Media query range syntax',
    kind: 'required',
    effect: 'Large-screen sizing is lost',
  },
  {
    id: 'css-dir-pseudo',
    label: ':dir()',
    kind: 'guarded',
    effect: 'Right-to-left layout follows the dir attribute instead',
  },
  {
    id: 'css-relative-colors',
    label: 'Relative color syntax',
    kind: 'degrades',
    effect: 'Control scrims fall back to color-mix(), and subtle shadows are lost',
  },
  {
    id: 'css-scrollbar',
    label: 'scrollbar-color and scrollbar-width',
    kind: 'degrades',
    effect: 'Menus show default scrollbars',
  },
  { id: 'css-backdrop-filter', label: 'backdrop-filter', kind: 'degrades', effect: 'Surfaces lose their blur' },
  {
    id: 'css-anchor-positioning',
    label: 'Anchor positioning',
    kind: 'guarded',
    effect: 'Popups are positioned by JavaScript',
  },
];

export interface ResolvedBrowser {
  id: SupportBrowserId;
  name: string;
  /** Resolved versions, oldest first. */
  versions: string[];
  /** Human range such as `150–151` or a single version. */
  range: string;
  /** The oldest resolved version for display, such as `16.4`, or `null` when the query names none. */
  minimum: string | null;
}

/** The browserslist query the repository builds against, from the root `package.json`. */
export const BROWSERSLIST_QUERY: readonly string[] = rootPackage.browserslist;

/** Numeric sort key for caniuse version strings such as `17.4`, `150`, or `15.0-15.1`. */
export function versionNumber(version: string): number {
  return Number.parseFloat(version.split('-')[0] ?? version);
}

/** Show the first version of a caniuse range without a trailing `.0`, so Safari 16.0 and iOS 16.0 both read "16". */
function displayVersion(version: string): string {
  return (version.split('-')[0] ?? version).replace(/\.0$/, '');
}

/** Resolve the browserslist query into one row per policy browser. */
export function resolveSupportedBrowsers(query: readonly string[] = BROWSERSLIST_QUERY): ResolvedBrowser[] {
  const resolved = browserslist([...query]);

  return SUPPORT_BROWSERS.map(({ id, name }) => {
    const versions = resolved
      .filter((entry) => entry.startsWith(`${id} `))
      .map((entry) => entry.slice(id.length + 1))
      .sort((a, b) => versionNumber(a) - versionNumber(b));
    const first = versions[0];
    const last = versions[versions.length - 1];
    const range = !first
      ? '—'
      : first === last
        ? displayVersion(first)
        : `${displayVersion(first)}–${displayVersion(last)}`;

    return { id, name, versions, range, minimum: first ? displayVersion(first) : null };
  });
}

/** Share of global web usage on the browsers the query resolves to, as a percentage. */
export function supportedCoverage(query: readonly string[] = BROWSERSLIST_QUERY): number {
  return browserslist.coverage(browserslist([...query]));
}

export interface FeatureSupport {
  requirement: CssRequirement;
  /** First fully supporting version per policy browser, or `null` when the browser has no full support. */
  firstVersion: Record<SupportBrowserId, string | null>;
  /** Share of global web usage on browsers with full support, as a percentage. */
  globalSupport: number;
  caniuseUrl: string;
}

function isFullSupport(stat: string | undefined): boolean {
  return stat !== undefined && /^y/.test(stat);
}

function featureData(id: string) {
  const packed = caniuse.features[id];
  if (!packed) throw new Error(`Unknown caniuse feature: ${id}`);

  return caniuse.feature(packed);
}

/** Read first-supporting versions and global usage for one requirement from caniuse-lite. */
export function featureSupport(requirement: CssRequirement): FeatureSupport {
  const data = featureData(requirement.id);
  // SAFETY: the entries are built from SUPPORT_BROWSERS, so every SupportBrowserId key is present exactly once.
  const firstVersion = Object.fromEntries(
    SUPPORT_BROWSERS.map(({ id }) => {
      const stats = data.stats[id] ?? {};
      const versions = caniuse.agents[id]?.versions.filter((version): version is string => version !== null) ?? [];
      const first = versions.find((version) => isFullSupport(stats[version]));

      return [id, first ? displayVersion(first) : null];
    })
  ) as Record<SupportBrowserId, string | null>;

  let globalSupport = 0;

  for (const [agentId, agent] of Object.entries(caniuse.agents)) {
    if (!agent) continue;

    const stats = data.stats[agentId] ?? {};

    for (const [version, usage] of Object.entries(agent.usage_global)) {
      if (isFullSupport(stats[version])) globalSupport += usage ?? 0;
    }
  }

  return { requirement, firstVersion, globalSupport, caniuseUrl: `https://caniuse.com/${requirement.id}` };
}

/** Support data for every requirement, in table order. */
export function cssRequirementSupport(requirements: readonly CssRequirement[] = CSS_REQUIREMENTS): FeatureSupport[] {
  return requirements.map(featureSupport);
}

/** The `caniuse-lite` data version the numbers come from. */
export function caniuseVersion(): string {
  return caniusePackage.version;
}
