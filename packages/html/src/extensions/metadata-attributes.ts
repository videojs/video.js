export const METADATA_ATTRIBUTE_PREFIX = 'metadata-' as const;

/** Maps a `metadata-*` attribute name to a snake_case metadata key, or `null` when the name is not prefixed. */
export function metadataKeyFromAttribute(attributeName: string): string | null {
  if (!attributeName.startsWith(METADATA_ATTRIBUTE_PREFIX)) return null;

  return attributeName.slice(METADATA_ATTRIBUTE_PREFIX.length).replaceAll('-', '_');
}

/** Collects string values from every `metadata-*` attribute on `element`. */
export function readMetadataAttributes(element: Element): Record<string, string> {
  const metadata: Record<string, string> = {};

  for (const { name, value } of element.attributes) {
    const key = metadataKeyFromAttribute(name);

    if (key) metadata[key] = value;
  }

  return metadata;
}

/** Merges attribute and property metadata. Property values override attributes with the same key. */
export function mergeExtensionMetadata(
  fromAttributes: Record<string, string>,
  fromProperty: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  const hasAttributes = Object.keys(fromAttributes).length > 0;
  if (!hasAttributes && !fromProperty) return undefined;

  if (!hasAttributes) return fromProperty;

  if (!fromProperty) return { ...fromAttributes };

  return { ...fromAttributes, ...fromProperty };
}

/** Whether two metadata records carry the same keys and values (reference-equal values only). */
export function extensionMetadataEqual(
  a: Record<string, unknown> | undefined,
  b: Record<string, unknown> | undefined
): boolean {
  if (a === b) return true;

  if (!a || !b) return false;

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every((key) => a[key] === b[key]);
}
