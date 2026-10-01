import { getElementSize, resolveCSSLength, supportsAnchorPositioning, supportsPopoverAPI } from '@videojs/utils/dom';
import type { TextDirection } from '@videojs/utils/i18n';
import { clamp } from '@videojs/utils/number';

import type { PopoverAlign, PopoverSide } from '../../../core/ui/popover/core';
import { PopoverCSSVars } from '../../../core/ui/popover/vars';
import { createDOMRect } from '../../utils/layout';

/** @internal */
export interface PositioningOptions {
  side: PopoverSide;
  align: PopoverAlign;
  direction?: TextDirection;
}

export interface PositioningOffsets {
  sideOffset: number;
  alignOffset: number;
  boundaryOffset?: number;
}

/**
 * CSS custom property names for anchor-based positioning.
 *
 * @internal
 */
export interface PositioningCSSVars {
  sideOffset: string;
  alignOffset: string;
  boundaryOffset: string;
  anchorWidth: string;
  anchorHeight: string;
  availableWidth: string;
  availableHeight: string;
}

export interface PopoverPositionStyle {
  [key: string]: string | undefined;
  positionAnchor?: string;
  position?: string;
  inset?: string;
  margin?: string;
  justifySelf?: string;
  alignSelf?: string;
  marginInlineStart?: string;
  marginBlockStart?: string;
  translate?: string;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}

const ZERO_OFFSETS: PositioningOffsets = { sideOffset: 0, alignOffset: 0, boundaryOffset: 0 };

const OPPOSITE_SIDE: Record<PopoverSide, PopoverSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

function formatPixels(value: number): string {
  return `${clamp(value, 0, Infinity)}px`;
}

function shiftCrossAxis(value: number, boundaryStart: number, boundaryEnd: number, size: number): number {
  const max = boundaryEnd - size;

  return max < boundaryStart ? boundaryStart : clamp(value, boundaryStart, max);
}

function getHorizontalAlign({ align, direction = 'ltr' }: PositioningOptions): PopoverAlign {
  if (direction !== 'rtl') return align;

  return align === 'start' ? 'end' : align === 'end' ? 'start' : align;
}

function getAnchorCrossAxisShift(
  start: number,
  end: number,
  size: number,
  boundaryStart: number,
  boundaryEnd: number,
  align: PopoverAlign,
  alignOffset: number,
  boundaryOffset: number,
  axis: 'horizontal' | 'vertical',
  alignOffsetVar: string
): { base: string; translate: string } {
  const base =
    align === 'start' ? start + alignOffset : align === 'end' ? end + alignOffset : start + size / 2 + alignOffset;
  const startAnchor = axis === 'horizontal' ? 'left' : 'top';
  const endAnchor = OPPOSITE_SIDE[startAnchor];
  const anchor = align === 'start' ? startAnchor : align === 'end' ? endAnchor : 'center';
  const desiredTranslate = align === 'start' ? '0px' : align === 'end' ? '-100%' : '-50%';

  return {
    base: `calc(anchor(${anchor}) + ${alignOffsetVar})`,
    translate: `clamp(${boundaryStart + boundaryOffset - base}px, ${desiredTranslate}, calc(${
      boundaryEnd - boundaryOffset - base
    }px - 100%))`,
  };
}

/**
 * Get positioning styles for the popup element.
 *
 * When the browser supports CSS Anchor Positioning, returns native CSS properties that reference the provided CSS var
 * names for side/align offsets — no JS offset values needed.
 *
 * When rects are provided and anchor positioning is unsupported, falls back to manual JS-computed positioning. The
 * caller must resolve offset CSS vars via `getComputedStyle` and pass them as `offsets`.
 *
 * Returns camelCase keys for standard CSS properties and `--*` keys for custom properties — compatible with both
 * React's `style` prop and `applyStyles()` from `@videojs/utils/dom`.
 */
