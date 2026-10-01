'use client';

import {
  AudioTrackRadioGroupCore,
  type AudioTrackRadioGroupOption,
  type AudioTrackRadioGroupProps,
  type AudioTrackRadioGroupState,
} from '@videojs/core';
import { selectAudioTrack } from '@videojs/core/dom';

import { createRadioOptionsHook, type TranslatedRadioOption } from '../hooks/create-radio-options-hook';

export interface AudioTrackOptionsProps extends AudioTrackRadioGroupProps {}

export type AudioTrackOption = TranslatedRadioOption<AudioTrackRadioGroupOption>;

export interface AudioTrackOptionsResult {
  state: AudioTrackRadioGroupState;
  label: string;
  value: string;
  selectedLabel: string;
  options: AudioTrackOption[];
  disabled: boolean;
  hidden: boolean;
  setValue: (value: string) => void;
}

const useAudioTrackRadioOptions = createRadioOptionsHook({
  name: 'useAudioTrackOptions',
  feature: 'audioTrack',
  selector: selectAudioTrack,
  createCore: () => new AudioTrackRadioGroupCore(),
});

/**
 * Create audio track menu options from the player audio track state. Returns `null` when the audio track feature is not
 * configured.
 *
 * @param props - Optional `label`, `formatTrack`, and `disabled` overrides.
 */
export function useAudioTrackOptions(props?: AudioTrackOptionsProps): AudioTrackOptionsResult | null {
  'use no memo';

  return useAudioTrackRadioOptions(props);
}

export namespace useAudioTrackOptions {
  export type Props = AudioTrackOptionsProps;
  export type Result = AudioTrackOptionsResult;
  export type Option = AudioTrackOption;
}
