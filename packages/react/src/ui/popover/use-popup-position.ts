'use client';

import {
  type MediaContainer,
  PopupPositioner,
  type PopupPositionerOptions,
  type PositioningBoundary,
  type PositioningCSSVars,
  type PositioningOptions,
} from '@videojs/core/dom';
import type { CSSProperties, RefObject } from 'react';
import { useLayoutEffect, useState } from 'react';

type PopupStyle = CSSProperties & Partial<Record<`--${string}`, string>>;

const POPOVER_RESET: PopupStyle = { position: 'fixed', inset: 'auto', margin: 0 };

interface UsePopupPositionOptions {
  open: boolean;
  anchorName: string;
  position: PositioningOptions | null;
  triggerSource: { readonly triggerElement: HTMLElement | null };
  popupRef: RefObject<HTMLElement | null>;
  boundary: PositioningBoundary;
  container: MediaContainer | null;
  cssVars?: PositioningCSSVars;
  trackResize?: boolean;
  onSideChange?: PopupPositionerOptions['onSideChange'];
}

export function usePopupPosition({
  open,
  anchorName,
  position,
  triggerSource,
  popupRef,
  boundary,
  container,
  cssVars,
  trackResize,
  onSideChange,
}: UsePopupPositionOptions): PopupStyle {
  const [positioner] = useState(() => new PopupPositioner());

  useLayoutEffect(() => {
    if (!open) {
      positioner.cleanup();
      return;
    }

    positioner.sync({
      anchorName,
      position,
      trigger: triggerSource.triggerElement,
      popup: popupRef.current,
      boundary,
      container,
      ...(trackResize !== undefined ? { trackResize } : {}),
      ...(cssVars ? { cssVars } : {}),
      ...(onSideChange ? { onSideChange } : {}),
    });
  });

  useLayoutEffect(() => () => positioner.cleanup(), [positioner]);

  return POPOVER_RESET;
}
