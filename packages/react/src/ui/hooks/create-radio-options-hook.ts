'use client';

import type { RadioOption, RadioOptionsState } from '@videojs/core';
import { logMissingFeature } from '@videojs/core/dom';
import { type Text, type TextParams, translateText } from '@videojs/core/i18n';
import type { UnknownState } from '@videojs/store';
import { useCallback, useState } from 'react';

import { useTranslator } from '../../i18n/context';
import { usePlayer } from '../../player/context';

interface RadioOptionsCore<Props, Media, State extends RadioOptionsState> {
  setProps(props: Props): void;
  setMedia(media: Media): void;
  getState(): State;
  getLabel(state: State): Text | string;
  getLabelParams?(state: State): TextParams | undefined;
  selectValue(media: Media, value: string): void;
}

interface RadioOptionsHookConfig<Props, Media, State extends RadioOptionsState> {
  name: string;
  feature: string;
  selector: ((state: UnknownState) => Media | null) & { displayName?: string | undefined };
  createCore: () => RadioOptionsCore<Props, Media, State>;
}

type StateOption<State extends RadioOptionsState> = State extends RadioOptionsState<infer Option> ? Option : never;

export type TranslatedRadioOption<Option extends RadioOption> = Omit<Option, 'label' | 'labelParams' | 'disabled'> & {
  label: string;
  disabled: boolean;
};

export interface RadioOptionsHookResult<Option extends RadioOption, State extends RadioOptionsState> {
  state: State;
  label: string;
  value: string;
  selectedLabel: string;
  options: TranslatedRadioOption<Option>[];
  disabled: boolean;
  hidden: boolean;
  setValue: (value: string) => void;
}

/** Creates framework adapter mechanics shared by media-backed radio option hooks. */
export function createRadioOptionsHook<Props, Media, State extends RadioOptionsState>({
  name,
  feature,
  selector,
  createCore,
}: RadioOptionsHookConfig<Props, Media, State>): (
  props?: Props
) => RadioOptionsHookResult<StateOption<State>, State> | null {
  return function useRadioOptions(props?: Props): RadioOptionsHookResult<StateOption<State>, State> | null {
    'use no memo';

    const media = usePlayer(selector);
    const t = useTranslator();
    const [core] = useState(createCore);

    core.setProps(props ?? ({} as Props));

    const setValue = useCallback((value: string) => core.selectValue(media!, value), [core, media]);

    if (!media) {
      if (__DEV__) logMissingFeature(name, selector.displayName ?? feature);

      return null;
    }

    core.setMedia(media);
    const state = core.getState();
    const options = state.options.map((option) => {
      const { label, labelParams, disabled, ...rest } = option;

      return {
        ...rest,
        label: translateText(label, t, labelParams),
        disabled: state.disabled || disabled,
      } as TranslatedRadioOption<StateOption<State>>;
    });

    return {
      state,
      label: translateText(core.getLabel(state), t, core.getLabelParams?.(state)),
      value: state.value,
      selectedLabel: options.find((option) => option.value === state.value)?.label ?? '',
      options,
      disabled: state.disabled,
      hidden: state.hidden,
      setValue,
    };
  };
}
