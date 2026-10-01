import { escapeHtml } from '../string/escape-html';

/** @internal */
export interface AttributeSnapshotEntry {
  name: string;
  value: string | null;
}

/** @internal */
export type AttributeSnapshot = readonly AttributeSnapshotEntry[];

/**
 * Capture authored values for the selected attributes.
 *
 * @internal
 */
export function snapshotAttributes(element: Element, names: Iterable<string>): AttributeSnapshot {
  return [...names].map((name) => ({ name, value: element.getAttribute(name) }));
}

/**
 * Restore a snapshot created by `snapshotAttributes`.
 *
 * @internal
 */
export function restoreAttributes(element: Element, snapshot: AttributeSnapshot): void {
  for (const { name, value } of snapshot) {
    if (value === null) {
      element.removeAttribute(name);
    } else {
      element.setAttribute(name, value);
    }
  }
}

/**
 * Convert a NamedNodeMap to a plain object.
 *
 * @internal
 */
export function namedNodeMapToObject(namedNodeMap: NamedNodeMap) {
  const obj: Record<string, string> = {};

  for (const attr of namedNodeMap) {
    obj[attr.name] = attr.value;
  }

  return obj;
}

/**
 * Helper function to serialize attributes into a string.
 *
 * @internal
 */
export function serializeAttributes(attrs: Record<string, string>) {
  let html = '';

  for (const key in attrs) {
    const value = attrs[key]!;

    if (value === '') html += ` ${key}`;
    else html += ` ${key}="${escapeHtml(value)}"`;
  }

  return html;
}
