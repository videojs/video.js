import { Box, type Props } from 'vjsc/components';

import { StatusAnnouncer } from '../../../../components/behaviors/status-announcer';
import { SeekIndicator } from '../../../../components/display/seek-indicator';
import { PlaybackStatusIndicator, StatusIndicator } from '../../../../components/display/status-indicator';
import { VolumeIndicator } from '../../../../components/display/volume-indicator';
import styles from '../../display/status-indicators.styles';

export function VideoStatusIndicators({ className, ...props }: Props = {}) {
  return (
    <>
      <StatusAnnouncer />
      <Box className={[styles.root, className]} {...props}>
        <VolumeIndicator />
        <StatusIndicator />
        <SeekIndicator />
        <PlaybackStatusIndicator />
      </Box>
    </>
  );
}
