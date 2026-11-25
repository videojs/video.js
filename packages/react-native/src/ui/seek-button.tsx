import { SeekButtonCore, type SeekButtonProps as CoreSeekButtonProps, type SeekButtonState } from '@videojs/core';
import { SeekIcon } from '@videojs/icons/react-native';
import { StyleSheet, Text, View } from 'react-native';

import { selectTime } from '../store/selectors';
import { createMediaButton, type MediaButtonProps } from './create-media-button';
import { ICON_COLOR, ICON_SIZE } from './utils/button';

export interface SeekButtonProps extends MediaButtonProps<SeekButtonState>, CoreSeekButtonProps {}

/**
 * Seeks forward or backward by a fixed number of seconds.
 *
 * The sign of `seconds` picks the direction, as on web; a backward button mirrors the icon. The seconds value sits over
 * the icon the way the web skin draws it.
 *
 * @example
 *   ```tsx
 *   <SeekButton seconds={-10} />
 *   ```;
 */
export const SeekButton = createMediaButton<SeekButtonCore, SeekButtonProps>({
  displayName: 'SeekButton',
  core: SeekButtonCore,
  selector: selectTime,
  action: (core, time) => core.seek(time),
  renderContent: (state, { seconds }) => (
    <View style={styles.content}>
      <SeekIcon
        color={ICON_COLOR}
        width={ICON_SIZE}
        height={ICON_SIZE}
        style={state.direction === 'backward' ? styles.backwardIcon : undefined}
      />
      <Text style={styles.label}>{Math.abs(seconds)}</Text>
    </View>
  ),
});

export namespace SeekButton {
  export type Props = SeekButtonProps;
  export type State = SeekButtonState;
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
