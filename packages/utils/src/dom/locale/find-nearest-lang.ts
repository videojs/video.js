import { walkAncestors } from '../walk-ancestors';

function getElementLang(node: Element): string | undefined {
  const fromAttribute = node.getAttribute('lang')?.trim();
  if (fromAttribute) return fromAttribute;

  if ('lang' in node && typeof node.lang === 'string') {
    const fromProperty = node.lang.trim();
    if (fromProperty) return fromProperty;
  }

  return undefined;
}

/**
 * First non-empty `lang` on `start` or an ancestor (HTML language inheritance).
 *
 * @internal
 */
export function findNearestLang(start: Element | null): string | undefined {
  return walkAncestors(start, getElementLang);
}
