/**
 * The oldest browsers the Compat and Scaffold skin stylesheets render in. The packages still lower CSS for the root
 * `browserslist`, so these skins reach older engines through fallbacks in their source, which
 * `tests/browser-support.test.ts` audits against this query.
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
