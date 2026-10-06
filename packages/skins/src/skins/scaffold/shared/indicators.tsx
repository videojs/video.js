import * as $ from '@videojs/core/vjsc';
import {
  CaptionsOffIcon,
  CaptionsOnIcon,
  FullscreenEnterIcon,
  FullscreenExitIcon,
  PipEnterIcon,
  PipExitIcon,
  PlayIcon,
  PauseIcon,
  VolumeHighIcon,
  VolumeLowIcon,
  VolumeOffIcon,
} from '@videojs/icons/vjsc';
import { Box, type VjscNode } from 'vjsc/components';

import indicatorStyles from './indicator.styles';
import statusIndicatorStyles from './status-indicator.styles';
import volumeIndicatorStyles from './volume-indicator.styles';

const PLAYBACK_ACTIONS = ['togglePaused'] as const;

const STATUS_ACTIONS = ['toggleSubtitles', 'toggleFullscreen', 'togglePictureInPicture'] as const;

/**
 * Transient feedback stacks above the title and below the controls, and never takes pointer input. The whole group is
 * hidden from assistive technology: `StatusAnnouncer` already speaks these same events, so exposing both would announce
 * every one of them twice.
 */
export function Indicators({ children }: { children?: VjscNode } = {}) {
  return (
    <Box aria-hidden="true" className={indicatorStyles.group}>
      <VolumeIndicator />
      <StatusIndicator />
      <PlaybackIndicator />
      {children}
    </Box>
  );
}

function StatusIndicator() {
  return (
    <$.StatusIndicator.Root actions={STATUS_ACTIONS} className={[indicatorStyles.root, statusIndicatorStyles.root]}>
      <CaptionsOnIcon className={[statusIndicatorStyles.icon, statusIndicatorStyles.captionsOnIcon]} />
      <CaptionsOffIcon className={[statusIndicatorStyles.icon, statusIndicatorStyles.captionsOffIcon]} />
      <FullscreenEnterIcon className={[statusIndicatorStyles.icon, statusIndicatorStyles.fullscreenEnterIcon]} />
      <FullscreenExitIcon className={[statusIndicatorStyles.icon, statusIndicatorStyles.fullscreenExitIcon]} />
      <PipEnterIcon className={[statusIndicatorStyles.icon, statusIndicatorStyles.pipEnterIcon]} />
      <PipExitIcon className={[statusIndicatorStyles.icon, statusIndicatorStyles.pipExitIcon]} />
      <$.StatusIndicator.Value />
    </$.StatusIndicator.Root>
  );
}

function VolumeIndicator() {
  return (
    <$.VolumeIndicator.Root className={[indicatorStyles.root, volumeIndicatorStyles.root]}>
      <$.VolumeIndicator.Fill className={volumeIndicatorStyles.fill}>
        <VolumeHighIcon className={[volumeIndicatorStyles.icon, volumeIndicatorStyles.highIcon]} />
        <VolumeLowIcon className={[volumeIndicatorStyles.icon, volumeIndicatorStyles.lowIcon]} />
        <VolumeOffIcon className={[volumeIndicatorStyles.icon, volumeIndicatorStyles.offIcon]} />
        <$.VolumeIndicator.Value className={volumeIndicatorStyles.value} />
      </$.VolumeIndicator.Fill>
    </$.VolumeIndicator.Root>
  );
}

function PlaybackIndicator() {
  return (
    <$.StatusIndicator.Root
      actions={PLAYBACK_ACTIONS}
      className={[indicatorStyles.root, statusIndicatorStyles.playback]}
    >
      <PlayIcon className={[statusIndicatorStyles.icon, statusIndicatorStyles.playIcon]} />
      <PauseIcon className={[statusIndicatorStyles.icon, statusIndicatorStyles.pauseIcon]} />
    </$.StatusIndicator.Root>
  );
}
