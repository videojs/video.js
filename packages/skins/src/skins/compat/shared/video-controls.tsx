import type { VjscNode } from 'vjsc/components';

import { ControlsContent, type ControlsSlots } from './controls';
import { ScreenControls } from './screen-controls';

export function VideoControlsContent({
  center = false,
  live = false,
  menu,
  renderThumbnail,
  seekBackward,
  seekForward,
}: ControlsSlots & { center?: boolean; live?: boolean; menu?: VjscNode } = {}) {
  return (
    <ControlsContent
      center={center}
      live={live}
      menu={menu}
      renderThumbnail={renderThumbnail}
      seekBackward={seekBackward}
      seekForward={seekForward}
      top={<ScreenControls />}
    />
  );
}
