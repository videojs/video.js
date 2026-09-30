'use client';

import { MenuPopupDataAttrs, type MenuState } from '@videojs/core';
import { createMenuPopup, getRootPositionOptions, MenuPositioningCSSVars } from '@videojs/core/dom';
import { forwardRef, useCallback, useMemo, useRef, useState } from 'react';

import type { UIComponentProps } from '../../utils/types';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { useDestroy } from '../../utils/use-destroy';
import { renderElement } from '../../utils/use-render';
import { usePopupPosition } from '../popover/use-popup-position';
import { MenuPopupContextProvider, useMenuContext } from './context';

export interface MenuPopupProps extends UIComponentProps<'div', MenuState> {
  /** Keep the popup mounted, hidden, and inert while closed. */
  keepMounted?: boolean;
}

/** Positioned menu surface that contains one or more sibling Content pages. */
export const MenuPopup = forwardRef<HTMLDivElement, MenuPopupProps>(function MenuPopup(
  { render, className, style, onBlur, keepMounted = false, ...elementProps },
  forwardedRef
) {
  const { core, menu, parent, state, preferredSide, setPositionedSide, anchorName, boundary, container } =
    useMenuContext();
  if (__DEV__ && parent) throw new Error('Menu.Popup must be a direct child of a root Menu.Root');

  const [popup] = useState(createMenuPopup);
  const [popupElement, setPopupElement] = useState<HTMLElement | null>(null);
  const internalRef = useRef<HTMLDivElement>(null);
  const setInternalElement = useCallback(
    (element: HTMLDivElement | null) => {
      menu.setPopupElement(element);
      popup.setElement(element);
      setPopupElement(element);
    },
    [menu, popup]
  );
  const composedRef = useComposedRefs(forwardedRef, internalRef, setInternalElement);
  const positionOptions = useMemo(
    () => getRootPositionOptions(preferredSide, state.align),
    [preferredSide, state.align]
  );
  const positioningStyle = usePopupPosition({
    open: state.open,
    anchorName,
    position: positionOptions,
    triggerSource: menu,
    popupRef: internalRef,
    boundary,
    container,
    cssVars: MenuPositioningCSSVars,
    trackResize: false,
    onSideChange: setPositionedSide,
  });

  useDestroy(popup);

  const inactive = !state.open && state.status !== 'ending';
  if (inactive && !keepMounted) return null;

  const popupNode = renderElement(
    'div',
    { render, className, style },
    {
      state,
      stateAttrMap: MenuPopupDataAttrs,
      ref: composedRef,
      props: [
        { style: positioningStyle, ...core.getPopupAttrs() },
        {
          onBlur: (event: React.FocusEvent<HTMLDivElement>) => {
            onBlur?.(event);
            menu.contentProps.onFocusOut(event);
          },
        },
        elementProps,
        { hidden: inactive, inert: inactive || undefined },
      ],
    }
  );

  return <MenuPopupContextProvider value={{ popup, element: popupElement }}>{popupNode}</MenuPopupContextProvider>;
});

export namespace MenuPopup {
  export type Props = MenuPopupProps;
  export type State = MenuState;
}
