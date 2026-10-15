import type { VjscNode } from 'vjsc/components';

import { CaptionsToggle } from './captions-button';
import { ControlsContent, type ControlsSlots } from './controls';
import { ScreenControls } from './screen-controls';

export function VideoControlsContent({
  center = false,
  live = false,
  menu,
  renderThumbnail,
  seekBackward,
  seekForward,
}: ControlsSlots & {
  center?: boolean;
  live?: boolean;
  menu?: VjscNode;
} = {}) {
  return (
    <ControlsContent
      captions={!live && <CaptionsToggle />}
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