export function getAnchorPositionStyle(
  anchorName: string,
  opts: PositioningOptions,
  triggerRect?: DOMRect,
  popupRect?: DOMRect,
  boundaryRect?: DOMRect,
  offsets?: PositioningOffsets,
  cssVars: PositioningCSSVars = PopoverCSSVars
): PopoverPositionStyle & Record<string, string | undefined> {
  if (supportsAnchorPositioning()) {
    return {
      ...getAnchorPositionCSS(anchorName, opts, cssVars, triggerRect, boundaryRect, offsets),
      ...(triggerRect && boundaryRect ? getPositioningCSSVars(triggerRect, boundaryRect, opts, offsets, cssVars) : {}),
    };
  }

  // JS fallback when CSS Anchor Positioning is not supported.
  if (triggerRect && popupRect) {
    const resolved: PositioningOffsets = offsets ?? ZERO_OFFSETS;

    return {
      position: 'fixed',
      margin: '0',
      ...getManualPositionStyle(triggerRect, popupRect, opts, resolved, boundaryRect),
      ...(boundaryRect ? getPositioningCSSVars(triggerRect, boundaryRect, opts, resolved, cssVars) : {}),
    };
  }

  return {};
}

function getAnchorPositionCSS(
  anchorName: string,
  opts: PositioningOptions,
  cssVars: PositioningCSSVars = PopoverCSSVars,
  triggerRect?: DOMRect,
  boundaryRect?: DOMRect,
  offsets: PositioningOffsets = ZERO_OFFSETS
): PopoverPositionStyle {
  const SIDE_OFFSET_VAR = `var(${cssVars.sideOffset}, 0px)`;
  const ALIGN_OFFSET_VAR = `var(${cssVars.alignOffset}, 0px)`;

  const { side, align } = opts;
  const boundaryOffset = offsets.boundaryOffset ?? 0;
  const style: PopoverPositionStyle = {
    positionAnchor: `--${anchorName}`,
    position: 'fixed',
    // Reset UA [popover] defaults (inset: 0; margin: auto) and any
    // stale properties from a previous side/align configuration.
    // applyStyles() only sets properties — it never removes old ones —
    // so we emit a complete set of resets every time.
    inset: 'auto',
    margin: '0',
    justifySelf: 'normal',
    alignSelf: 'normal',
    marginInlineStart: '0',
    marginBlockStart: '0',
    translate: 'none',
  };

  // The CSS inset property is the OPPOSITE of the desired side.
  // e.g. side='top' → set `bottom: anchor(top)` so the popover's
  // bottom edge aligns with the anchor's top edge (placing it above).
  const insetProp = OPPOSITE_SIDE[side];

  // Side positioning — always use calc() with the CSS var so the offset
  // is resolved at paint time without any JS round-trip.
  if (side === 'top' || side === 'bottom') {
    const horizontalAlign = getHorizontalAlign(opts);

    style[insetProp] = `calc(anchor(${side}) + ${SIDE_OFFSET_VAR})`;

    if (triggerRect && boundaryRect) {
      const { base, translate } = getAnchorCrossAxisShift(
        triggerRect.left,
        triggerRect.right,
        triggerRect.width,
        boundaryRect.left,
        boundaryRect.right,
        horizontalAlign,
        offsets.alignOffset,
        boundaryOffset,
        'horizontal',
        ALIGN_OFFSET_VAR
      );

      style.left = base;
      style.translate = `${translate} 0`;

      return style;
    }

    // Alignment along the cross axis
    if (horizontalAlign === 'start') {
      style.left = `calc(anchor(left) + ${ALIGN_OFFSET_VAR})`;
    } else if (horizontalAlign === 'end') {
      style.right = `calc(anchor(right) + ${ALIGN_OFFSET_VAR})`;
    } else {
      style.justifySelf = 'anchor-center';
      style.marginInlineStart = ALIGN_OFFSET_VAR;
    }
  } else {
    style[insetProp] = `calc(anchor(${side}) + ${SIDE_OFFSET_VAR})`;

    if (triggerRect && boundaryRect) {
      const { base, translate } = getAnchorCrossAxisShift(
        triggerRect.top,
        triggerRect.bottom,
        triggerRect.height,
        boundaryRect.top,
        boundaryRect.bottom,
        align,
        offsets.alignOffset,
        boundaryOffset,
        'vertical',
        ALIGN_OFFSET_VAR
      );

      style.top = base;
      style.translate = `0 ${translate}`;

      return style;
    }

    if (align === 'start') {
      style.top = `calc(anchor(top) + ${ALIGN_OFFSET_VAR})`;
    } else if (align === 'end') {
      style.bottom = `calc(anchor(bottom) + ${ALIGN_OFFSET_VAR})`;
    } else {
      style.alignSelf = 'anchor-center';
      style.marginBlockStart = ALIGN_OFFSET_VAR;
    }
  }

  return style;
}

