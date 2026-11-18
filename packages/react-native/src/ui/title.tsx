import { TitleCore } from '@videojs/core';
import { isUndefined } from '@videojs/utils/predicate';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { usePlayer } from '../player/context';
import { selectMetadata } from '../store/selectors';

export interface TitleProps extends Omit<TextProps, 'children'> {}

/**
 * Shows the content title, from the player's `title` prop or the media's metadata.
 *
 * Renders nothing without a title. The core's `visible` (tracking controls visibility) is not read: there is no
 * controls feature in react-native yet, so the chrome — and the title with it — is always shown.
 */
export function Title({ style, ...props }: TitleProps): ReactNode {
  const metadata = usePlayer(selectMetadata);
  const [core] = useState(() => new TitleCore());

  if (isUndefined(metadata)) return null;

  const state = core.getState(metadata);
  if (state.hidden) return null;

  return (
    <Text numberOfLines={1} role="heading" style={[styles.title, style]} {...props}>
      {state.title}
    </Text>
  );
}

export namespace Title {
  export type Props = TitleProps;
}

const styles = StyleSheet.create({
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
