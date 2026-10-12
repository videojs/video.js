import type { Plugin } from 'rolldown';

import { HTML_RUNTIME_ID, resolveHtmlRuntime } from '../html-runtime/resolve';

/** Serve `vjsc/html-runtime/*` from the runtime module while HTML target modules compile. */
export function htmlRuntimePlugin(): Plugin {
  return {
    name: 'vjsc:html-runtime',
    enforce: 'pre',
    resolveId: {
      order: 'pre',
      filter: { id: HTML_RUNTIME_ID },
      handler(id) {
        return resolveHtmlRuntime(id);
      },
    },
  } as Plugin;
}
