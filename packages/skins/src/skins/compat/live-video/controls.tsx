import * as $ from '@videojs/core/vjsc';
import type { FCastSender } from '@videojs/fcast';

import { CaptionsMenu } from '../shared/captions-menu';
import { VideoControlsContent } from '../shared/video-controls';

export function LiveVideoControls({
  fcast,
}: {
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
      <VideoControlsContent center live menu={<CaptionsMenu />} fcast={fcast} />
    </$.Controls.Root>
  );
}
