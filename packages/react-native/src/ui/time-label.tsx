import { TimeCore, type TimeProps, type TimeType } from '@videojs/core';
import { translateText } from '@videojs/core/i18n';
import { durationSuffixText, elapsedSuffixText, remainingSuffixText } from '@videojs/core/i18n/text/time';
import { isUndefined } from '@videojs/utils/predicate';
import { formatTimeAsPhrase } from '@videojs/utils/time';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { type GestureResponderEvent, StyleSheet, Text, type TextProps } from 'react-native';

import { usePlayer } from '../player/context';
import { selectBuffer, selectTime } from '../store/selectors';
import { toNativeA11yProps } from './utils/accessibility';

export interface TimeLabelProps extends Omit<TextProps, 'children'>, TimeProps {}

const SUFFIX_TEXT = {
  current: elapsedSuffixText,
  duration: durationSuffixText,
  remaining: remainingSuffixText,
} as const;

const EMPTY_SEEKABLE = { seekable: [] };

/**
 * Shows a formatted time value: current, duration, or remaining.
 *
 * With `toggle`, pressing flips between the given `type` and remaining time, as on web. The toggle resets when `type`
 * or `toggle` changes.
 *
 * ```tsx
 * <TimeLabel />
 * <TimeLabel type="duration" />
 * <TimeLabel type="remaining" negativeSign="−" />
 * ```
 */
export function TimeLabel({
  type,
  negativeSign,
  label,
  toggle = false,
  onPress,
  style,
  ...props
}: TimeLabelProps): ReactNode {
  const time = usePlayer(selectTime);
  const buffer = usePlayer(selectBuffer);
  const [core] = useState(() => new TimeCore());

  const defaultType = type ?? TimeCore.defaultProps.type;
  const [activeType, setActiveType] = useState<TimeType>(defaultType);

  // Revert to the default type whenever it or `toggle` changes.
  // oxlint-disable-next-line react/exhaustive-deps
  useEffect(() => {
    setActiveType(defaultType);
  }, [defaultType, toggle]);

  if (isUndefined(time)) return null;

  core.setProps({ type: activeType, negativeSign, label, toggle });
  core.setMedia({ ...time, seekable: (buffer ?? EMPTY_SEEKABLE).seekable });

  const state = core.getState();
  const labelParams = core.getLabelParams(state)
    ? { duration: translateText(SUFFIX_TEXT[state.type], { duration: formatTimeAsPhrase(Math.abs(state.seconds)) }) }
    : undefined;
  const a11y = toNativeA11yProps(core.getAttrs(state, defaultType), { label: labelParams });

  // A native accessibility label replaces the spoken text, so the core's bare "Current time" would hide the value.
  // Custom labels and the toggle's "Show …, {duration}." labels are spoken as given.
  if (!toggle && !label && !state.unavailable) a11y['aria-label'] = `${a11y['aria-label']}, ${state.phrase}`;

  const description = core.getDescription(state, defaultType);
  const sign = state.negative ? (negativeSign ?? TimeCore.defaultProps.negativeSign) : '';

  const handlePress = (event: GestureResponderEvent) => {
    onPress?.(event);

    if (state.disabled) return;

    setActiveType((value) => {
      if (defaultType === 'current') return value === 'remaining' ? 'current' : 'remaining';

      return value === 'duration' ? 'remaining' : 'duration';
    });
  };

  return (
    <Text
      {...a11y}
      accessibilityHint={description ? translateText(description) : undefined}
      onPress={toggle ? handlePress : onPress}
      style={[styles.time, style]}
      {...props}
    >
      {sign}
      {state.text}
    </Text>
  );
}

export namespace TimeLabel {
  export type Props = TimeLabelProps;
}

const styles = StyleSheet.create({
  time: {
    color: 'white',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
});
