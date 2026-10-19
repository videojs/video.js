import { Box, type Props } from 'vjsc/components';

import { StatusAnnouncer } from '../../../../components/behaviors/status-announcer';
import { SeekIndicator } from '../../../../components/display/seek-indicator';
import { PlaybackStatusIndicator, StatusIndicator } from '../../../../components/display/status-indicator';
import { VolumeIndicator } from '../../../../components/display/volume-indicator';
import styles from '../../display/status-indicators.styles';

/** Pass `playback={false}` to skip play/pause feedback in skins with centre playback controls. */
export function VideoStatusIndicators({ className, playback = true, ...props }: Props<{ playback?: boolean }> = {}) {
  return (
    <>
      <StatusAnnouncer />
      <Box className={[styles.root, className]} {...props}>
        <VolumeIndicator />
        <StatusIndicator />
        <SeekIndicator />
        {playback && <PlaybackStatusIndicator />}
      </Box>
    </>
  );
}
