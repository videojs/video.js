import {
  applyStyles,
  getAnchorNames,
  getPositionedSide,
  type InlineStyleSnapshot,
  isRTL,
  observeResize,
  rafThrottle,
  restoreInlineStyles,
  snapshotInlineStyles,
  supportsAnchorPositioning,
} from '@videojs/utils/dom';
import { kebabCase } from '@videojs/utils/string';

import { PopoverCSSVars } from '../../../core/ui/popover/vars';
import { isEventWithinElement } from '../../utils/event';
import { getPositioningBoundaryRect, type PositioningBoundary, resolvePositioningBoundary } from '../../utils/layout';
import {
  getAnchorPositionStyle,
  getFixedContainingBlockOrigin,
  getPopupPositionRect,
  offsetRect,
  type PositioningCSSVars,
  type PositioningOptions,
  resolveOffsets,
} from './positioning';

/** @internal */
export interface PopupPositionerOptions {
  anchorName: string;
  position: PositioningOptions | null;
  trigger: HTMLElement | null;
  popup: HTMLElement | null;
  boundary?: PositioningBoundary;
  container?: Element | null;
  cssVars?: PositioningCSSVars;
  /** Whether popup size changes should trigger repositioning. */
  trackResize?: boolean;
  onSideChange?: (side: PositioningOptions['side']) => void;
}

interface InlineStyleValue {
  value: string;
  priority: string;
}

const POPUP_STYLE_PROPS = [
  'position',
  'inset',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'justify-self',
  'align-self',
  'margin-inline-start',
  'margin-block-start',
  'translate',
  'top',
  'right',
  'bottom',
  'left',
] as const;

/**
 * Positions a popup and tracks layout changes while it is active.
 *
 * @internal
 */
export class PopupPositioner {
  #options: PopupPositionerOptions | null = null;
  #boundaryElement: Element | null = null;
  #abort: AbortController | null = null;
  #stopObservingResize: (() => void) | null = null;
  #triggerAnchorName: string | null = null;
  #triggerAnchorAdded = false;
  #popupAnchor: InlineStyleValue | null = null;
  #popupStyles: InlineStyleSnapshot | null = null;
  readonly #reposition = rafThrottle(() => this.#position());

  sync(options: PopupPositionerOptions): void {
    const { anchorName, position, trigger, popup, boundary, container, cssVars = PopoverCSSVars } = options;

    if (!position || !trigger || !popup) {
      this.cleanup();
      return;
    }

    const boundaryElement = resolvePositioningBoundary(boundary, {
      container: container ?? null,
      root: popup.getRootNode() as Document | ShadowRoot,
    });
    const previous = this.#options;
    const trackingChanged =
      !previous ||
      previous.anchorName !== anchorName ||
      previous.trigger !== trigger ||
      previous.popup !== popup ||
      (previous.cssVars ?? PopoverCSSVars) !== cssVars ||
      previous.trackResize !== options.trackResize ||
      this.#boundaryElement !== boundaryElement;

    if (trackingChanged) {
      if (previous?.popup) this.#restorePopupStyles(previous.popup);

      this.#stopTracking();
      this.#options = { ...options, cssVars };
      this.#boundaryElement = boundaryElement;
      this.#startTracking();
    } else {
      this.#options = { ...options, cssVars };
    }

    this.#position();
  }

