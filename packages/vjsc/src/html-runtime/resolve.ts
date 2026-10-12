import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HTML_RUNTIME_SOURCE = 'vjsc/html-runtime';

/** The runtime module ids `resolveHtmlRuntime` serves, for resolver hook filters. */
export const HTML_RUNTIME_ID = /^vjsc\/html-runtime\/jsx-(?:dev-)?runtime$/;

/**
 * Resolve the HTML target's JSX runtime to its module file. From source that is this directory; from the built package
 * it is the public export.
 */
export function resolveHtmlRuntime(id: string): string | null {
  if (id !== `${HTML_RUNTIME_SOURCE}/jsx-runtime` && id !== `${HTML_RUNTIME_SOURCE}/jsx-dev-runtime`) return null;

  const here = fileURLToPath(import.meta.url);
  const entry = id.slice(HTML_RUNTIME_SOURCE.length + 1);

  return here.endsWith('.ts') ? resolve(dirname(here), `${entry}.ts`) : fileURLToPath(import.meta.resolve(id));
}
