import { containsComposed, getDeepActiveElement, isDocument } from '@videojs/utils/dom';

/** @internal */
export function isSliderFocused(root: Document | Element = document): boolean {
  const doc = isDocument(root) ? root : root.ownerDocument;
  const active = getDeepActiveElement(doc);
  if (active?.getAttribute('role') !== 'slider') return false;

  return isDocument(root) || containsComposed(root, active);
}
