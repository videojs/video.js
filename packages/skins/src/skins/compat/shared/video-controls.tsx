import * as $ from '@videojs/core/vjsc';
import type { FCastSender } from '@videojs/fcast';
import type { VjscNode } from 'vjsc/components';

import { ControlsContent, type ControlsSlots } from './controls';
import controlsStyles from './controls.styles';
import { ScreenControls } from './screen-controls';

export function VideoControlsContent({
  center = false,
  live = false,
  menu,
  renderThumbnail,
  seekBackward,
  seekForward,
  fcast,
}: ControlsSlots & {
  center?: boolean;
  live?: boolean;
  menu?: VjscNode;
  fcast?:
    | {
        sender?: FCastSender | undefined;
        src?: string | undefined;
        contentType?: string | undefined;
      }
    | undefined;
} = {}) {
  return (
    <>
      <$.Controls.Backdrop className={controlsStyles.backdrop} />
      <ControlsContent
        center={center}
        live={live}
        menu={menu}
        renderThumbnail={renderThumbnail}
        seekBackward={seekBackward}
        seekForward={seekForward}
        top={<ScreenControls fcast={fcast} />}
      />
    </>
  );
}
