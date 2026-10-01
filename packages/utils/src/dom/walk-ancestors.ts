import { isUndefined } from '../predicate';
import { isShadowRoot } from './predicates';

/** @internal */
export interface WalkAncestorsOptions {
  /** Whether to follow assigned slots and shadow hosts. */
  composed?: boolean;
}

/**
 * Walks an element and its ancestors until the callback returns a defined value.
 *
 * @internal
 */
export function walkAncestors<Value>(
  start: Element | null,
  callback: (node: Element) => Value | undefined,
  options: WalkAncestorsOptions = {}
): Value | undefined {
  if (!start || typeof document === 'undefined') {
    return undefined;
  }

  let node: Element | null = start;

  while (node) {
    const value = callback(node);
    if (!isUndefined(value)) return value;

    node = options.composed ? getComposedParent(node) : node.parentElement;
  }

  return undefined;
}

function getComposedParent(element: Element): Element | null {
  if (element.assignedSlot) return element.assignedSlot;

  if (element.parentElement) return element.parentElement;

  const root = element.getRootNode();

  return isShadowRoot(root) ? root.host : null;
}
