import { walkAncestors } from './walk-ancestors';

/**
 * Whether `keep-alive` on the element or any composed ancestor, including shadow hosts, exempts it from automatic
 * teardown when it leaves the DOM.
 *
 * An element removed on its own from a kept-alive tree has lost those ancestors, so it is not kept alive.
 *
 * @internal
 */
export function isKeptAlive(element: Element): boolean {
  return (
    walkAncestors(element, (node) => (node.hasAttribute('keep-alive') ? true : undefined), { composed: true }) ?? false
  );
}
