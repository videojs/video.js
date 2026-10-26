/** @internal */
export type PositionSide = 'top' | 'bottom' | 'left' | 'right';

/** @internal */
export interface PositionSideOptions {
  side: PositionSide;
}

/** @internal */
export interface PositionSideOffsets {
  sideOffset: number;
  boundaryOffset?: number;
}

const ZERO_OFFSETS: PositionSideOffsets = { sideOffset: 0, boundaryOffset: 0 };

const OPPOSITE_SIDE: Record<PositionSide, PositionSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

function getSideAvailable(
  triggerRect: DOMRect,
  boundaryRect: DOMRect,
  side: PositionSide,
  offsets: PositionSideOffsets
): number {
  const boundaryOffset = offsets.boundaryOffset ?? 0;

  switch (side) {
    case 'top':
      return triggerRect.top - boundaryRect.top - boundaryOffset - offsets.sideOffset;
    case 'bottom':
      return boundaryRect.bottom - triggerRect.bottom - boundaryOffset - offsets.sideOffset;
    case 'left':
      return triggerRect.left - boundaryRect.left - boundaryOffset - offsets.sideOffset;
    case 'right':
      return boundaryRect.right - triggerRect.right - boundaryOffset - offsets.sideOffset;
  }
}

/**
 * Resolve the preferred side against a positioning boundary.
 *
 * @internal
 */
export function getPositionedSide(
  triggerRect: DOMRect,
  positionedRect: DOMRect,
  boundaryRect: DOMRect,
  opts: PositionSideOptions,
  offsets: PositionSideOffsets = ZERO_OFFSETS
): PositionSide {
  const preferred = opts.side;
  const opposite = OPPOSITE_SIDE[preferred];
  const size = preferred === 'top' || preferred === 'bottom' ? positionedRect.height : positionedRect.width;
  const preferredSpace = getSideAvailable(triggerRect, boundaryRect, preferred, offsets);
  if (preferredSpace >= size) return preferred;

  const oppositeSpace = getSideAvailable(triggerRect, boundaryRect, opposite, offsets);

  return oppositeSpace > preferredSpace ? opposite : preferred;
}

/** @internal */
export function tryShowPopover(el: HTMLElement | null): void {
  try {
    el?.showPopover?.();
  } catch {
    // Element may not support popover API or may already be shown
  }
}

/** @internal */
export function tryHidePopover(el: HTMLElement | null): void {
  try {
    el?.hidePopover?.();
  } catch {
    // Element may not support popover API or may already be hidden
  }
}

/**
 * Hides every open popover inside `root`, including those in its own and nested shadow roots.
 *
 * @internal
 */
export function hideOpenPopovers(root: Element | ShadowRoot): void {
  if (root instanceof Element && root.shadowRoot) hideOpenPopovers(root.shadowRoot);

  for (const el of root.querySelectorAll<HTMLElement>('*')) {
    if (isOpenPopover(el)) tryHidePopover(el);

    if (el.shadowRoot) hideOpenPopovers(el.shadowRoot);
  }
}

function isOpenPopover(el: Element): boolean {
  try {
    return el.matches(':popover-open');
  } catch {
    // `:popover-open` is unsupported, so no popover can be open
    return false;
  }
}
