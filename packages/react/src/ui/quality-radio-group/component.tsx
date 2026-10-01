'use client';

import { type MenuOptionState, QualityRadioGroupDataAttrs, type QualityRadioGroupState } from '@videojs/core';
import { getStateDataAttrs } from '@videojs/core/dom';
import { isFunction } from '@videojs/utils/predicate';
import type { ReactElement, ReactNode } from 'react';
import { createContext, Fragment, forwardRef, useContext } from 'react';

import type { HTMLProps, UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import { useMenuOptionState } from '../menu/context';
import { MenuRadioGroup } from '../menu/radio-group';
import type { MenuRadioItemProps } from '../menu/radio-item';
import { type QualityOption, type QualityOptionsProps, type QualityOptionsResult, useQualityOptions } from '../quality';

export type QualityRadioGroupItemState = QualityOption & {
  /** Whether this quality option is currently selected. */
  checked: boolean;
};

export interface QualityRadioGroupItemProps extends Omit<MenuRadioItemProps, 'ref'> {
  /** Rendition value represented by the item. */
  'data-rendition': string;
}

export interface QualityRadioGroupRootProps extends QualityOptionsProps {
  children?: ReactNode;
}

export interface QualityRadioGroupOptionsProps extends Omit<
  UIComponentProps<'div', QualityRadioGroupState>,
  'children'
> {
  /** Render one consumer-owned menu radio item for every quality option. */
  renderItem: (props: QualityRadioGroupItemProps, state: QualityRadioGroupItemState) => ReactElement;
}

export type QualityRadioGroupValueProps = UIComponentProps<'span', QualityOptionsResult>;

const QualityRadioGroupContext = createContext<QualityOptionsResult | null | undefined>(undefined);

/** Owns quality option state and shares it with an enclosing menu. Does not render a DOM element. */
export function QualityRadioGroupRoot({ children, ...props }: QualityRadioGroupRootProps): ReactNode {
  const quality = useQualityOptions(props);

  useMenuOptionState(toMenuOptionState(quality));

  return <QualityRadioGroupContext.Provider value={quality}>{children}</QualityRadioGroupContext.Provider>;
}

/** Displays the selected quality label. */
export const QualityRadioGroupValue = forwardRef<HTMLSpanElement, QualityRadioGroupValueProps>(
  function QualityRadioGroupValue({ render, className, style, ...elementProps }, forwardedRef) {
    const quality = useQualityRadioGroupContext();
    if (!quality) return null;

    return renderElement(
      'span',
      { render, className, style },
      { state: quality, ref: forwardedRef, props: [elementProps, { children: quality.selectedLabel }] }
    );
  }
);

/** Renders menu radio items for the player's video renditions. */
export const QualityRadioGroupOptions = forwardRef<HTMLDivElement, QualityRadioGroupOptionsProps>(
  function QualityRadioGroupOptions(componentProps, forwardedRef) {
    const {
      renderItem,
      render,
      className,
      style,
      'aria-label': ariaLabelProp,
      'aria-labelledby': ariaLabelledBy,
      ...elementProps
    } = componentProps;
    const quality = useQualityRadioGroupContext();
    if (!quality) return null;

    const { state, value, options, setValue } = quality;
    const ariaLabel = ariaLabelProp ?? (ariaLabelledBy === undefined ? quality.label : undefined);

    return (
      <MenuRadioGroup
        {...getStateDataAttrs(state, QualityRadioGroupDataAttrs)}
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
                  'data-rendition': option.value,
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

function useQualityRadioGroupContext(): QualityOptionsResult | null {
  const quality = useContext(QualityRadioGroupContext);
  if (quality === undefined) throw new Error('QualityRadioGroup parts must be used within QualityRadioGroup.Root');

  return quality;
}

function toMenuOptionState(quality: QualityOptionsResult | null): MenuOptionState {
  return {
    value: quality?.selectedLabel ?? '',
    disabled: quality?.disabled ?? true,
    hidden: quality?.hidden ?? true,
    availability: quality?.state.availability ?? 'unsupported',
  };
}

export namespace QualityRadioGroupRoot {
  export type Props = QualityRadioGroupRootProps;
}

export namespace QualityRadioGroupValue {
  export type Props = QualityRadioGroupValueProps;
  export type State = QualityOptionsResult;
}

export namespace QualityRadioGroupOptions {
  export type Props = QualityRadioGroupOptionsProps;
  export type State = QualityRadioGroupState;
  export type ItemProps = QualityRadioGroupItemProps;
  export type ItemState = QualityRadioGroupItemState;
}
