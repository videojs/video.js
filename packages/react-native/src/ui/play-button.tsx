import { PlayButtonCore, type PlayButtonProps as CorePlayButtonProps, type PlayButtonState } from '@videojs/core';
import { PauseIcon, PlayIcon, RestartIcon } from '@videojs/icons/react-native';

import { selectPlayback } from '../store/selectors';
import { createMediaButton, type MediaButtonProps } from './create-media-button';
import { ICON_COLOR, ICON_SIZE } from './utils/button';

export interface PlayButtonProps extends MediaButtonProps<PlayButtonState>, CorePlayButtonProps {}

/**
 * Toggles playback.
 *
 * @example
 *   ```tsx
 *   <PlayButton />
 *
 *   <PlayButton>{(state) => (state.paused ? <MyPlayIcon /> : <MyPauseIcon />)}</PlayButton>
 *   ```;
 */
export const PlayButton = createMediaButton<PlayButtonCore, PlayButtonProps>({
  displayName: 'PlayButton',
  core: PlayButtonCore,
  selector: selectPlayback,
  action: (core, playback) => core.toggle(playback),
  renderContent: (state) => {
    const Icon = state.ended ? RestartIcon : state.paused ? PlayIcon : PauseIcon;

    return <Icon color={ICON_COLOR} width={ICON_SIZE} height={ICON_SIZE} />;
  },
});

export namespace PlayButton {
  export type Props = PlayButtonProps;
  export type State = PlayButtonState;
}
