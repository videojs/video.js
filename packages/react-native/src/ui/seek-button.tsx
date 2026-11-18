import { SeekButtonCore } from '@videojs/core';
import { SeekIcon } from '@videojs/icons/react-native';
import { isUndefined } from '@videojs/utils/predicate';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Pressable, type PressableProps, StyleSheet, Text, View } from 'react-native';

import { usePlayer } from '../player/context';
import { selectTime } from '../store/selectors';
import { toNativeA11yProps } from './utils/accessibility';
import { buttonStyles, ICON_COLOR, ICON_SIZE } from './utils/button';

export interface SeekButtonProps extends Omit<PressableProps, 'onPress' | 'children'> {
  /** Seconds to seek. Positive seeks forward, negative backward. Defaults to the core's `30`. */
  seconds?: number | undefined;
  disabled?: boolean | undefined;
}

/**
 * Seeks forward or backward by a fixed number of seconds.
 *
 * The sign of `seconds` picks the direction, as on web; a backward button mirrors the icon. The seconds value sits over
 * the icon the way the web skin draws it.
 */
export function SeekButton({ seconds, disabled, style, ...props }: SeekButtonProps): ReactNode {
  const time = usePlayer(selectTime);
  const [core] = useState(() => new SeekButtonCore());

  if (isUndefined(time)) return null;

  core.setProps({ seconds, disabled });
  core.setMedia(time);

  const state = core.getState();
  const backward = state.direction === 'backward';
  const a11y = toNativeA11yProps(core.getAttrs(state), { label: core.getLabelParams(state) });

  return (
    <Pressable
      role="button"
      {...a11y}
      disabled={disabled}
      onPress={() => core.seek(time)}
      style={(pressState) => [
        buttonStyles.button,
        pressState.pressed && buttonStyles.pressed,
        disabled && buttonStyles.disabled,
        typeof style === 'function' ? style(pressState) : style,
      ]}
      {...props}
    >
      <View style={styles.content}>
        <SeekIcon
          color={ICON_COLOR}
          width={ICON_SIZE}
          height={ICON_SIZE}
          style={backward ? styles.backwardIcon : undefined}
        />
        <Text style={styles.label}>{Math.abs(seconds ?? SeekButtonCore.defaultProps.seconds)}</Text>
      </View>
    </Pressable>
  );
}

export namespace SeekButton {
  export type Props = SeekButtonProps;
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backwardIcon: {
    transform: [{ scaleX: -1 }],
  },
  label: {
    position: 'absolute',
    color: ICON_COLOR,
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
