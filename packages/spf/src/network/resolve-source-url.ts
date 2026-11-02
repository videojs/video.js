/**
 * The base URL the runtime would resolve a relative request against, if it has one: the document's base URL in a window
 * (honoring `<base href>`), the script's location in a worker, and nothing in Node or a bare JS engine.
 *
 * Read off `globalThis` through a local structural type rather than `lib.dom`'s globals, so this module neither types
 * nor runs against a browser-only global.
 */
export function getRuntimeBaseUrl(): string | undefined {
  // SAFETY: a structural view of two globals that may or may not exist in this runtime; every field is optional and
  // read only through `?.`, so a runtime without them yields `undefined` rather than throwing.
  const { document, location } = globalThis as { document?: { baseURI?: string }; location?: { href?: string } };

  return document?.baseURI ?? location?.href ?? undefined;
}

/**
 * Resolve a source URL the way the runtime's own `fetch` would: a relative URL becomes absolute against
 * {@link getRuntimeBaseUrl}, an absolute URL is normalized, and anything that cannot be resolved (no base in this
 * runtime, or a value `new URL()` rejects) is returned unchanged for the fetch to report.
 */
export function resolveSourceUrl(url: string): string {
  if (!url) return url;

  const base = getRuntimeBaseUrl();
  if (!base) return url;

  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
}
