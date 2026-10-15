import * as $ from '@videojs/core/vjsc';

import controlsStyles from '../shared/controls.styles';
import { SeekButton } from '../shared/seek-button';
import { SettingsMenu } from '../shared/settings-menu';
import type { ThumbnailSlot } from '../shared/time-slider';
import { VideoControlsContent } from '../shared/video-controls';

export function VideoControls({ renderThumbnail }: ThumbnailSlot = {}) {
  return (
    <$.Controls.Root>
      <VideoControlsContent
        center
        menu={<SettingsMenu />}
        renderThumbnail={renderThumbnail}
        seekBackward={
          <SeekButton
            className={[controlsStyles.centerButton, controlsStyles.centerSeek]}
            iconClassName={controlsStyles.centerSeekIcon}
            seconds={-10}
            tooltip={false}
          />
        }
        seekForward={
          <SeekButton
            className={[controlsStyles.centerButton, controlsStyles.centerSeek]}
            iconClassName={controlsStyles.centerSeekIcon}
            seconds={10}
            tooltip={false}
          />
        }
      />
    </$.Controls.Root>
  );
}
