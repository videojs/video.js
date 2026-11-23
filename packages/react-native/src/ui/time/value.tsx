import { TimeCore, type TimeProps, type TimeState, type TimeType } from '@videojs/core';
import { translateText } from '@videojs/core/i18n';
import { durationSuffixText, elapsedSuffixText, remainingSuffixText } from '@videojs/core/i18n/text/time';
import { isFunction, isUndefined } from '@videojs/utils/predicate';
import { formatTimeAsPhrase } from '@videojs/utils/time';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { type GestureResponderEvent, Text, type TextProps } from 'react-native';

import { usePlayer } from '../../player/context';
import { selectBuffer, selectTime } from '../../store/selectors';
import { toNativeA11yProps } from '../utils/accessibility';
import { timeStyles } from './styles';

export interface ValueProps extends Omit<TextProps, 'children'>, TimeProps {
  /** Replaces the default content, the signed time text, with content derived from the time state. */
  children?: ((state: TimeState) => ReactNode) | undefined;
}

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
 * <Time.Value />
 * <Time.Value type="duration" />
 * <Time.Value type="remaining" negativeSign="−" />
 * <Time.Value>{(state) => <MyTime seconds={state.seconds} />}</Time.Value>
 * ```
 *
 * Compose values with `Time.Group` and `Time.Separator` for a `current / duration` display.
 */
export function Value({
  type,
  negativeSign,
  label,
  toggle = false,
  onPress,
  style,
  children,
  ...props
}: ValueProps): ReactNode {
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
    // Consumer props spread first so the core-derived accessibility props always win.
    <Text
      {...props}
      {...a11y}
      accessibilityHint={description ? translateText(description) : undefined}
      onPress={toggle ? handlePress : onPress}
      style={[timeStyles.text, style]}
    >
      {isFunction(children) ? (
        children(state)
      ) : (
        <>
          {sign}
          {state.text}
        </>
      )}
    </Text>
  );
}

export namespace Value {
  export type Props = ValueProps;
  export type State = TimeState;
}
