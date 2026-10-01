/**
 * Loads overlay layers for each resolved locale key, least-specific first, then merges most-specific-last (same
 * semantics as the core i18n registry).
 *
 * @internal
 */
export async function mergeLocaleOverlays<Overlay extends object>(
  locale: string,
  load: (tag: string) => Promise<Partial<Overlay> | undefined>,
  findKeys: (locale: string) => string[]
): Promise<{ merged: Partial<Overlay>; loadedTags: string[] }> {
  const chain = findKeys(locale);
  const layers = await Promise.all(chain.map((tag) => load(tag)));

  const loadedTags: string[] = [];
  const merged: Partial<Overlay> = {};

  for (let i = 0; i < chain.length; i++) {
    const layer = layers[i];

    if (layer && Object.keys(layer).length > 0) {
      loadedTags.push(chain[i]!);
    }
  }

  for (let i = chain.length - 1; i >= 0; i--) {
    const layer = layers[i];

    if (layer) {
      Object.assign(merged, layer);
    }
  }

  return { merged, loadedTags };
}
