'use client';

import { type AudioTrackRadioGroupCore, AudioTrackRadioGroupDataAttrs, type MenuOptionState } from '@videojs/core';
import { getStateDataAttrs } from '@videojs/core/dom';
import { isFunction } from '@videojs/utils/predicate';
import type { ReactElement, ReactNode } from 'react';
import { createContext, Fragment, forwardRef, useContext } from 'react';

import type { HTMLProps, UIComponentProps } from '../../utils/types';
import { renderElement } from '../../utils/use-render';
import {
  type AudioTrackOption,
  type AudioTrackOptionsProps,
  type AudioTrackOptionsResult,
  useAudioTrackOptions,
} from '../audio-track';
import { useMenuOptionState } from '../menu/context';
import { MenuRadioGroup } from '../menu/radio-group';
import type { MenuRadioItemProps } from '../menu/radio-item';

export type AudioTrackRadioGroupItemState = AudioTrackOption & {
  /** Whether this option is the currently enabled audio track. */
  checked: boolean;
};

export interface AudioTrackRadioGroupItemProps extends Omit<MenuRadioItemProps, 'ref'> {
  /** Audio track value represented by the option. */
  'data-track': string;
}

export interface AudioTrackRadioGroupRootProps extends AudioTrackOptionsProps {
  children?: ReactNode;
}

export interface AudioTrackRadioGroupOptionsProps extends Omit<
  UIComponentProps<'div', AudioTrackRadioGroupCore.State>,
  'children'
> {
  /** Render one consumer-owned menu radio item for every audio track. */
  renderItem: (props: AudioTrackRadioGroupItemProps, state: AudioTrackRadioGroupItemState) => ReactElement;
}

export type AudioTrackRadioGroupValueProps = UIComponentProps<'span', AudioTrackOptionsResult>;

const AudioTrackRadioGroupContext = createContext<AudioTrackOptionsResult | null | undefined>(undefined);

/** Owns audio-track option state and shares it with an enclosing menu. Does not render a DOM element. */
export function AudioTrackRadioGroupRoot({ children, ...props }: AudioTrackRadioGroupRootProps): ReactNode {
  const audioTrack = useAudioTrackOptions(props);

  useMenuOptionState(toMenuOptionState(audioTrack));

  return <AudioTrackRadioGroupContext.Provider value={audioTrack}>{children}</AudioTrackRadioGroupContext.Provider>;
}

/** Displays the selected audio-track label. */
export const AudioTrackRadioGroupValue = forwardRef<HTMLSpanElement, AudioTrackRadioGroupValueProps>(
  function AudioTrackRadioGroupValue({ render, className, style, ...elementProps }, forwardedRef) {
    const audioTrack = useAudioTrackRadioGroupContext();
    if (!audioTrack) return null;

    return renderElement(
      'span',
      { render, className, style },
      { state: audioTrack, ref: forwardedRef, props: [elementProps, { children: audioTrack.selectedLabel }] }
    );
  }
);

/** Renders menu radio items for the player's available audio tracks. */
export const AudioTrackRadioGroupOptions = forwardRef<HTMLDivElement, AudioTrackRadioGroupOptionsProps>(
  function AudioTrackRadioGroupOptions(componentProps, forwardedRef) {
    const {
      renderItem,
      render,
      className,
      style,
      'aria-label': ariaLabelProp,
      'aria-labelledby': ariaLabelledBy,
      ...elementProps
    } = componentProps;
    const audioTrack = useAudioTrackRadioGroupContext();
    if (!audioTrack) return null;

    const { state, value, options, setValue } = audioTrack;
    const ariaLabel = ariaLabelProp ?? (ariaLabelledBy === undefined ? audioTrack.label : undefined);

    return (
      <MenuRadioGroup
        {...getStateDataAttrs(state, AudioTrackRadioGroupDataAttrs)}
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

function useAudioTrackRadioGroupContext(): AudioTrackOptionsResult | null {
  const audioTrack = useContext(AudioTrackRadioGroupContext);

  if (audioTrack === undefined) {
    throw new Error('AudioTrackRadioGroup parts must be used within AudioTrackRadioGroup.Root');
  }

  return audioTrack;
}

function toMenuOptionState(audioTrack: AudioTrackOptionsResult | null): MenuOptionState {
  return {
    value: audioTrack?.selectedLabel ?? '',
    disabled: audioTrack?.disabled ?? true,
    hidden: audioTrack?.hidden ?? true,
    availability: audioTrack?.state.availability ?? 'unsupported',
  };
}

export namespace AudioTrackRadioGroupRoot {
  export type Props = AudioTrackRadioGroupRootProps;
}

export namespace AudioTrackRadioGroupValue {
  export type Props = AudioTrackRadioGroupValueProps;
  export type State = AudioTrackOptionsResult;
}

export namespace AudioTrackRadioGroupOptions {
  export type Props = AudioTrackRadioGroupOptionsProps;
  export type State = AudioTrackRadioGroupCore.State;
  export type ItemProps = AudioTrackRadioGroupItemProps;
  export type ItemState = AudioTrackRadioGroupItemState;
}
