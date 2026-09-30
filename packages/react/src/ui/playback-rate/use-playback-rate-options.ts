'use client';

import {
  type PlaybackRateRadioGroupCore,
  PlaybackRateRadioGroupCore as PlaybackRateRadioGroupCoreClass,
  type PlaybackRateRadioGroupOption,
} from '@videojs/core';
import { selectPlaybackRate } from '@videojs/core/dom';
import { useCallback } from 'react';

import { createRadioOptionsHook, type TranslatedRadioOption } from '../hooks/create-radio-options-hook';

export interface PlaybackRateOptionsProps extends PlaybackRateRadioGroupCore.Props {}

export type PlaybackRateOption = TranslatedRadioOption<PlaybackRateRadioGroupOption>;

export interface PlaybackRateOptionsResult {
  state: PlaybackRateRadioGroupCore.State;
  label: string;
  rate: number;
  value: string;
  selectedLabel: string;
  options: PlaybackRateOption[];
  disabled: boolean;
  hidden: boolean;
  setRate: (rate: number) => void;
  setValue: (value: string) => void;
}

const usePlaybackRateRadioOptions = createRadioOptionsHook({
  name: 'usePlaybackRateOptions',
  feature: 'playbackRate',
  selector: selectPlaybackRate,
  createCore: () => new PlaybackRateRadioGroupCoreClass(),
});

/**
 * Create playback rate menu options from the player playback rate state. Returns `null` when the playback rate feature
 * is not configured.
 *
 * @param props - Optional `label`, `formatRate`, and `disabled` overrides.
 */
export function usePlaybackRateOptions(props?: PlaybackRateOptionsProps): PlaybackRateOptionsResult | null {
  const result = usePlaybackRateRadioOptions(props);
  const setRate = useCallback((rate: number) => result?.setValue(String(rate)), [result?.setValue]);

  if (!result) return null;

  return {
    ...result,
    rate: result.state.rate,
    setRate,
  };
}

export namespace usePlaybackRateOptions {
  export type Props = PlaybackRateOptionsProps;
  export type Result = PlaybackRateOptionsResult;
  export type Option = PlaybackRateOption;
}
