import type { StatusIndicatorProps as CoreProps } from '@videojs/core';
import * as $ from '@videojs/core/vjsc';
import {
  CaptionsOffIcon,
  CaptionsOnIcon,
  FullscreenEnterIcon,
  FullscreenExitIcon,
  PauseIcon,
  PipEnterIcon,
  PipExitIcon,
  PlayIcon,
} from '@videojs/icons/vjsc';
import { Box, type Props } from 'vjsc/components';

import type { SkinComponentDescription } from '../../meta';
import indicatorStyles from '../../styles/display/indicator.styles';
import playbackStyles from '../../styles/display/playback-status-indicator.styles';
import styles from '../../styles/display/status-indicator.styles';

const TOP_STATUS_ACTIONS = ['toggleSubtitles', 'toggleFullscreen', 'togglePictureInPicture'] as const;

const PLAYBACK_STATUS_ACTIONS = ['togglePaused'] as const;

export function StatusIndicator({ className, ...props }: Props<Omit<CoreProps, 'actions'>> = {}) {
  return (
    <$.StatusIndicator.Root
      actions={TOP_STATUS_ACTIONS}
      className={[indicatorStyles.root, styles.root, className]}
      {...props}
    >
      <Box className={[indicatorStyles.content, styles.content]}>
        <CaptionsOnIcon className={styles.captionsOnIcon} />
        <CaptionsOffIcon className={styles.captionsOffIcon} />
        <FullscreenEnterIcon className={styles.fullscreenEnterIcon} />
        <FullscreenExitIcon className={styles.fullscreenExitIcon} />
        <PipEnterIcon className={styles.pipEnterIcon} />
        <PipExitIcon className={styles.pipExitIcon} />
        <$.StatusIndicator.Value className={styles.value} />
      </Box>
    </$.StatusIndicator.Root>
  );
}

export function PlaybackStatusIndicator({ className, ...props }: Props<Omit<CoreProps, 'actions'>> = {}) {
  return (
    <$.StatusIndicator.Root actions={PLAYBACK_STATUS_ACTIONS} className={[playbackStyles.root, className]} {...props}>
      <PlayIcon className={playbackStyles.playIcon} />
      <PauseIcon className={playbackStyles.pauseIcon} />
    </$.StatusIndicator.Root>
  );
}

export const meta = {
  title: 'Status Indicator',
  description: 'Visual feedback for captions, fullscreen, picture-in-picture, and playback actions.',
} as const satisfies SkinComponentDescription;
