import * as $ from '@videojs/core/vjsc';
import type { VjscNode } from 'vjsc/components';

import { ControlsContent, type ControlsSlots } from './controls';
import controlsStyles from './controls.styles';
import { ScreenControls } from './screen-controls';
import { Title } from './title';
import { VideoBufferingIndicator } from './video-feedback';

export function VideoControlsContent({
  center = false,
  live = false,
  menu,
  renderThumbnail,
  seekBackward,
  seekForward,
}: ControlsSlots & { center?: boolean; live?: boolean; menu?: VjscNode } = {}) {
  return (
    <>
      <$.Controls.Backdrop className={controlsStyles.backdrop} />
      <VideoBufferingIndicator />
      <ControlsContent
        center={center}
        live={live}
        menu={menu}
        renderThumbnail={renderThumbnail}
        seekBackward={seekBackward}
        seekForward={seekForward}
        top={
          <>
            <Title />
            <ScreenControls />
          </>
        }
      />
    </>
  );
}
