import { isString } from '@videojs/utils/predicate';

/** @internal */
export function forceLayout(element: HTMLElement | null): void {
  element?.getBoundingClientRect();
}

export type PositioningBoundary = 'viewport' | 'container' | (string & {}) | Element | null | undefined;

/** @internal */
export interface ResolvePositioningBoundaryOptions {
  container?: Element | null;
  root?: Document | ShadowRoot | Element | null;
}

/** @internal */
export function createDOMRect(left: number, top: number, width: number, height: number): DOMRect {
  const right = left + width;
  const bottom = top + height;

  return {
    x: left,
    y: top,
    width,
    height,
    top,
    right,
    bottom,
    left,
    toJSON() {
      return { x: left, y: top, width, height, top, right, bottom, left };
    },
  } as DOMRect;
}

/** @internal */
export function intersectDOMRects(firstRect: DOMRect, secondRect: DOMRect): DOMRect {
  const left = Math.max(firstRect.left, secondRect.left);
  const top = Math.max(firstRect.top, secondRect.top);
  const right = Math.min(firstRect.right, secondRect.right);
  const bottom = Math.min(firstRect.bottom, secondRect.bottom);

  return createDOMRect(left, top, Math.max(0, right - left), Math.max(0, bottom - top));
}

/** @internal */
export function getPositioningBoundaryRect(boundaryElement?: Element | null): DOMRect {
  const viewportRect = document.documentElement.getBoundingClientRect();

  return boundaryElement ? intersectDOMRects(viewportRect, boundaryElement.getBoundingClientRect()) : viewportRect;
}

/** @internal */
export function resolvePositioningBoundary(
  boundary: PositioningBoundary,
  options: ResolvePositioningBoundaryOptions = {}
): Element | null {
  if (!boundary) return null;

  if (!isString(boundary)) return boundary;

  if (boundary === 'viewport') return null;

  if (boundary === 'container') return options.container ?? null;

  try {
    return (options.root ?? document).querySelector(boundary);
  } catch {
    return null;
  }
}
