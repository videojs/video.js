import browserslist from 'browserslist';
import { browserslistToTargets, Features } from 'lightningcss';

const browsers = browserslist(undefined, { path: import.meta.dirname });

/**
 * The oldest browsers the Compat and Scaffold skin stylesheets render in. The packages still lower CSS for the root
 * `browserslist`, so these skins reach older engines through fallbacks in their source, which the skins package's
 * browser support test audits against this query.
 */
export const compatSkinBrowserslist = [
  'chrome >= 99',
  'edge >= 99',
  'firefox >= 97',
  'safari >= 15.4',
  'ios_saf >= 15.4',
  'and_chr >= 99',
  'and_ff >= 97',
  'samsung >= 18',
  'opera >= 86',
] as const;

/** The root `browserslist`, as Lightning CSS targets. */
export const cssTargets = browserslistToTargets(browsers);

/** Engine names Vite's `build.cssTarget` accepts, keyed by browserslist name. */
const VITE_CSS_TARGETS: Readonly<Record<string, string>> = {
  chrome: 'chrome',
  edge: 'edge',
  firefox: 'firefox',
  safari: 'safari',
  ios_saf: 'ios',
  opera: 'opera',
};

/**
 * The root `browserslist` in Vite's `build.cssTarget` form, which Vite converts back for its Lightning CSS minifier.
 * Vite rejects mobile-only names such as `and_chr`, whose versions track the desktop engines listed here.
 */
export const viteCssTarget = browsers.flatMap((browser) => {
  const [name, version] = browser.split(' ');
  const target = VITE_CSS_TARGETS[name!];

  return target ? [`${target}${version!.split('-')[0]}`] : [];
});

/**
 * Features Lightning CSS would rewrite for every browser instead of only old ones. Skin stylesheets keep `:dir()`
 * inside forgiving `:where()` lists and ship their own `light-dark()` fallbacks inside `@supports`.
 */
export const cssExclude = Features.DirSelector | Features.LightDark;
