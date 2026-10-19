import { Box, type Props } from 'vjsc/components';

import { StatusAnnouncer } from '../../../../components/behaviors/status-announcer';
import { PlaybackStatusIndicator, StatusIndicator } from '../../../../components/display/status-indicator';
import { VolumeIndicator } from '../../../../components/display/volume-indicator';
import styles from '../../display/status-indicators.styles';

export function LiveVideoStatusIndicators({ className, ...props }: Props = {}) {
  return (
    <>
      <StatusAnnouncer />
      <Box className={[styles.root, className]} {...props}>
        <VolumeIndicator />
        <StatusIndicator />
        <PlaybackStatusIndicator />
      </Box>
    </>
  );
}