/**
 * Compute CSS variables for sizing constraints relative to the anchor/boundary.
 *
 * Accepts a `cssVars` map so the same logic works for both popover (`--media-popover-*`) and tooltip
 * (`--media-tooltip-*`) namespaces.
 */
function getPositioningCSSVars(
  triggerRect: DOMRect,
  boundaryRect: DOMRect,
  opts: PositioningOptions,
  offsets: PositioningOffsets = ZERO_OFFSETS,
  cssVars: PositioningCSSVars = PopoverCSSVars
): Record<string, string> {
  const vars: Record<string, string> = {};
  const { side } = opts;

  const boundaryOffset = offsets.boundaryOffset ?? 0;
  const boundaryStartX = boundaryRect.left + boundaryOffset;
  const boundaryEndX = boundaryRect.right - boundaryOffset;
  const boundaryStartY = boundaryRect.top + boundaryOffset;
  const boundaryEndY = boundaryRect.bottom - boundaryOffset;

  vars[cssVars.anchorWidth] = `${triggerRect.width}px`;
  vars[cssVars.anchorHeight] = `${triggerRect.height}px`;

  if (side === 'top' || side === 'bottom') {
    const sideSpace = side === 'top' ? triggerRect.top - boundaryStartY : boundaryEndY - triggerRect.bottom;

    vars[cssVars.availableHeight] = formatPixels(sideSpace - offsets.sideOffset);
    vars[cssVars.availableWidth] = formatPixels(boundaryEndX - boundaryStartX);
  } else {
    const sideSpace = side === 'left' ? triggerRect.left - boundaryStartX : boundaryEndX - triggerRect.right;

    vars[cssVars.availableWidth] = formatPixels(sideSpace - offsets.sideOffset);
    vars[cssVars.availableHeight] = formatPixels(boundaryEndY - boundaryStartY);
  }

  return vars;
}

/**
 * Compute manual positioning when CSS Anchor Positioning is not supported.
 *
 * Returns inline `top`/`left` styles in **viewport coordinates** for use with `position: fixed` (the popup is in the
 * top layer). All rects from `getBoundingClientRect()` are already viewport-relative.
 *
 * Offsets are resolved by the caller from CSS custom properties via `getComputedStyle()` and passed as `offsets`.
 */
