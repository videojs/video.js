/** @internal */
export type ElementPredicate = (element: Element, index: number) => boolean;
/** @internal */
export type ElementTypePredicate<T extends Element> = (element: Element, index: number) => element is T;

/**
 * Return direct element children accepted by the predicate.
 *
 * @internal
 */
export function getElementChildren<T extends Element>(parent: Element, predicate: ElementTypePredicate<T>): T[];
/** @internal */
export function getElementChildren(parent: Element, predicate: ElementPredicate): Element[];
/** @internal */
export function getElementChildren(parent: Element, predicate: ElementPredicate): Element[] {
  const children: Element[] = [];

  for (let index = 0; index < parent.children.length; index++) {
    const child = parent.children.item(index);

    if (child && predicate(child, index)) children.push(child);
  }

  return children;
}

/**
 * Find the first direct element child accepted by the predicate.
 *
 * @internal
 */
export function findElementChild<T extends Element>(parent: Element, predicate: ElementTypePredicate<T>): T | null;
/** @internal */
export function findElementChild(parent: Element, predicate: ElementPredicate): Element | null;
/** @internal */
export function findElementChild(parent: Element, predicate: ElementPredicate): Element | null {
  for (let index = 0; index < parent.children.length; index++) {
    const child = parent.children.item(index);
    if (child && predicate(child, index)) return child;
  }

  return null;
}

/**
 * Return what an element composes: the elements assigned to a slot, or otherwise its own children.
 *
 * A slot with nothing assigned yields its fallback content, so the result always describes what renders.
 *
 * @internal
 */
export function getComposedChildren(parent: Element): Element[] {
  if (parent instanceof HTMLSlotElement) {
    const assigned = parent.assignedElements();
    if (assigned.length > 0) return assigned;
  }

  return [...parent.children];
}

/**
 * Find the first descendant accepted by the predicate, following slots to what they compose.
 *
 * Depth-first from the root's composed children, so an element slotted in from outside is found even through a
 * forwarding slot or a wrapper such as `<picture>`. The root itself is never returned.
 *
 * @internal
 */
export function findComposedElement<T extends Element>(root: Element, predicate: ElementTypePredicate<T>): T | null;
/** @internal */
export function findComposedElement(root: Element, predicate: ElementPredicate): Element | null;
/** @internal */
export function findComposedElement(root: Element, predicate: ElementPredicate): Element | null {
  const children = getComposedChildren(root);

  for (const [index, child] of children.entries()) {
    if (predicate(child, index)) return child;

    const nested = findComposedElement(child, predicate);
    if (nested) return nested;
  }

  return null;
}

/**
 * Follow a single-child relationship from the root until it ends or cycles.
 *
 * @internal
 */
export function followElementPath<T extends Element>(root: T, getNext: (element: T) => T | null): T[] {
  const path: T[] = [];
  const visited = new Set<T>();
  let current: T | null = root;

  while (current && !visited.has(current)) {
    path.push(current);
    visited.add(current);
    current = getNext(current);
  }

  return path;
}
