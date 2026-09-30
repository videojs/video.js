'use client';

import { type MenuOptionState, type PlaybackRateRadioGroupCore, PlaybackRateRadioGroupDataAttrs } from '@videojs/core';
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
  type PlaybackRateOption,
  type PlaybackRateOptionsProps,
  type PlaybackRateOptionsResult,
  usePlaybackRateOptions,
} from '../playback-rate';

export type PlaybackRateRadioGroupItemState = PlaybackRateOption & {
  /** Whether this playback rate is currently selected. */
  checked: boolean;
};

export interface PlaybackRateRadioGroupItemProps extends Omit<MenuRadioItemProps, 'ref'> {
  /** Playback rate represented by the item. */
  'data-rate': string;
}

export interface PlaybackRateRadioGroupRootProps extends PlaybackRateOptionsProps {
  children?: ReactNode;
}

export interface PlaybackRateRadioGroupOptionsProps extends Omit<
  UIComponentProps<'div', PlaybackRateRadioGroupCore.State>,
  'children'
> {
  /** Render one consumer-owned menu radio item for every playback rate. */
  renderItem: (props: PlaybackRateRadioGroupItemProps, state: PlaybackRateRadioGroupItemState) => ReactElement;
}

export type PlaybackRateRadioGroupValueProps = UIComponentProps<'span', PlaybackRateOptionsResult>;

export interface PlaybackRateRadioGroupLegacyProps
  extends PlaybackRateRadioGroupOptionsProps, PlaybackRateOptionsProps {}

const PlaybackRateRadioGroupContext = createContext<PlaybackRateOptionsResult | null | undefined>(undefined);

/** Owns playback-rate option state and shares it with an enclosing menu. Does not render a DOM element. */
export function PlaybackRateRadioGroupRoot({ children, ...props }: PlaybackRateRadioGroupRootProps): ReactNode {
  const playbackRate = usePlaybackRateOptions(props);

  useMenuOptionState(toMenuOptionState(playbackRate));

  return (
    <PlaybackRateRadioGroupContext.Provider value={playbackRate}>{children}</PlaybackRateRadioGroupContext.Provider>
  );
}

/** Displays the selected playback-rate label. */
export const PlaybackRateRadioGroupValue = forwardRef<HTMLSpanElement, PlaybackRateRadioGroupValueProps>(
  function PlaybackRateRadioGroupValue({ render, className, style, ...elementProps }, forwardedRef) {
    const playbackRate = usePlaybackRateRadioGroupContext();
    if (!playbackRate) return null;

    return renderElement(
      'span',
      { render, className, style },
      { state: playbackRate, ref: forwardedRef, props: [elementProps, { children: playbackRate.selectedLabel }] }
    );
  }
);

/** Renders menu radio items for the player's available playback rates. */
export const PlaybackRateRadioGroupOptions = forwardRef<HTMLDivElement, PlaybackRateRadioGroupOptionsProps>(
  function PlaybackRateRadioGroupOptions(componentProps, forwardedRef) {
    const {
      renderItem,
      render,
      className,
      style,
      'aria-label': ariaLabelProp,
      'aria-labelledby': ariaLabelledBy,
      ...elementProps
    } = componentProps;
    const playbackRate = usePlaybackRateRadioGroupContext();
    if (!playbackRate) return null;

    const { state, value, options, setValue } = playbackRate;
    const ariaLabel = ariaLabelProp ?? (ariaLabelledBy === undefined ? playbackRate.label : undefined);

    return (
      <MenuRadioGroup
        {...getStateDataAttrs(state, PlaybackRateRadioGroupDataAttrs)}
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
                  'data-rate': option.value,
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
export const PlaybackRateRadioGroupLegacy = forwardRef<HTMLDivElement, PlaybackRateRadioGroupLegacyProps>(
  function PlaybackRateRadioGroupLegacy({ label, formatRate, disabled, ...props }, forwardedRef) {
    return (
      <PlaybackRateRadioGroupRoot label={label} formatRate={formatRate} disabled={disabled}>
        <PlaybackRateRadioGroupOptions {...props} ref={forwardedRef} />
      </PlaybackRateRadioGroupRoot>
    );
  }
);

function usePlaybackRateRadioGroupContext(): PlaybackRateOptionsResult | null {
  const playbackRate = useContext(PlaybackRateRadioGroupContext);

  if (playbackRate === undefined) {
    throw new Error('PlaybackRateRadioGroup parts must be used within PlaybackRateRadioGroup.Root');
  }

  return playbackRate;
}

function toMenuOptionState(playbackRate: PlaybackRateOptionsResult | null): MenuOptionState {
  return {
    value: playbackRate?.selectedLabel ?? '',
    disabled: playbackRate?.disabled ?? true,
    hidden: playbackRate?.hidden ?? true,
    availability: playbackRate?.state.availability ?? 'unsupported',
  };
}

export namespace PlaybackRateRadioGroupRoot {
  export type Props = PlaybackRateRadioGroupRootProps;
}

export namespace PlaybackRateRadioGroupValue {
  export type Props = PlaybackRateRadioGroupValueProps;
  export type State = PlaybackRateOptionsResult;
}

export namespace PlaybackRateRadioGroupOptions {
  export type Props = PlaybackRateRadioGroupOptionsProps;
  export type State = PlaybackRateRadioGroupCore.State;
  export type ItemProps = PlaybackRateRadioGroupItemProps;
  export type ItemState = PlaybackRateRadioGroupItemState;
}
