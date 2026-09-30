'use client';

import { ContainerCore, ContainerDataAttrs, SKIN_HELP_TEXT, SKIN_HELP_URL } from '@videojs/core';
import {
  createPopupGroup,
  DEFAULT_CONTAINER_ROLE,
  DEFAULT_CONTAINER_TAB_INDEX,
  focusContainer,
  getStateDataAttrs,
  selectControls,
} from '@videojs/core/dom';
import { labelText } from '@videojs/core/i18n/text/container';
import { getTextDirection } from '@videojs/utils/i18n';
import {
  forwardRef,
  type HTMLAttributes,
  type PointerEventHandler,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { I18nContext, useTranslator } from '../i18n/context';
import { useComposedRefs } from '../utils/use-composed-refs';
import { useContainerAttach, usePlayer } from './context';
import { PopupGroupProvider } from './popup-group-context';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(function Container(
  {
    children,
    tabIndex = DEFAULT_CONTAINER_TAB_INDEX,
    role = DEFAULT_CONTAINER_ROLE,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    lang: langProp,
    dir: dirProp,
    ...props
  },
  ref
) {
  const setContainer = useContainerAttach();
  const translator = useTranslator();
  const i18n = useContext(I18nContext);
  const controls = usePlayer(selectControls);
  const [core] = useState(() => new ContainerCore());

  const [popupGroup] = useState(() => createPopupGroup());

  const internalRef = useRef<HTMLDivElement>(null);
  const composedRef = useComposedRefs(ref, internalRef);

  useEffect(() => {
    setContainer?.(internalRef.current);
    return () => setContainer?.(null);
  }, [setContainer]);

  const handlePointerUp: PointerEventHandler<HTMLDivElement> = (event) => {
    props.onPointerUp?.(event);
    const el = internalRef.current;
    if (!el) return;

    focusContainer(el);
  };

  const accessibleNameProps =
    ariaLabel !== undefined || ariaLabelledBy !== undefined
      ? { 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy }
      : { 'aria-label': translator(labelText) };
  const lang = langProp ?? (i18n?.localeFromProp ? i18n.locale : undefined);
  const localeProps = {
    lang,
    dir: dirProp ?? (lang ? getTextDirection(lang) : undefined),
  };

  if (controls) core.setMedia(controls);

  const stateAttrs = controls ? getStateDataAttrs(core.getState(), ContainerDataAttrs) : undefined;

  return (
    <div
      ref={composedRef}
      role={role}
      tabIndex={tabIndex}
      {...accessibleNameProps}
      {...localeProps}
      {...props}
      {...stateAttrs}
      onPointerUp={handlePointerUp}
    >
      {/* Hidden keeps it out of the UI and the accessibility tree; scrapers still read it from server-rendered HTML. */}
      <a rel="help" href={SKIN_HELP_URL} hidden>
        {SKIN_HELP_TEXT}
      </a>
      <PopupGroupProvider value={popupGroup}>{children}</PopupGroupProvider>
    </div>
  );
});

export namespace Container {
  export type Props = ContainerProps;
}
