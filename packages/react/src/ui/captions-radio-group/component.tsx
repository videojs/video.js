'use client';

import { type CaptionsRadioGroupCore, CaptionsRadioGroupDataAttrs, type MenuOptionState } from '@videojs/core';
import { getStateDataAttrs } from '@videojs/core/dom';
import { isFunction } from '@videojs/utils/predicate';
import type { ReactElement, ReactNode } from 'react';
import { createContext, Fragment, forwardRef, useContext } from 'react';

import type { HTMLProps, UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useMenuOptionState } from '../menu/context';
import { MenuRadioGroup } from '../menu/radio-group';
import type { MenuRadioItemProps } from '../menu/radio-item';
import {
  type CaptionsOption,
  type CaptionsOptionsProps,
  type CaptionsOptionsResult,
  useCaptionsOptions,
} from './use-captions-options';

export type CaptionsRadioGroupItemState = CaptionsOption & {
  /** Whether this option is currently selected. */
  checked: boolean;
};

export interface CaptionsRadioGroupItemProps extends Omit<MenuRadioItemProps, 'ref'> {
  /** Text track value represented by the item. */
  'data-track': string;
}

export interface CaptionsRadioGroupRootProps extends CaptionsOptionsProps {
  children?: ReactNode;
}

export interface CaptionsRadioGroupOptionsProps extends Omit<
  UIComponentProps<'div', CaptionsRadioGroupCore.State>,
  'children'
> {
  /** Render one consumer-owned menu radio item for every captions option. */
  renderItem: (props: CaptionsRadioGroupItemProps, state: CaptionsRadioGroupItemState) => ReactElement;
}

export type CaptionsRadioGroupValueProps = UIComponentProps<'span', CaptionsOptionsResult>;

export interface CaptionsRadioGroupLegacyProps extends CaptionsRadioGroupOptionsProps, CaptionsOptionsProps {}

const CaptionsRadioGroupContext = createContext<CaptionsOptionsResult | null | undefined>(undefined);

/** Owns captions option state and shares it with an enclosing menu. Does not render a DOM element. */
export function CaptionsRadioGroupRoot({ children, ...props }: CaptionsRadioGroupRootProps): ReactNode {
  const captions = useCaptionsOptions(props);

  useMenuOptionState(toMenuOptionState(captions));

  return <CaptionsRadioGroupContext.Provider value={captions}>{children}</CaptionsRadioGroupContext.Provider>;
}

/** Displays the selected captions label. */
export const CaptionsRadioGroupValue = forwardRef<HTMLSpanElement, CaptionsRadioGroupValueProps>(
  function CaptionsRadioGroupValue({ render, className, style, ...elementProps }, forwardedRef) {
    const captions = useCaptionsRadioGroupContext();
    if (!captions) return null;

    return renderElement(
      'span',
      { render, className, style },
      { state: captions, ref: forwardedRef, props: [elementProps, { children: captions.selectedLabel }] }
    );
  }
);

/** Renders menu radio items for the player's captions and subtitles tracks. */
export const CaptionsRadioGroupOptions = forwardRef<HTMLDivElement, CaptionsRadioGroupOptionsProps>(
  function CaptionsRadioGroupOptions(componentProps, forwardedRef) {
    const {
      renderItem,
      render,
      className,
      style,
      'aria-label': ariaLabelProp,
      'aria-labelledby': ariaLabelledBy,
      ...elementProps
    } = componentProps;
    const captions = useCaptionsRadioGroupContext();
    if (!captions) return null;

    const { state, value, options, setValue } = captions;
    const ariaLabel = ariaLabelProp ?? (ariaLabelledBy === undefined ? captions.label : undefined);

    return (
      <MenuRadioGroup
        {...getStateDataAttrs(state, CaptionsRadioGroupDataAttrs)}
        {...elementProps}
        ref={forwardedRef}
        className={isFunction(className) ? className(state) : className}
        style={isFunction(style) ? style(state) : style}
        render={isFunction(render) ? (props: HTMLProps) => render(props, state) : render}
        value={value}
        onValueChange={setValue}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-disabled={state.disabled || undefined}
        hidden={state.hidden}
      >
        {options.map((option) => {
          const itemState = { ...option, checked: option.value === value };

          return (
            <Fragment key={option.value}>
              {renderItem(
                {
                  value: option.value,
                  disabled: option.disabled,
                  'data-track': option.value,
                  children: option.label,
                },
                itemState
              )}
            </Fragment>
          );
        })}
      </MenuRadioGroup>
    );
  }
);

/** @internal Compatibility adapter for the existing preset sources. */
export const CaptionsRadioGroupLegacy = forwardRef<HTMLDivElement, CaptionsRadioGroupLegacyProps>(
  function CaptionsRadioGroupLegacy({ label, formatTrack, disabled, ...props }, forwardedRef) {
    return (
      <CaptionsRadioGroupRoot label={label} formatTrack={formatTrack} disabled={disabled}>
        <CaptionsRadioGroupOptions {...props} ref={forwardedRef} />
      </CaptionsRadioGroupRoot>
    );
  }
);

function useCaptionsRadioGroupContext(): CaptionsOptionsResult | null {
  const captions = useContext(CaptionsRadioGroupContext);
  if (captions === undefined) throw new Error('CaptionsRadioGroup parts must be used within CaptionsRadioGroup.Root');

  return captions;
}

function toMenuOptionState(captions: CaptionsOptionsResult | null): MenuOptionState {
  return {
    value: captions?.selectedLabel ?? '',
    disabled: captions?.disabled ?? true,
    hidden: captions?.hidden ?? true,
    availability: captions?.state.availability ?? 'unsupported',
  };
}

export namespace CaptionsRadioGroupRoot {
  export type Props = CaptionsRadioGroupRootProps;
}

export namespace CaptionsRadioGroupValue {
  export type Props = CaptionsRadioGroupValueProps;
  export type State = CaptionsOptionsResult;
}

export namespace CaptionsRadioGroupOptions {
  export type Props = CaptionsRadioGroupOptionsProps;
  export type State = CaptionsRadioGroupCore.State;
  export type ItemProps = CaptionsRadioGroupItemProps;
  export type ItemState = CaptionsRadioGroupItemState;
}
