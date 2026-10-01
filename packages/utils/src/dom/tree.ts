import { isShadowRoot } from './predicates';

export function containsComposed(root: Element, element: Element): boolean {
  let current: Element | null = element;

  while (current) {
    if (current === root || root.contains(current)) return true;

    const nodeRoot = current.getRootNode();

    current = current.assignedSlot ?? current.parentElement ?? (isShadowRoot(nodeRoot) ? nodeRoot.host : null);
  }

  return false;
}
