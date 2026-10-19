import { Box, type Props } from 'vjsc/components';

import { StatusAnnouncer } from '../../../../components/behaviors/status-announcer';
import { PlaybackStatusIndicator, StatusIndicator } from '../../../../components/display/status-indicator';
import { VolumeIndicator } from '../../../../components/display/volume-indicator';
import styles from '../../display/status-indicators.styles';

/** Pass `playback={false}` to skip play/pause feedback in skins with centre playback controls. */
export function LiveVideoStatusIndicators({
  className,
  playback = true,
  ...props
}: Props<{ playback?: boolean }> = {}) {
  return (
    <>
      <StatusAnnouncer />
      <Box className={[styles.root, className]} {...props}>
        <VolumeIndicator />
        <StatusIndicator />
        {playback && <PlaybackStatusIndicator />}
      </Box>
    </>
  );
}
