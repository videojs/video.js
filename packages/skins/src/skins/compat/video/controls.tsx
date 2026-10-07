import * as $ from '@videojs/core/vjsc';
import type { FCastSender } from '@videojs/fcast';

import controlsStyles from '../shared/controls.styles';
import { SeekButton } from '../shared/seek-button';
import { SettingsMenu } from '../shared/settings-menu';
import type { ThumbnailSlot } from '../shared/time-slider';
import { VideoControlsContent } from '../shared/video-controls';

export function VideoControls({
  renderThumbnail,
  fcast,
}: ThumbnailSlot & {
  fcast?:
    | {
        sender?: FCastSender | undefined;
        src?: string | undefined;
        contentType?: string | undefined;
      }
    | undefined;
} = {}) {
  return (
    <$.Controls.Root>
      <VideoControlsContent
        center
        menu={<SettingsMenu />}
        renderThumbnail={renderThumbnail}
        fcast={fcast}
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
