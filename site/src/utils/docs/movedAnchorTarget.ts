// Kept apart from `movedAnchors.ts`, which reads the sidebar, so the browser script bundles nothing else.

/**
 * The URL a reader arriving on `hash` should land on instead, or `null` to stay. A heading still on the page always
 * wins, so an entry left behind after its section returns does nothing.
 */
export function findMovedAnchorTarget(
  resolved: Record<string, string>,
  hash: string,
  hasElement: (id: string) => boolean
): string | null {
  if (!hash || hash === '#') return null;

  let id: string;

  try {
    id = decodeURIComponent(hash.slice(1));
  } catch {
    return null;
  }

  if (hasElement(id)) return null;

  return resolved[id] ?? null;
}