  cleanup(): void {
    if (!this.#options) return;

    if (this.#options.popup) this.#restorePopupStyles(this.#options.popup);

    this.#stopTracking();
    this.#options = null;
    this.#boundaryElement = null;
  }

  #startTracking(): void {
    const options = this.#options;
    if (!options?.trigger || !options.popup) return;

    this.#applyAnchorStyles(options.trigger, options.popup, options.anchorName);
    this.#abort = new AbortController();
    const { signal } = this.#abort;

    window.addEventListener('scroll', this.#schedule, { capture: true, passive: true, signal });
    window.addEventListener('resize', this.#schedule, { signal });

    const resizeTargets: Element[] = [options.trigger];

    if (options.trackResize !== false) resizeTargets.push(options.popup);

    if (this.#boundaryElement) resizeTargets.push(this.#boundaryElement);

    this.#stopObservingResize = observeResize(resizeTargets, () => this.#schedule());
  }

  #stopTracking(): void {
    this.#abort?.abort();
    this.#abort = null;
    this.#stopObservingResize?.();
    this.#stopObservingResize = null;
    this.#reposition.cancel();
    this.#restoreAnchorStyles();
  }

  #schedule = (event?: Event): void => {
    const popup = this.#options?.popup;
    if (!popup || (event && isEventWithinElement(event, popup))) return;

    this.#reposition();
  };

  #position(): void {
    const options = this.#options;
    if (!options?.position || !options.trigger || !options.popup) return;

    const trigger = options.trigger;
    const anchorSupported = supportsAnchorPositioning();
    // Fallback coordinates are relative to the popup's containing block, which is the viewport only in the top layer.
    const origin = anchorSupported ? { x: 0, y: 0 } : getFixedContainingBlockOrigin(options.popup);
    const triggerRect = offsetRect(trigger.getBoundingClientRect(), origin);

    const boundaryRect = offsetRect(getPositioningBoundaryRect(this.#boundaryElement), origin);
    const offsets = resolveOffsets(options.popup, options.cssVars);
    const preferredPosition = options.position;
    const measure = () => offsetRect(getPopupPositionRect(options.popup!, preferredPosition.side), origin);
    const getPosition = (popupRect: DOMRect) => {
      const side = getPositionedSide(triggerRect, popupRect, boundaryRect, preferredPosition, offsets);
      const { positionAnchor: _, ...style } = getAnchorPositionStyle(
        options.anchorName,
        { ...preferredPosition, side, direction: isRTL(trigger) ? 'rtl' : 'ltr' },
        triggerRect,
        anchorSupported ? undefined : popupRect,
        boundaryRect,
        offsets,
        options.cssVars
      );

      return { popupRect, side, style };
    };
    const position = getPosition(measure());

    this.#capturePopupStyles(options.popup, options.cssVars ?? PopoverCSSVars);
    applyStyles(options.popup, position.style);
    options.onSideChange?.(position.side);

    if (anchorSupported || !options.onSideChange) return;

    // Menu callbacks can constrain the popup from the available-size variables.
    // Correct fallback coordinates synchronously so alignment is stable before paint.
    const popupRect = measure();
    if (popupRect.width === position.popupRect.width && popupRect.height === position.popupRect.height) return;

    const nextPosition = getPosition(popupRect);

    applyStyles(options.popup, nextPosition.style);

    if (nextPosition.side !== position.side) options.onSideChange(nextPosition.side);
  }

  #capturePopupStyles(popup: HTMLElement, cssVars: PositioningCSSVars): void {
    if (this.#popupStyles) return;

    const props = [
      ...POPUP_STYLE_PROPS,
      cssVars.anchorWidth,
      cssVars.anchorHeight,
      cssVars.availableWidth,
      cssVars.availableHeight,
    ];

    this.#popupStyles = snapshotInlineStyles(popup, props);
  }

  #restorePopupStyles(popup: HTMLElement): void {
    if (!this.#popupStyles) return;

    restoreInlineStyles(popup, this.#popupStyles);
    this.#popupStyles = null;
  }

  #applyAnchorStyles(trigger: HTMLElement, popup: HTMLElement, anchorName: string): void {
    if (!supportsAnchorPositioning()) return;

    const generatedName = `--${anchorName}`;
    const triggerAnchor = this.#readStyle(trigger, 'anchor-name');

    this.#popupAnchor = this.#readStyle(popup, 'position-anchor');

    const names = getAnchorNames(trigger);

    this.#triggerAnchorName = generatedName;
    this.#triggerAnchorAdded = !names.includes(generatedName);

    if (this.#triggerAnchorAdded) names.push(generatedName);

    trigger.style.setProperty('anchor-name', names.join(', '), triggerAnchor.priority);
    popup.style.setProperty('position-anchor', generatedName);
  }

  #restoreAnchorStyles(): void {
    const options = this.#options;
    if (!options?.trigger || !options.popup) return;

    if (this.#triggerAnchorName && this.#triggerAnchorAdded) {
      const current = this.#readStyle(options.trigger, 'anchor-name');
      const names = getAnchorNames(options.trigger).filter((name) => name !== this.#triggerAnchorName);

      this.#writeStyle(options.trigger, 'anchor-name', { value: names.join(', '), priority: current.priority });
    }

    if (this.#popupAnchor) this.#writeStyle(options.popup, 'position-anchor', this.#popupAnchor);

    this.#triggerAnchorName = null;
    this.#triggerAnchorAdded = false;
    this.#popupAnchor = null;
  }

  #readStyle(element: HTMLElement, prop: string): InlineStyleValue {
    const name = prop.startsWith('--') ? prop : kebabCase(prop);

    return {
      value: element.style.getPropertyValue(name),
      priority: element.style.getPropertyPriority(name),
    };
  }

  #writeStyle(element: HTMLElement, prop: string, style: InlineStyleValue): void {
    const name = prop.startsWith('--') ? prop : kebabCase(prop);

    if (style.value) {
      element.style.setProperty(name, style.value, style.priority);
    } else {
      element.style.removeProperty(name);
    }
  }
}
