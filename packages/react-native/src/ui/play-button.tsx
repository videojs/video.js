import { PlayButtonCore } from '@videojs/core';
import { PauseIcon, PlayIcon, RestartIcon } from '@videojs/icons/react-native';
import { isUndefined } from '@videojs/utils/predicate';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Pressable, type PressableProps } from 'react-native';

import { usePlayer } from '../player/context';
import { selectPlayback } from '../store/selectors';
import { toNativeA11yProps } from './utils/accessibility';
import { buttonStyles, ICON_COLOR, ICON_SIZE } from './utils/button';

export interface PlayButtonProps extends Omit<PressableProps, 'onPress' | 'children'> {
  disabled?: boolean | undefined;
}

/**
 * Toggles playback.
 *
 * Binds `PlayButtonCore` — the same framework-agnostic core the web button uses — to the store during render, which is
 * the pattern `createMediaButton` follows: feed the core the selected slice, read the projected state straight back,
 * and let the store's selector equality drive re-renders. The core holds no subscription of its own.
 */
export function PlayButton({ disabled, style, ...props }: PlayButtonProps): ReactNode {
  const playback = usePlayer(selectPlayback);
  const [core] = useState(() => new PlayButtonCore());

  // The feature is not composed into this store, so there is nothing to control.
  if (isUndefined(playback)) return null;

  core.setProps({ disabled });
  core.setMedia(playback);

  const state = core.getState();
  const Icon = state.ended ? RestartIcon : state.paused ? PlayIcon : PauseIcon;

  return (
    <Pressable
      role="button"
      {...toNativeA11yProps(core.getAttrs(state))}
      disabled={disabled}
      onPress={() => core.toggle(playback)}
      style={(pressState) => [
        buttonStyles.button,
        pressState.pressed && buttonStyles.pressed,
        disabled && buttonStyles.disabled,
        typeof style === 'function' ? style(pressState) : style,
      ]}
      {...props}
    >
      <Icon color={ICON_COLOR} width={ICON_SIZE} height={ICON_SIZE} />
    </Pressable>
  );
}

export namespace PlayButton {
  export type Props = PlayButtonProps;
}