function getManualPositionStyle(
  triggerRect: DOMRect,
  popupRect: DOMRect,
  opts: PositioningOptions,
  offsets: PositioningOffsets = { sideOffset: 0, alignOffset: 0 },
  boundaryRect?: DOMRect
) {
  const { side, align } = opts;
  const { sideOffset, alignOffset } = offsets;

  let top = 0;
  let bottom: string | undefined;
  let left = 0;
  let right: string | undefined;

  // Side positioning in viewport coordinates.
  // Positive sideOffset always increases distance from the trigger.
  if (side === 'top') {
    bottom = `calc(100% - ${triggerRect.top}px + ${sideOffset}px)`;
  } else if (side === 'bottom') {
    top = triggerRect.bottom + sideOffset;
  } else if (side === 'left') {
    right = `calc(100% - ${triggerRect.left}px + ${sideOffset}px)`;
  } else {
    left = triggerRect.right + sideOffset;
  }

  // Alignment along cross axis
  if (side === 'top' || side === 'bottom') {
    const horizontalAlign = getHorizontalAlign(opts);

    if (horizontalAlign === 'start') {
      left = triggerRect.left + alignOffset;
    } else if (horizontalAlign === 'end') {
      left = triggerRect.right - popupRect.width + alignOffset;
    } else {
      left = triggerRect.left + (triggerRect.width - popupRect.width) / 2 + alignOffset;
    }
  } else {
    if (align === 'start') {
      top = triggerRect.top + alignOffset;
    } else if (align === 'end') {
      top = triggerRect.bottom - popupRect.height + alignOffset;
    } else {
      top = triggerRect.top + (triggerRect.height - popupRect.height) / 2 + alignOffset;
    }
  }

  if (boundaryRect) {
    const boundaryOffset = offsets.boundaryOffset ?? 0;

    if (side === 'top' || side === 'bottom') {
      left = shiftCrossAxis(
        left,
        boundaryRect.left + boundaryOffset,
        boundaryRect.right - boundaryOffset,
        popupRect.width
      );
    } else {
      top = shiftCrossAxis(
        top,
        boundaryRect.top + boundaryOffset,
        boundaryRect.bottom - boundaryOffset,
        popupRect.height
      );
    }
  }

  return {
    top: side === 'top' ? 'auto' : `${top}px`,
    bottom: bottom ?? 'auto',
    left: side === 'left' ? 'auto' : `${left}px`,
    right: right ?? 'auto',
  };
}

/**
 * Read positioning offset CSS custom properties from the popup element's computed style, returning numeric pixel
 * values.
 */
export function resolveOffsets(el: Element, cssVars: PositioningCSSVars = PopoverCSSVars): PositioningOffsets {
  const computed = getComputedStyle(el);

  return {
    sideOffset: resolveCSSLength(el, computed.getPropertyValue(cssVars.sideOffset)),
    alignOffset: resolveCSSLength(el, computed.getPropertyValue(cssVars.alignOffset)),
    boundaryOffset: resolveCSSLength(el, computed.getPropertyValue(cssVars.boundaryOffset)),
  };
}

/**
 * Measure the popup's layout box for positioning.
 *
 * `getBoundingClientRect()` includes active transforms, which causes the fallback position to drift while
 * opening/closing animations scale the popup. Using layout dimensions preserves the untransformed size, while the
 * side-axis scroll dimension includes content clipped by size constraints.
 */
export function getPopupPositionRect(el: HTMLElement, side: PopoverSide): DOMRect {
  const rect = el.getBoundingClientRect();
  const size = getElementSize(el, {
    box: 'layout',
    overflow: side === 'left' || side === 'right' ? 'width' : 'height',
  });

  return createDOMRect(rect.left, rect.top, size.width, size.height);
}

/**
 * The viewport origin of the box a `position: fixed` popup is placed against. A `[popover]` popup is placed against the
 * viewport wherever the Popover API exists, including while it is still closed: the first position runs before
 * `showPopover()` moves it to the top layer. Without the Popover API it stays in the page, where an ancestor with a
 * transform, filter, or containment becomes its containing block instead, and engines disagree about which properties
 * count. A fixed probe beside the popup lands on that origin whatever the engine decides, and the popup's own
 * transitions cannot move it.
 */
export function getFixedContainingBlockOrigin(popup: HTMLElement): { x: number; y: number } {
  const parent = popup.parentNode;
  if (opensInTopLayer(popup) || !parent) return { x: 0, y: 0 };

  const probe = popup.ownerDocument.createElement('div');

  probe.style.cssText =
    'position:fixed;left:0;top:0;width:0;height:0;margin:0;padding:0;border:0;visibility:hidden;pointer-events:none';
  parent.insertBefore(probe, popup);

  const rect = probe.getBoundingClientRect();

  probe.remove();

  return { x: rect.left, y: rect.top };
}

/** Move a rect into a coordinate space whose origin sits at `origin` in the viewport. */
export function offsetRect(rect: DOMRect, origin: { x: number; y: number }): DOMRect {
  return createDOMRect(rect.left - origin.x, rect.top - origin.y, rect.width, rect.height);
}

function opensInTopLayer(popup: HTMLElement): boolean {
  return popup.hasAttribute('popover') && supportsPopoverAPI();
}
