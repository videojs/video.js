'use client';

import {
  QualityRadioGroupCore,
  type QualityRadioGroupOption,
  type QualityRadioGroupProps,
  type QualityRadioGroupState,
} from '@videojs/core';
import { selectQuality } from '@videojs/core/dom';

import { createRadioOptionsHook, type TranslatedRadioOption } from '../hooks/create-radio-options-hook';

export interface QualityOptionsProps extends QualityRadioGroupProps {}

export type QualityOption = TranslatedRadioOption<QualityRadioGroupOption>;

export interface QualityOptionsResult {
  state: QualityRadioGroupState;
  label: string;
  value: string;
  selectedLabel: string;
  options: QualityOption[];
  disabled: boolean;
  hidden: boolean;
  setValue: (value: string) => void;
}

const useQualityRadioOptions = createRadioOptionsHook({
  name: 'useQualityOptions',
  feature: 'quality',
  selector: selectQuality,
  createCore: () => new QualityRadioGroupCore(),
});

/**
 * Create quality menu options (including an `Auto` option) from the player video rendition state. Returns `null` when
 * the quality feature is not configured.
 *
 * @param props - Optional `label`, `formatRendition`, and `disabled` overrides.
 */
export function useQualityOptions(props?: QualityOptionsProps): QualityOptionsResult | null {
  'use no memo';

  return useQualityRadioOptions(props);
}

export namespace useQualityOptions {
  export type Props = QualityOptionsProps;
  export type Result = QualityOptionsResult;
  export type Option = QualityOption;
}
