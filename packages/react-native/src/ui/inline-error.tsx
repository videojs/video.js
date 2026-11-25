import { InlineErrorCore } from '@videojs/core';
import { translateText } from '@videojs/core/i18n';
import { ErrorIcon } from '@videojs/icons/react-native';
import { isUndefined } from '@videojs/utils/predicate';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Animated, StyleSheet, Text, type ViewProps } from 'react-native';

import { usePlayer } from '../player/context';
import { selectError } from '../store/selectors';
import { ICON_COLOR, ICON_SIZE } from './utils/button';
import { useFadePresence } from './utils/use-fade-presence';

export interface InlineErrorProps extends Omit<ViewProps, 'children'> {}

/**
 * Shows the playback error over the media: an icon and the error message, without a surface or a dismiss control.
 *
 * Stays until the error clears, such as when a new source loads. `InlineErrorCore` keeps the last message so the
 * fade-out does not empty the text. Announced assertively when it appears.
 */
export function InlineError({ style, ...props }: InlineErrorProps): ReactNode {
  const error = usePlayer(selectError);
  const [core] = useState(() => new InlineErrorCore());

  if (!isUndefined(error)) core.setMedia(error);

  const { visible } = core.getState();
  const { opacity, rendered } = useFadePresence(visible);
  if (isUndefined(error) || !rendered) return null;

  return (
    <Animated.View
      pointerEvents="none"
      aria-live="assertive"
      accessibilityLiveRegion="assertive"
      style={[styles.root, { opacity }, style]}
      {...props}
    >
      <ErrorIcon color={ICON_COLOR} width={ICON_SIZE} height={ICON_SIZE} aria-hidden />
      <Text style={styles.description}>{translateText(core.getDescription())}</Text>
    </Animated.View>
  );
}

export namespace InlineError {
  export type Props = InlineErrorProps;
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  description: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 360,
  },
});
