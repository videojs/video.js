'use client';

import { MenuContentDataAttrs, type MenuState } from '@videojs/core';
import { isMenuNavigationKey } from '@videojs/core/dom';
import { forwardRef, useCallback, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import type { UIComponentProps } from '../../utils/types';
import { useComposedRefs } from '../../utils/use-composed-refs';
import { renderElement } from '../../utils/use-render';
import { useMenuContext, useMenuPopupContext } from './context';
import { callKeyDownHandler, preventMenuKeyDefault } from './keyboard';

export interface MenuContentProps extends UIComponentProps<'div', MenuState> {}

/** Accessible item and focus scope for exactly one root or nested menu page. */
export const MenuContent = forwardRef<HTMLDivElement, MenuContentProps>(function MenuContent(
  { render, className, style, onKeyDown, onBlur, ...elementProps },
  forwardedRef
) {
  const { core, menu, parent, state, contentId } = useMenuContext();
  const { popup, element: popupElement } = useMenuPopupContext();
  const isSubmenu = parent !== null;
  const isActive = isSubmenu && state.open;
  const wasActiveRef = useRef(false);
  const cleanupRegistrationRef = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    if (!isSubmenu) return undefined;

    const wasActive = wasActiveRef.current;

    wasActiveRef.current = isActive;

    if (isActive && !wasActive) {
      const frame = requestAnimationFrame(() => menu.highlightInitialItem({ preventScroll: true }));

      return () => cancelAnimationFrame(frame);
    }

    return undefined;
  }, [isActive, isSubmenu, menu]);

  const setContentElement = useCallback(
    (element: HTMLDivElement | null) => {
      cleanupRegistrationRef.current?.();
      cleanupRegistrationRef.current = null;

      if (!element) {
        if (isSubmenu) menu.setPopupElement(null);

        return;
      }

      if (isSubmenu) menu.setPopupElement(element);

      cleanupRegistrationRef.current = popup.registerContent({
        menu,
        parent: parent?.menu ?? null,
        element,
      });
    },
    [isSubmenu, menu, parent?.menu, popup]
  );
  const composedRef = useComposedRefs(forwardedRef, setContentElement);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const defaultPreventedByUser = callKeyDownHandler(
        onKeyDown as React.KeyboardEventHandler<HTMLDivElement> | undefined,
        event
      );
      const isNavigationKey = isMenuNavigationKey(event);

      menu.contentProps.onKeyDown(event);

      if (isSubmenu && (event.key === 'ArrowLeft' || event.key === 'Escape') && !defaultPreventedByUser) {
        event.preventDefault();
        menu.close('escape');
      }

      if (event.key !== 'Escape' && isNavigationKey) event.stopPropagation();
    },
    [isSubmenu, menu, onKeyDown]
  );

  const inactive = isSubmenu && !isActive && state.status !== 'ending';
  if (inactive) return null;

  const contentNode = renderElement(
    'div',
    { render, className, style },
    {
      state,
      stateAttrMap: MenuContentDataAttrs,
      ref: composedRef,
      props: [
        { id: contentId, ...core.getContentAttrs() },
        {
          onKeyDownCapture: preventMenuKeyDefault,
          onKeyDown: handleKeyDown,
          onBlur: (event: React.FocusEvent<HTMLDivElement>) => {
            onBlur?.(event);

            if (isSubmenu) menu.contentProps.onFocusOut(event);
          },
        },
        elementProps,
      ],
    }
  );

  return isSubmenu && popupElement ? createPortal(contentNode, popupElement) : contentNode;
});

export namespace MenuContent {
  export type Props = MenuContentProps;
  export type State = MenuState;
}
