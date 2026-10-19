import { PlayButtonCore } from '@videojs/core';
import { isUndefined } from '@videojs/utils/predicate';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Pressable, type PressableProps, StyleSheet, Text } from 'react-native';

import { usePlayer } from '../player/context';
import { selectNativePlayback } from '../store/playback';

export interface PlayButtonProps extends Omit<PressableProps, 'onPress' | 'children'> {
  disabled?: boolean | undefined;
}

/**
 * Toggles playback.
 *
 * Binds `PlayButtonCore` — the same framework-agnostic core the web button uses — to the store during render, which is
 * the pattern `createMediaButton` follows: feed the core the selected slice, read the projected state straight back,
 * and let the store's selector equality drive re-renders. The core holds no subscription of its own.
 *
 * Two things the web adapter does are deliberately dropped. `core.getAttrs()` emits `aria-*`, which means nothing in
 * react-native, so accessibility props are mapped by hand. And `core.getLabel()` returns an i18n `Text` token needing
 * `translateText`; the label here is derived from `paused` instead, leaving i18n for later.
 */
export function PlayButton({ disabled, style, ...props }: PlayButtonProps): ReactNode {
  const playback = usePlayer(selectNativePlayback);
  const [core] = useState(() => new PlayButtonCore());

  // The feature is not composed into this store, so there is nothing to control.
  if (isUndefined(playback)) return null;

  core.setProps({ disabled });
  core.setMedia(playback);

  const state = core.getState();
  const label = state.paused ? 'Play' : 'Pause';

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={() => core.toggle(playback)}
      style={[styles.button, style as object]}
      {...props}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

export namespace PlayButton {
  export type Props = PlayButtonProps;
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  label: {
    color: 'white',
    fontWeight: '600',
  },
});
