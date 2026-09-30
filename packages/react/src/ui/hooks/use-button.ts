'use client';

import { type ButtonActivationSource, createButton, type UIEvent } from '@videojs/core/dom';
import type { ComponentPropsWithRef, Ref } from 'react';
import { useCallback } from 'react';

import { mergeProps } from '../../utils/merge-props';

export interface UseButtonParameters {
  displayName: string;
  onActivate: (event: UIEvent, source: ButtonActivationSource) => void;
  isDisabled: () => boolean;
}

export interface UseButtonReturnValue {
  getButtonProps: (externalProps?: ComponentPropsWithRef<'button'>) => ComponentPropsWithRef<'button'>;
  buttonRef: Ref<HTMLElement>;
}

/**
 * Hook for button behavior with keyboard and pointer interaction.
 *
 * @example
 *   ```tsx
 *   const { getButtonProps, buttonRef } = useButton({
 *     displayName: 'PlayButton',
 *     onActivate: () => togglePlayback(),
 *     isDisabled: () => disabled,
 *   });
 *
 *   return useRender('button', componentProps, {
 *     state,
 *     ref: [forwardedRef, buttonRef],
 *     props: [elementProps, getButtonProps],
 *   });
 *   ```;
 *
 * @param params - Button configuration with activation handler and disabled check.
 */
export function useButton(params: UseButtonParameters): UseButtonReturnValue {
  const { displayName, onActivate, isDisabled } = params;

  const buttonRef = useCallback(
    (element: HTMLElement | null) => {
      if (__DEV__ && element && element.tagName !== 'BUTTON') {
        console.warn(`${displayName} should render a <button> element for accessibility`);
      }
    },
    [displayName]
  );

  const getButtonProps = useCallback(
    (externalProps?: ComponentPropsWithRef<'button'>): ComponentPropsWithRef<'button'> => {
      const buttonProps = createButton({ onActivate, isDisabled });

      return mergeProps(buttonProps, externalProps);
    },
    [onActivate, isDisabled]
  );

  return { getButtonProps, buttonRef };
}

export namespace useButton {
  export type Parameters = UseButtonParameters;
  export type ReturnValue = UseButtonReturnValue;
}
