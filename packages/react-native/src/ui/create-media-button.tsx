import type { InferComponentState, InferMediaState, MediaButtonComponent } from '@videojs/core';
import type { TextParams } from '@videojs/core/i18n';
import type { Selector } from '@videojs/store';
import { defaults } from '@videojs/utils/object';
import { isFunction, isUndefined } from '@videojs/utils/predicate';
import type { NonNullableObject } from '@videojs/utils/types';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Pressable, type PressableProps } from 'react-native';

import { usePlayer } from '../player/context';
import { type CoreA11yAttrs, toNativeA11yProps } from './utils/accessibility';
import { buttonStyles } from './utils/button';

type AnyButtonCore = Required<MediaButtonComponent>;
type InferCoreProps<Core extends AnyButtonCore> = NonNullable<Parameters<Core['setProps']>[0]>;

/** Core props with their defaults applied, as the core itself sees them. */
export type ResolvedCoreProps<Core extends AnyButtonCore> = NonNullableObject<InferCoreProps<Core>>;

/** Props every media button accepts on top of its core's props. */
export interface MediaButtonProps<State> extends Omit<PressableProps, 'onPress' | 'children' | 'disabled'> {
  /** Replaces the default content, such as the icon, with content derived from the button state. */
  children?: ((state: State) => ReactNode) | undefined;
}

interface MediaButtonConfig<Core extends AnyButtonCore> {
  displayName: string;
  core: { new (): Core; defaultProps: ResolvedCoreProps<Core> };
  selector: Selector<object, InferMediaState<Core> | undefined>;
  action: (core: Core, media: InferMediaState<Core>) => void | Promise<void>;
  /** Default content when the consumer does not pass a `children` function. */
  renderContent: (state: InferComponentState<Core>, props: ResolvedCoreProps<Core>) => ReactNode;
  /** Returns `false` to render `null` (e.g., when the underlying feature is unsupported). */
  isSupported?: (state: InferComponentState<Core>) => boolean;
}

type LabelParamsCore<State> = {
  getLabelParams?: (state: State) => TextParams | undefined;
};

function getLabelParams<Core extends AnyButtonCore>(
  core: Core,
  state: InferComponentState<Core>
): TextParams | undefined {
  // SAFETY: only reads an optional method; cores without `getLabelParams` yield `undefined`.
  return (core as LabelParamsCore<InferComponentState<Core>>).getLabelParams?.(state);
}

/**
 * Creates a media button component from a core class and config.
 *
 * The react-native counterpart of the web `createMediaButton`: the core is fed the selected media slice during render
 * and its state read straight back, so the store's selector equality drives re-renders. Web-only concerns (data
 * attributes, hotkeys, tooltips, CSS vars) have no equivalent here.
 */
export function createMediaButton<
  Core extends AnyButtonCore,
  Props extends MediaButtonProps<InferComponentState<Core>>,
>(config: MediaButtonConfig<Core>): (props: Props) => ReactNode {
  const { displayName, core: CoreClass, selector, action, renderContent, isSupported } = config;

  // Props that exist in the core's defaultProps are routed to setProps; the rest go to the Pressable.
  const corePropKeys = new Set(Object.keys(CoreClass.defaultProps));

  function MediaButton(componentProps: Props): ReactNode {
    type State = InferComponentState<Core>;

    const { children, style, ...rest } = componentProps;

    const coreProps: Record<string, unknown> = {};
    const pressableProps: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(rest)) {
      if (corePropKeys.has(key)) {
        coreProps[key] = value;
      } else {
        pressableProps[key] = value;
      }
    }

    const media = usePlayer(selector);
    const [core] = useState(() => new CoreClass());

    // The feature is not composed into this store, so there is nothing to control.
    if (isUndefined(media)) return null;

    core.setProps(coreProps);
    core.setMedia(media);

    // SAFETY: `State` is defined as the return type of `core.getState`.
    const state = core.getState() as State;
    if (isSupported && !isSupported(state)) return null;

    // SAFETY: `coreProps` holds only keys from the core's `defaultProps`, with the consumer's values for them.
    const resolvedProps = defaults(coreProps as Partial<ResolvedCoreProps<Core>>, CoreClass.defaultProps);
    const disabled = !!coreProps.disabled;
    // SAFETY: button cores' `getAttrs` emit a subset of the ARIA attributes `CoreA11yAttrs` describes.
    const a11y = toNativeA11yProps(core.getAttrs(state) as CoreA11yAttrs, { label: getLabelParams(core, state) });

    // Consumer props spread first so the core-derived accessibility, disabled, and press handling always win.
    return (
      <Pressable
        {...pressableProps}
        role="button"
        {...a11y}
        disabled={disabled}
        onPress={() => {
          // Absorb rejections at this UI boundary; `onPress` callers never await.
          Promise.resolve(action(core, media)).catch((error) => {
            if (__DEV__) console.error(`[${displayName}]`, error);
          });
        }}
        style={(pressState) => [
          buttonStyles.button,
          pressState.pressed && buttonStyles.pressed,
          disabled && buttonStyles.disabled,
          isFunction(style) ? style(pressState) : style,
        ]}
      >
        {isFunction(children) ? children(state) : renderContent(state, resolvedProps)}
      </Pressable>
    );
  }

  if (__DEV__) MediaButton.displayName = displayName;

  return MediaButton;
}
