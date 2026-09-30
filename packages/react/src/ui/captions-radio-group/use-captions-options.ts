'use client';

import { CaptionsRadioGroupCore, type CaptionsRadioGroupOption } from '@videojs/core';
import { selectTextTrack } from '@videojs/core/dom';

import { createRadioOptionsHook, type TranslatedRadioOption } from '../hooks/create-radio-options-hook';

export interface CaptionsOptionsProps extends CaptionsRadioGroupCore.Props {}

export type CaptionsOption = TranslatedRadioOption<CaptionsRadioGroupOption>;

export interface CaptionsOptionsResult {
  state: CaptionsRadioGroupCore.State;
  label: string;
  value: string;
  selectedLabel: string;
  options: CaptionsOption[];
  disabled: boolean;
  hidden: boolean;
  showMenu: boolean;
  setValue: (value: string) => void;
}

const useCaptionsRadioOptions = createRadioOptionsHook({
  name: 'useCaptionsOptions',
  feature: 'textTrack',
  selector: selectTextTrack,
  createCore: () => new CaptionsRadioGroupCore(),
});

/**
 * Create captions menu options (including an `Off` option) from the player text track state. Returns `null` when the
 * text tracks feature is not configured.
 *
 * @param props - Optional `label`, `formatTrack`, and `disabled` overrides.
 */
export function useCaptionsOptions(props?: CaptionsOptionsProps): CaptionsOptionsResult | null {
  'use no memo';

  const result = useCaptionsRadioOptions(props);
  if (!result) return null;

  return { ...result, showMenu: result.state.options.length > 2 };
}

export namespace useCaptionsOptions {
  export type Props = CaptionsOptionsProps;
  export type Result = CaptionsOptionsResult;
  export type Option = CaptionsOption;
}
