import { walkAncestors } from './walk-ancestors';

const TABBABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'audio[controls]',
  'video[controls]',
  'iframe',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** @internal */
export function getDeepActiveElement(root: Document | ShadowRoot = document): Element | null {
  let active = root.activeElement;

  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement;
  }

  return active;
}

/**
 * Returns the elements in a composed subtree that participate in sequential keyboard navigation.
 *
 * @internal
 */
export function getTabbableElements(root: ParentNode): HTMLElement[] {
  const tabbable: HTMLElement[] = [];
  const visited = new Set<Element>();

  visitChildren(root);
  return tabbable;

  function visitChildren(parent: ParentNode): void {
    for (const child of parent.children) visitElement(child);
  }

  function visitElement(element: Element): void {
    if (visited.has(element)) return;

    visited.add(element);

    if (element instanceof HTMLElement && isTabbableElement(element)) {
      tabbable.push(element);
    }

    if (element instanceof HTMLSlotElement) {
      const assigned = element.assignedElements({ flatten: true });

      if (assigned.length > 0) {
        for (const child of assigned) visitElement(child);
      } else {
        visitChildren(element);
      }

      return;
    }

    if (element.shadowRoot) {
      visitChildren(element.shadowRoot);
    } else {
      visitChildren(element);
    }
  }
}

function isTabbableElement(element: HTMLElement): boolean {
  if (!element.matches(TABBABLE_SELECTOR) || element.tabIndex < 0 || element.matches(':disabled')) return false;

  return !walkAncestors(
    element,
    (ancestor) => {
      if (
        ancestor instanceof HTMLElement &&
        (ancestor.hidden || ancestor.hasAttribute('inert') || ancestor.getAttribute('aria-hidden') === 'true')
      ) {
        return true;
      }

      return undefined;
    },
    { composed: true }
  );
}
